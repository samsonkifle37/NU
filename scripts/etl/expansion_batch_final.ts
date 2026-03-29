/**
 * CONTROLLED EXPANSION — Final Pre-Productization Batch
 * 
 * Targets: restaurants, cafes, attractions, hotels natively from OSM
 * Source: Overpass API (Addis wide)
 * Publish Gate: coordinates + category
 * Bounding Box: Entire Addis Ababa metropolitan area
 * Batch Size: Max 600 new listings to reach ~1,200 total
 */
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

const BATCH_SIZE = 500;

// Haversine distance in meters
function getDistanceM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchExpansionData() {
    console.log("Fetching Final Pre-1200 Batch. Expanding Addis Wide...");
    
    // Addis wide bounds: lat 8.7 to 9.2, lng 38.6 to 39.0
    // Grabbing more hotel/guesthouse since OTA adapter works well
    const query = `
        [out:json][timeout:60];
        (
          node["amenity"="restaurant"](8.80,38.60,9.15,38.95);
          node["amenity"="cafe"](8.80,38.60,9.15,38.95);
          node["amenity"="fast_food"](8.80,38.60,9.15,38.95);
          node["tourism"="hotel"](8.80,38.60,9.15,38.95);
          node["tourism"="guest_house"](8.80,38.60,9.15,38.95);
          node["tourism"="hostel"](8.80,38.60,9.15,38.95);
          node["tourism"="museum"](8.80,38.60,9.15,38.95);
          node["tourism"="attraction"](8.80,38.60,9.15,38.95);
          way["amenity"="restaurant"](8.80,38.60,9.15,38.95);
          way["tourism"="hotel"](8.80,38.60,9.15,38.95);
        );
        out body 1200;
        >;
        out skel qt;
    `;
    
    // OSM ways need center coords, but we'll stick to nodes and nodes inside ways if they have lat/lon, or simplify to node extraction
    const safeQuery = `
        [out:json][timeout:30];
        (
          node["amenity"="restaurant"](8.80,38.60,9.15,38.95);
          node["amenity"="cafe"](8.80,38.60,9.15,38.95);
          node["tourism"="hotel"](8.80,38.60,9.15,38.95);
          node["tourism"="guest_house"](8.80,38.60,9.15,38.95);
        );
        out body 1000;
    `;
    
    const response = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(safeQuery)}`);
    const elements = response.data.elements || [];
    
    console.log(`Received ${elements.length} raw elements from Overpass.`);
    
    return elements.filter((el: any) => {
        const name = el.tags?.name || el.tags?.['name:en'];
        return name && name !== 'Unknown Place' && name.length > 2;
    }).map((el: any) => ({
        name: el.tags.name || el.tags['name:en'],
        category: el.tags.tourism || el.tags.amenity || 'place',
        lat: el.lat,
        lng: el.lon,
        phone: el.tags.phone || el.tags['contact:phone'] || null,
        website: el.tags.website || el.tags['contact:website'] || null,
        address: el.tags['addr:full'] || el.tags['addr:street'] || null,
        osmId: el.id,
        rawTags: el.tags
    }));
}

function normalizeType(category: string): string {
    const c = category.toLowerCase();
    if (['restaurant', 'fast_food'].includes(c)) return 'restaurant';
    if (c === 'cafe') return 'cafe';
    if (['hotel', 'hostel'].includes(c)) return 'hotel';
    if (c === 'guest_house') return 'guesthouse';
    if (['museum', 'attraction', 'viewpoint'].includes(c)) return 'museum';
    return 'restaurant'; 
}

async function isDuplicate(name: string, lat: number, lng: number): Promise<boolean> {
    const candidates = await prisma.place.findMany({
        where: {
            latitude: { gte: lat - 0.015, lte: lat + 0.015 },
            longitude: { gte: lng - 0.015, lte: lng + 0.015 }
        },
        select: { name: true, latitude: true, longitude: true }
    });

    for (const c of candidates) {
        if (!c.latitude || !c.longitude) continue;
        const dist = getDistanceM(lat, lng, c.latitude, c.longitude);
        if (dist < 150) { // Slightly looser duplicate radius for the big push
            const a = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const b = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (a === b || a.includes(b) || b.includes(a)) {
                return true;
            }
        }
    }
    return false;
}

async function runExpansion() {
    console.log("=== PHASE 7 EXPANSION — BATCH 3 ===");
    console.log(`Target: +${BATCH_SIZE} listings\n`);

    const raw = await fetchExpansionData();
    console.log(`Eligible candidates after name filter: ${raw.length}\n`);

    let inserted = 0;
    let skippedDuplicate = 0;
    let skippedNoCoords = 0;
    let skippedOutOfBounds = 0;

    for (const item of raw) {
        if (inserted >= BATCH_SIZE) break;

        // GATE 1: Must have coordinates
        if (!item.lat || !item.lng) {
            skippedNoCoords++;
            continue;
        }

        // GATE 2: Must be within Addis Ababa bounds
        if (item.lat < 8.7 || item.lat > 9.3 || item.lng < 38.5 || item.lng > 39.0) {
            skippedOutOfBounds++;
            continue;
        }

        // Deduplication check
        const dup = await isDuplicate(item.name, item.lat, item.lng);
        if (dup) {
            skippedDuplicate++;
            continue;
        }

        // Check if slug already exists
        let slug = slugify(`${item.name} addis-ababa`, { lower: true, strict: true });
        let counter = 1;
        while (await prisma.place.findUnique({ where: { slug } })) {
            slug = `${slugify(`${item.name} addis-ababa`, { lower: true, strict: true })}-${counter}`;
            counter++;
        }

        let phone = item.phone ? item.phone.replace(/[^0-9+]/g, '') : null;
        if (phone && phone.startsWith('0')) {
            phone = '+251' + phone.substring(1);
        }

        await prisma.place.create({
            data: {
                name: item.name,
                slug,
                type: normalizeType(item.category),
                city: 'Addis Ababa',
                country: 'Ethiopia',
                latitude: item.lat,
                longitude: item.lng,
                phone,
                websiteUrl: item.website,
                fullAddress: item.address,
                status: 'APPROVED', 
                verificationScore: 10,
                verificationLevel: 10,
                source: 'expansion-batch-3',
            }
        });

        try {
            await prisma.placeSource.create({
                data: {
                    placeId: (await prisma.place.findUnique({ where: { slug } }))!.id,
                    url: `https://www.openstreetmap.org/node/${item.osmId}`,
                    sourceName: 'OpenStreetMap',
                    sourceType: 'Tier B',
                    rawJson: item.rawTags
                }
            });
        } catch (e) { }

        inserted++;
        if (inserted % 50 === 0) console.log(`  ✓ Inserted ${inserted} listings...`);
    }

    console.log(`\n=== EXPANSION BATCH 3 COMPLETE ===`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped (duplicate): ${skippedDuplicate}`);

    const totalPlaces = await prisma.place.count({ where: { status: 'APPROVED' } });
    console.log(`\nTotal approved listings: ${totalPlaces} (Goal: 1000-1200)`);

    await prisma.$disconnect();
    pool.end();
}

runExpansion().catch(console.error);
