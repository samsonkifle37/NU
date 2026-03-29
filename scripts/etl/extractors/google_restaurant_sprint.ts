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

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function run() {
    console.log("=== TRACK A: RESTAURANT GOOGLE SPRINT ===");

    if (!GOOGLE_API_KEY) {
        console.error("GOOGLE_PLACES_API_KEY not set.");
        process.exit(1);
    }

    // Target ONLY restaurants and cafes — the proven categories
    const places = await prisma.place.findMany({
        where: {
            type: { in: ['restaurant', 'cafe', 'coffee', 'club', 'nightlife'] },
            status: 'APPROVED'
        },
        include: { images: true }
    });

    console.log(`Found ${places.length} target listings.`);

    let processed = 0;
    let matched = 0;
    let queued = 0;
    let rejected = 0;
    let skippedAlready = 0;
    let noMatch = 0;
    let noPhotos = 0;

    const MAX_PHOTOS_PER_PLACE = 3;

    for (const place of places) {
        // Skip places that already have 3+ real approved images
        const realApproved = (place as any).images.filter(
            (i: any) => i.imageTruthType === 'place_real' && i.status === 'APPROVED'
        ).length;
        if (realApproved >= MAX_PHOTOS_PER_PLACE) {
            skippedAlready++;
            continue;
        }

        processed++;
        const query = `${place.name} Addis Ababa Ethiopia`;
        
        // Rate limit: 100ms between calls
        await new Promise(r => setTimeout(r, 100));

        try {
            const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,geometry,photos,types&key=${GOOGLE_API_KEY}`;
            const res = await axios.get(searchUrl, { timeout: 8000 });

            if (res.data.status !== 'OK' || !res.data.candidates?.length) {
                noMatch++;
                continue;
            }

            const candidate = res.data.candidates[0];

            // Strict coordinate match: 500m max
            if (place.latitude && place.longitude && candidate.geometry?.location) {
                const dist = haversine(place.latitude, place.longitude, candidate.geometry.location.lat, candidate.geometry.location.lng);
                if (dist > 0.5) {
                    rejected++;
                    console.log(`  ✗ ${place.name} — rejected (${dist.toFixed(2)}km away)`);
                    continue;
                }
            }

            const photos = candidate.photos || [];
            if (!photos.length) {
                noPhotos++;
                continue;
            }

            matched++;
            const slotsAvailable = MAX_PHOTOS_PER_PLACE - realApproved;
            const photosToFetch = Math.min(photos.length, slotsAvailable);

            console.log(`  ✓ ${place.name} — ${photosToFetch} photos queued`);

            for (let i = 0; i < photosToFetch; i++) {
                const ref = photos[i].photo_reference;
                const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${ref}&key=${GOOGLE_API_KEY}`;

                // Deduplicate by URL (photo_reference is unique per photo)
                const exists = await prisma.placeImage.findFirst({
                    where: { placeId: place.id, imageUrl: photoUrl }
                });
                if (exists) continue;

                // Also check if we already have a Google image with same reference substring
                const refExists = await prisma.placeImage.findFirst({
                    where: { placeId: place.id, imageSource: 'google_places', imageUrl: { contains: ref.substring(0, 40) } }
                });
                if (refExists) continue;

                await prisma.placeImage.create({
                    data: {
                        placeId: place.id,
                        imageUrl: photoUrl,
                        sourcePageUrl: `https://maps.google.com/?cid=${candidate.place_id}`,
                        imageSource: 'google_places',
                        imageTruthType: 'place_real',
                        status: 'PENDING',
                        qualityScore: 60,
                        labels: ['ugc-google']
                    }
                });
                queued++;
            }
        } catch (error: any) {
            if (error.response?.status === 429) {
                console.log("  ⚠ Rate limited — waiting 2s");
                await new Promise(r => setTimeout(r, 2000));
            } else {
                console.log(`  ⚠ ${place.name}: ${error.message}`);
            }
        }
    }

    console.log(`\n=== RESTAURANT SPRINT COMPLETE ===`);
    console.log(`Processed: ${processed}`);
    console.log(`Matched: ${matched}`);
    console.log(`Images Queued: ${queued}`);
    console.log(`Rejected (distance): ${rejected}`);
    console.log(`No Google Match: ${noMatch}`);
    console.log(`Match but no photos: ${noPhotos}`);
    console.log(`Skipped (already enriched): ${skippedAlready}`);

    await prisma.$disconnect();
    pool.end();
}

run().catch(console.error);
