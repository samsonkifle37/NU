import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Strict distance calculation (Haversine)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export async function fetchGooglePlacesImages() {
    console.log("=== STARTING GOOGLE PLACES ENRICHMENT ===");
    
    if (!GOOGLE_API_KEY) {
        console.warn("WARNING: GOOGLE_PLACES_API_KEY is not set. Generating mock enrichment structure for QA.");
        // We will output the correct logs but skip actual mapping so the user can provide the API key.
    }

    // Target low web presence categories
    const targetTypes = ['restaurant', 'cafe', 'club', 'nightlife', 'transport'];
    
    const places = await prisma.place.findMany({
        where: {
            type: { in: targetTypes },
            status: 'APPROVED'
        },
        include: { images: { where: { status: 'APPROVED' } } }
    });

    console.log(`Found ${places.length} target places in low-web-presence categories.`);

    const limitPerRun = 60; // Expanded for validation cycle
    let processed = 0;
    let foundImages = 0;

    for (const place of places) {
        if (processed >= limitPerRun) break;
        if (place.images.length >= 3) continue; // Skip if already well enriched natively

        processed++;
        const query = `${place.name} Addis Ababa`;
        console.log(`[Google API] Searching: ${query}`);

        if (!GOOGLE_API_KEY) continue;

        try {
            // Step 1: Strict match via text search
            const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,geometry,photos,types&key=${GOOGLE_API_KEY}`;
            const res = await axios.get(searchUrl);
            
            if (res.data.status !== 'OK' || !res.data.candidates || res.data.candidates.length === 0) {
                console.log(`   -> No Google Places match found.`);
                continue;
            }

            const candidate = res.data.candidates[0];

            // Strict Coordinate Match (Must be < 500m)
            if (place.latitude && place.longitude && candidate.geometry?.location) {
                const distKm = getDistanceFromLatLonInKm(place.latitude, place.longitude, candidate.geometry.location.lat, candidate.geometry.location.lng);
                if (distKm > 0.5) {
                    console.log(`   -> Rejected: Distance too far (${distKm.toFixed(2)}km)`);
                    continue;
                }
            }

            const candidatePhotos = candidate.photos || [];
            if (candidatePhotos.length === 0) {
                console.log(`   -> Match found but no photos associated on Google.`);
                continue;
            }

            console.log(`   -> Strict Match! Found ${candidatePhotos.length} Google photos.`);

            // Step 2: Queue photos to DB
            let inserted = 0;
            for (const photo of candidatePhotos) {
                if (inserted >= 5) break; // Max 5 Google photos per place to prevent bloat

                const refId = photo.photo_reference;
                const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${refId}&key=${GOOGLE_API_KEY}`;
                
                // Prevent duplicate inserts
                const exists = await prisma.placeImage.findFirst({ where: { placeId: place.id, imageUrl: photoUrl } });
                if (!exists) {
                    await prisma.placeImage.create({
                        data: {
                            placeId: place.id,
                            imageUrl: photoUrl,
                            sourcePageUrl: `https://maps.google.com/?cid=${candidate.place_id}`,
                            imageSource: 'google_places',
                            imageTruthType: 'place_real', // Compliant real business photo
                            status: 'PENDING',
                            qualityScore: 60, // Trustworthy UGC source
                            labels: ['ugc-google']
                        }
                    });
                    inserted++;
                    foundImages++;
                }
            }
        } catch (error: any) {
            console.error(`   -> Google API Error for ${place.name}: ${error.message}`);
        }
    }

    console.log(`\nGoogle Enrichment Complete.`);
    console.log(`Processed: ${processed} places`);
    console.log(`Queued Images: ${foundImages}`);

    await prisma.$disconnect();
    pool.end();
}

fetchGooglePlacesImages().catch(console.error);
