import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import axios from 'axios';
import slugify from 'slugify';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// ── TYPES ─────────────────────────────────────────────────────────
export interface RawPlace {
    sourceName: string;
    sourceType: "Tier A" | "Tier B" | "Tier C";
    url: string;
    category: string;
    name: string;
    city: string;
    address?: string;
    lat?: number;
    lng?: number;
    phone?: string;
    website?: string;
    images: string[];
    rawJson: any;
}

// ── 1. SOURCE ADAPTERS ────────────────────────────────────────────

// ADAPTER 1: Overpass API (OpenStreetMap) - Tier B Maps
export async function fetchOverpassPlaces(): Promise<RawPlace[]> {
    console.log("Fetching Overpass API places for Addis Ababa...");
    const query = `
        [out:json][timeout:25];
        (
          node["tourism"="hotel"](8.83,38.65,9.09,38.90);
          node["amenity"="restaurant"](8.83,38.65,9.09,38.90);
          node["tourism"="museum"](8.83,38.65,9.09,38.90);
          node["tourism"="attraction"](8.83,38.65,9.09,38.90);
          node["amenity"="nightclub"](8.83,38.65,9.09,38.90);
          node["amenity"="bar"](8.83,38.65,9.09,38.90);
          node["amenity"="lounge"](8.83,38.65,9.09,38.90);
          node["amenity"="car_rental"](8.83,38.65,9.09,38.90);
          node["amenity"="taxi"](8.83,38.65,9.09,38.90);
        );
        out body 150;
    `;
    const response = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const elements = response.data.elements || [];
    
    return elements.map((el: any) => ({
        sourceName: "OpenStreetMap",
        sourceType: "Tier B",
        url: `https://www.openstreetmap.org/node/${el.id}`,
        category: el.tags.tourism || el.tags.amenity || "place",
        name: el.tags.name || el.tags['name:en'] || "Unknown Place",
        city: "Addis Ababa",
        address: el.tags['addr:full'] || el.tags['addr:street'],
        lat: el.lat,
        lng: el.lon,
        phone: el.tags.phone || el.tags['contact:phone'],
        website: el.tags.website || el.tags['contact:website'],
        images: [], // OSM rarely has direct images
        rawJson: el
    })).filter((p: RawPlace) => p.name !== "Unknown Place");
}

// ADAPTER 2: Mock High-Value Source (OTA / Official combinations)
// This will purposely generate duplicates of top Addis places to test deduplication.
export function fetchMockOtaData(): RawPlace[] {
    console.log("Fetching Mock OTA / Premium Data...");
    return [
        {
            sourceName: "BookingMock",
            sourceType: "Tier B",
            url: "https://booking.mock/sheraton-addis",
            category: "hotel",
            name: "Sheraton Addis, a Luxury Collection Hotel",
            city: "Addis Ababa",
            lat: 9.0152, // slightly offset
            lng: 38.7601,
            address: "Taitu Street, Kirkos",
            phone: "+251 11 517 1717",
            website: "https://www.marriott.com/sheraton-addis",
            images: ["https://images.unsplash.com/photo-1542314831-c6a4d14d8c85?w=800&q=80"],
            rawJson: { booking_id: "SHER-123" }
        },
        {
            sourceName: "GoogleMapsMock",
            sourceType: "Tier A",
            url: "https://maps.google.mock/ethiopian-national-museum",
            category: "museum",
            name: "National Museum of Ethiopia",
            city: "Addis Ababa",
            lat: 9.0383,
            lng: 38.7617,
            address: "King George VI St",
            phone: "+251 11 111 7150",
            website: "",
            images: ["https://images.unsplash.com/photo-1572251397839-8664ecb90906?w=800&q=80"],
            rawJson: { place_id: "ChIJxxxx" }
        },
        {
            sourceName: "TripAdvisorMock",
            sourceType: "Tier B",
            url: "https://tripadvisor.mock/habesha-2000",
            category: "restaurant",
            name: "2000 Habesha Cultural Restaurant",
            city: "Addis Ababa",
            lat: 8.9950,
            lng: 38.7850,
            phone: "0116611000",
            images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"],
            rawJson: { ta_id: "TA-999" }
        }
    ];
}

// ── 2. NORMALIZATION ENGINE ───────────────────────────────────────
export function normalize(raw: RawPlace) {
    // Normalize phone
    let phone = raw.phone ? raw.phone.replace(/[^0-9+]/g, '') : null;
    if (phone && phone.startsWith('0')) {
        phone = '+251' + phone.substring(1);
    }
    
    // Create base slug
    const normalizedSlug = slugify(`${raw.name} ${raw.city}`, { lower: true, strict: true });
    
    // Standardize category
    let type = "place";
    if (['hotel', 'guest_house', 'hostel', 'resort'].includes(raw.category.toLowerCase())) type = "hotel";
    if (['restaurant', 'cafe', 'bar', 'pub', 'food', 'lounge', 'nightclub'].includes(raw.category.toLowerCase())) type = "restaurant";
    if (['museum', 'attraction', 'viewpoint', 'cultural'].includes(raw.category.toLowerCase())) type = "museum";
    if (['taxi', 'car_rental', 'transport'].includes(raw.category.toLowerCase())) type = "transport";

    // Enforce Addis Ababa Bounding Box Hard Stop
    let isOutOfBounds = false;
    if (raw.lat && raw.lng) {
        if (raw.lat < 8.7 || raw.lat > 9.3 || raw.lng < 38.5 || raw.lng > 39.0) {
            isOutOfBounds = true;
        }
    }

    return {
        ...raw,
        normalizedPhone: phone,
        slug: normalizedSlug,
        type: type,
        isOutOfBounds
    };
}

// ── 3. DEDUPLICATION ENGINE ───────────────────────────────────────
// Haversine distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; 
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Calculate similarity score (0-100)
export async function findDuplicate(candidate: ReturnType<typeof normalize>, prisma: PrismaClient) {
    // Basic search in DB for nearby or similar named places
    // For scale, we fetch places in the same city.
    const places = await prisma.place.findMany({
        where: { city: candidate.city }
    });

    for (const dbPlace of places) {
        let score = 0;
        
        // Exact phone match = High confidence
        if (candidate.normalizedPhone && candidate.normalizedPhone === dbPlace.phone) {
            score += 40;
        }

        // Distance check
        if (candidate.lat && candidate.lng && dbPlace.latitude && dbPlace.longitude) {
            const dist = getDistance(candidate.lat, candidate.lng, dbPlace.latitude, dbPlace.longitude);
            if (dist < 100) score += 30;
            else if (dist < 500) score += 10;
        }

        // Name similarity (Basic mock, would use Jaro-Winkler in prod)
        if (dbPlace.name.toLowerCase() === candidate.name.toLowerCase()) {
            score += 30;
        } else if (dbPlace.slug === candidate.slug || candidate.slug.includes(dbPlace.slug) || dbPlace.slug.includes(candidate.slug)) {
             score += 20;
        }

        // Same category
        if (dbPlace.type === candidate.type) {
             score += 10;
        }

        if (score >= 60) {
            return { action: 'MERGE', masterId: dbPlace.id, score };
        } else if (score >= 40) {
            return { action: 'QUEUE_MODERATION', masterId: dbPlace.id, score };
        }
    }
    
    return { action: 'NEW', masterId: null, score: 0 };
}

// ── 4. VERIFICATION ENGINE ────────────────────────────────────────
export async function calculateVerification(placeId: string, prisma: PrismaClient) {
    const place = await prisma.place.findUnique({
        where: { id: placeId },
        include: { placeSources: true, images: true }
    });
    
    if (!place) return;

    let previousScore = place.verificationScore || 0;
    let score = 0;
    let reasons: string[] = [];

    // Rule 1: Source Count & Tiers
    const sources = place.placeSources || [];
    if (sources.length >= 2) { score += 15; reasons.push("Found on multiple sources (+15)"); }
    if (sources.some(s => s.sourceType === "Tier A")) { score += 20; reasons.push("Tier A source verified (+20)"); }
    else if (sources.some(s => s.sourceType === "Tier B")) { score += 10; reasons.push("Tier B source verified (+10)"); }

    // Rule 2: Metadata completeness
    if (place.phone) { score += 10; reasons.push("Phone number present (+10)"); }
    if (place.websiteUrl) { score += 10; reasons.push("Website URL present (+10)"); }
    if (place.latitude && place.longitude) { score += 10; reasons.push("Coordinates valid (+10)"); }
    if (place.images.length > 0) { score += 5; reasons.push("Has primary image (+5)"); }

    // Cap score at 100
    score = Math.min(score, 100);
    
    // Calculate Level
    let level = 10; // hidden
    if (score >= 85) level = 85;
    else if (score >= 70) level = 70;
    else if (score >= 50) level = 50;
    else if (score >= 30) level = 30;

    await prisma.place.update({
        where: { id: placeId },
        data: { verificationScore: score, verificationLevel: level, claimable: true }
    });

    if (score !== previousScore) {
        await prisma.verificationLog.create({
            data: {
                placeId: placeId,
                scoreChange: score - previousScore,
                reason: reasons.join(' | '),
                newScore: score
            }
        });
    }
    
    return { score, level };
}

// ── 5. PIPELINE EXECUTION ─────────────────────────────────────────
async function runPipeline() {
    console.log("=== STARTING NU 10,000 PLACES PIPELINE ===");

    try {
        // Stage 1: Extraction
        const rawOverpass = await fetchOverpassPlaces();
        const rawOta = fetchMockOtaData();
        const allRaw = [...rawOta, ...rawOverpass]; // OTA first to act as master records
        
        console.log(`Ingested ${allRaw.length} raw records from sources.`);
        
        let newCount = 0;
        let mergeCount = 0;
        let queueCount = 0;

        for (const raw of allRaw) {
            // Stage 2: Normalization
            const norm = normalize(raw);

            // Phase 4C: Hard drop out of bounds
            if (norm.isOutOfBounds) {
                console.log(`[BLOCKED] ${norm.name} is outside Addis Ababa coordinates.`);
                continue;
            }

            // Stage 3: Deduplication
            const dupCheck = await findDuplicate(norm, prisma);
            
            let targetPlaceId = null;

            if (dupCheck.action === 'MERGE' && dupCheck.masterId) {
                targetPlaceId = dupCheck.masterId;
                mergeCount++;
                console.log(`[MERGE] Merging '${norm.name}' into master ID: ${targetPlaceId} (Score: ${dupCheck.score})`);
                
                // Update master if new source has better info
                const updateData: any = {};
                if (!norm.website && norm.website) updateData.websiteUrl = norm.website;
                if (!norm.normalizedPhone && norm.normalizedPhone) updateData.phone = norm.normalizedPhone;
                
                if (Object.keys(updateData).length > 0) {
                    await prisma.place.update({
                        where: { id: targetPlaceId },
                        data: updateData
                    });
                }
            } 
            else if (dupCheck.action === 'QUEUE_MODERATION' && dupCheck.masterId) {
                queueCount++;
                console.log(`[QUEUE] Candidate '${norm.name}' flagged for review. Master ID: ${dupCheck.masterId} (Score: ${dupCheck.score})`);
                
                // Add to DuplicateCandidate
                await prisma.duplicateCandidate.create({
                    data: {
                        masterPlaceId: dupCheck.masterId,
                        duplicateId: 'pending-' + Date.now().toString(),
                        similarityScore: dupCheck.score,
                        status: 'PENDING'
                    }
                });
                
                // Proceed to insert as a NEW place since it's not confirmed merge
                targetPlaceId = null;
            }

            if (!targetPlaceId && dupCheck.action !== 'MERGE') {
                targetPlaceId = null;
            }

            if (!targetPlaceId) {
                // Determine a unique slug
                let safeSlug = norm.slug;
                let counter = 1;
                while (await prisma.place.findUnique({ where: { slug: safeSlug } })) {
                    safeSlug = `${norm.slug}-${counter}`;
                    counter++;
                }

                // Insert new Place!
                const newPlace = await prisma.place.create({
                    data: {
                        name: norm.name,
                        slug: safeSlug,
                        type: norm.type,
                        city: norm.city,
                        fullAddress: norm.address,
                        phone: norm.normalizedPhone,
                        websiteUrl: norm.website,
                        latitude: norm.lat,
                        longitude: norm.lng,
                        status: "APPROVED",
                        verificationScore: 10, // base initially
                        verificationLevel: 10,
                    }
                });
                targetPlaceId = newPlace.id;
                newCount++;
            }

            // Stage 4: Associate Source
            if (targetPlaceId) {
                try {
                    await prisma.placeSource.upsert({
                        where: {
                            placeId_url: { placeId: targetPlaceId, url: norm.url }
                        },
                        update: { scrapedAt: new Date(), rawJson: norm.rawJson },
                        create: {
                            placeId: targetPlaceId,
                            url: norm.url,
                            sourceName: norm.sourceName,
                            sourceType: norm.sourceType,
                            rawJson: norm.rawJson
                        }
                    });
                } catch (e) {
                    // Ignore duplicate constraint failures safely
                }

                // Append images
                if (norm.images.length > 0) {
                    for (const imgUrl of norm.images) {
                        try {
                            await prisma.placeImage.create({
                                data: {
                                    placeId: targetPlaceId,
                                    imageUrl: imgUrl,
                                    imageSource: norm.sourceName
                                }
                            });
                        } catch (e) { }
                    }
                }

                // Stage 5: Verification Engine Execution
                await calculateVerification(targetPlaceId, prisma);
            }
        }

        console.log(`=== PIPELINE COMPLETE ===`);
        console.log(`New Places Minted: ${newCount}`);
        console.log(`Places Merged Automatically: ${mergeCount}`);
        console.log(`Candidates Queued for Moderation: ${queueCount}`);

    } catch (err) {
        console.error("Pipeline failed:", err);
    } finally {
        await prisma.$disconnect();
        pool.end();
    }
}

runPipeline();
