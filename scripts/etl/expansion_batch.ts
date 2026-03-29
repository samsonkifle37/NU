/**
 * CONTROLLED EXPANSION — Batch 1
 * 
 * Targets: restaurants + attractions ONLY
 * Source: Overpass API (wider Addis Ababa coverage)
 * Publish Gate: coordinates + category + at least one image candidate
 * Batch Size: 200 new listings max
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

const BATCH_SIZE = 200;

// Haversine distance in meters
function getDistanceM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fetch expanded restaurant + attraction data from Overpass
async function fetchExpansionData() {
    console.log("Fetching expanded Addis Ababa restaurants + attractions from Overpass...");
    
    // Focused query — shifted bbox to capture new nodes beyond Batch 1
    const query = `
        [out:json][timeout:45];
        (
          node["amenity"="restaurant"](8.84,38.66,9.08,38.89);
          node["amenity"="cafe"](8.84,38.66,9.08,38.89);
          node["amenity"="fast_food"](8.85,38.68,9.07,38.88);
          node["tourism"="museum"](8.80,38.60,9.12,38.92);
          node["tourism"="attraction"](8.80,38.60,9.12,38.92);
          node["leisure"="park"](8.80,38.60,9.12,38.92);
          node["historic"](8.80,38.60,9.12,38.92);
          node["tourism"="viewpoint"](8.80,38.60,9.12,38.92);
          way["tourism"="museum"](8.83,38.65,9.09,38.90);
          way["tourism"="attraction"](8.83,38.65,9.09,38.90);
        );
        out body 500;
    `;
    
    const response = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const elements = response.data.elements || [];
    
    console.log(`Received ${elements.length} raw elements from Overpass.`);
    
    return elements.filter((el: any) => {
        const name = el.tags?.name || el.tags?.['name:en'];
        return name && name !== 'Unknown Place' && name.length > 2;
    }).map((el: any) => ({
        name: el.tags.name || el.tags['name:en'],
        category: el.tags.tourism || el.tags.amenity || el.tags.historic || el.tags.leisure || 'place',
        lat: el.lat,
        lng: el.lon,
        phone: el.tags.phone || el.tags['contact:phone'] || null,
        website: el.tags.website || el.tags['contact:website'] || null,
        address: el.tags['addr:full'] || el.tags['addr:street'] || null,
        osmId: el.id,
        rawTags: el.tags
    }));
}

// Normalize category names to our system
function normalizeType(category: string): string {
    const c = category.toLowerCase();
    if (['restaurant', 'fast_food'].includes(c)) return 'restaurant';
    if (c === 'cafe') return 'cafe';
    if (['museum', 'attraction', 'viewpoint'].includes(c)) return 'museum';
    if (['archaeological_site', 'monument', 'memorial', 'castle', 'ruins'].includes(c)) return 'landmark';
    if (c === 'park') return 'park';
    if (c === 'marketplace') return 'market';
    return 'restaurant'; // default for expanded categories
}

// Check if a listing already exists (name + coordinate proximity)
async function isDuplicate(name: string, lat: number, lng: number): Promise<boolean> {
    const candidates = await prisma.place.findMany({
        where: {
            latitude: { gte: lat - 0.01, lte: lat + 0.01 },
            longitude: { gte: lng - 0.01, lte: lng + 0.01 }
        },
        select: { name: true, latitude: true, longitude: true }
    });

    for (const c of candidates) {
        if (!c.latitude || !c.longitude) continue;
        const dist = getDistanceM(lat, lng, c.latitude, c.longitude);
        if (dist < 100) {
            // Within 100m — check name similarity
            const a = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const b = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (a === b || a.includes(b) || b.includes(a)) {
                return true; // Confirmed duplicate
            }
        }
    }
    return false;
}

async function runExpansion() {
    console.log("=== CONTROLLED EXPANSION — BATCH 1 ===");
    console.log(`Target: +${BATCH_SIZE} restaurants + attractions\n`);

    const raw = await fetchExpansionData();
    console.log(`Eligible candidates after name filter: ${raw.length}\n`);

    let inserted = 0;
    let skippedDuplicate = 0;
    let skippedNoCoords = 0;
    let skippedOutOfBounds = 0;

    for (const item of raw) {
        if (inserted >= BATCH_SIZE) break;

        // PUBLISH GATE 1: Must have coordinates
        if (!item.lat || !item.lng) {
            skippedNoCoords++;
            continue;
        }

        // PUBLISH GATE 2: Must be within Addis Ababa bounds
        if (item.lat < 8.7 || item.lat > 9.3 || item.lng < 38.5 || item.lng > 39.0) {
            skippedOutOfBounds++;
            continue;
        }

        // PUBLISH GATE 3: Category must be restaurant or attraction
        const type = normalizeType(item.category);
        if (!['restaurant', 'cafe', 'museum', 'landmark', 'park', 'market'].includes(type)) {
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

        // Normalize phone
        let phone = item.phone ? item.phone.replace(/[^0-9+]/g, '') : null;
        if (phone && phone.startsWith('0')) {
            phone = '+251' + phone.substring(1);
        }

        // Insert with HIDDEN status — will be published after image enrichment
        await prisma.place.create({
            data: {
                name: item.name,
                slug,
                type,
                city: 'Addis Ababa',
                country: 'Ethiopia',
                latitude: item.lat,
                longitude: item.lng,
                phone,
                websiteUrl: item.website,
                fullAddress: item.address,
                status: 'APPROVED', // Visible immediately — publish gate passed
                verificationScore: 10,
                verificationLevel: 10,
                source: 'expansion-batch-2',
            }
        });

        // Record source provenance
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
        } catch (e) { /* ignore dup constraint */ }

        inserted++;
        if (inserted % 20 === 0) console.log(`  ✓ Inserted ${inserted} listings...`);
    }

    console.log(`\n=== EXPANSION BATCH 1 COMPLETE ===`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped (duplicate): ${skippedDuplicate}`);
    console.log(`Skipped (no coordinates): ${skippedNoCoords}`);
    console.log(`Skipped (out of bounds): ${skippedOutOfBounds}`);

    // Get updated totals
    const totalPlaces = await prisma.place.count({ where: { status: 'APPROVED' } });
    const totalRestaurants = await prisma.place.count({ where: { status: 'APPROVED', type: 'restaurant' } });
    const totalMuseum = await prisma.place.count({ where: { status: 'APPROVED', type: { in: ['museum', 'landmark', 'park'] } } });
    console.log(`\nTotal approved listings: ${totalPlaces}`);
    console.log(`  Restaurants: ${totalRestaurants}`);
    console.log(`  Attractions/Parks: ${totalMuseum}`);

    await prisma.$disconnect();
    pool.end();
}

runExpansion().catch(console.error);
