/**
 * Zero Real Image, High Priority Queue
 * 
 * Identifies approved listings that:
 *   - Have zero real (place_real) approved images
 *   - Are high verification / featured / high traffic
 *   - Are currently relying only on representative or placeholder imagery
 * 
 * Output: Ordered priority queue for Google enrichment, manual review, and claim-listing outreach
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function buildQueue() {
    console.log("=== BUILDING ZERO-IMAGE HIGH PRIORITY QUEUE ===\n");

    const places = await prisma.place.findMany({
        where: { status: 'APPROVED' },
        include: { images: true },
        orderBy: [
            { featured: 'desc' },
            { verificationScore: 'desc' },
            { reviewCount: 'desc' }
        ]
    });

    interface QueueEntry {
        id: string;
        name: string;
        type: string;
        verificationScore: number;
        featured: boolean;
        reviewCount: number;
        hasWebsite: boolean;
        hasCoordinates: boolean;
        representativeCount: number;
        priorityScore: number;
    }

    const queue: QueueEntry[] = [];

    for (const place of places) {
        const realApproved = (place as any).images.filter(
            (i: any) => i.imageTruthType === 'place_real' && i.status === 'APPROVED'
        ).length;

        if (realApproved > 0) continue; // Already has real imagery

        const representativeCount = (place as any).images.filter(
            (i: any) => i.imageTruthType === 'representative'
        ).length;

        // Calculate priority score
        let priorityScore = 0;
        if (place.featured) priorityScore += 50;
        priorityScore += Math.min(place.verificationScore, 100); // max 100
        priorityScore += place.reviewCount * 10; // user engagement signal
        if (place.websiteUrl) priorityScore += 15; // has official presence
        if (place.latitude && place.longitude) priorityScore += 10; // can do coordinate match
        if (place.phone) priorityScore += 5;

        queue.push({
            id: place.id,
            name: place.name,
            type: place.type,
            verificationScore: place.verificationScore,
            featured: place.featured,
            reviewCount: place.reviewCount,
            hasWebsite: !!place.websiteUrl,
            hasCoordinates: !!(place.latitude && place.longitude),
            representativeCount,
            priorityScore,
        });
    }

    // Sort by priority score descending
    queue.sort((a, b) => b.priorityScore - a.priorityScore);

    // Generate report
    let out = `=== ZERO REAL IMAGE — HIGH PRIORITY QUEUE ===\n`;
    out += `Generated: ${new Date().toISOString()}\n`;
    out += `Total listings needing real imagery: ${queue.length}\n\n`;

    // Tier 1: Critical (featured or high verification)
    const tier1 = queue.filter(q => q.priorityScore >= 80);
    const tier2 = queue.filter(q => q.priorityScore >= 40 && q.priorityScore < 80);
    const tier3 = queue.filter(q => q.priorityScore < 40);

    out += `── TIER 1: CRITICAL (${tier1.length} listings) ──\n`;
    out += `These should be enriched FIRST via Google Places or manual upload.\n\n`;
    tier1.slice(0, 30).forEach((q, i) => {
        out += `  ${(i + 1).toString().padStart(3)}. [${q.type.toUpperCase().padEnd(12)}] ${q.name.padEnd(40)} Score=${q.priorityScore} VS=${q.verificationScore} ${q.featured ? '⭐FEATURED' : ''} ${q.hasCoordinates ? '📍' : '  '} ${q.hasWebsite ? '🌐' : '  '}\n`;
    });

    out += `\n── TIER 2: IMPORTANT (${tier2.length} listings) ──\n`;
    out += `Enrich after Tier 1 is resolved.\n\n`;
    tier2.slice(0, 20).forEach((q, i) => {
        out += `  ${(i + 1).toString().padStart(3)}. [${q.type.toUpperCase().padEnd(12)}] ${q.name.padEnd(40)} Score=${q.priorityScore} VS=${q.verificationScore}\n`;
    });

    out += `\n── TIER 3: LOW PRIORITY (${tier3.length} listings) ──\n`;
    out += `Background enrichment candidates.\n\n`;

    // Category breakdown
    const typeCounts: any = {};
    queue.forEach(q => {
        typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    });
    out += `\n── CATEGORY BREAKDOWN ──\n`;
    Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]).forEach(t => {
        out += `  ${t.toUpperCase().padEnd(14)}: ${typeCounts[t]} listings need real images\n`;
    });

    // Write outputs
    fs.writeFileSync('tmp/zero_image_queue.txt', out);
    fs.writeFileSync('tmp/zero_image_queue.json', JSON.stringify(queue.slice(0, 100), null, 2));
    console.log(out);

    await prisma.$disconnect();
    pool.end();
}

buildQueue().catch(console.error);
