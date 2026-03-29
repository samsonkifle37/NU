import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import axios from 'axios';
import crypto from 'crypto';
import sizeOf from 'image-size';
import { mirrorImage } from '../../src/lib/supabase-storage';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function processImageBucket() {
    console.log("=== STARTING PHASE 2 IMAGE PIPELINE ===");
    
    // Grab completely pending, unmirrored images
    const pendingImages = await prisma.placeImage.findMany({
        where: { status: 'PENDING', isMirrored: false },
        take: 50 // process in batches
    });

    console.log(`Found ${pendingImages.length} pending images in queue.`);

    for (const image of pendingImages) {
        console.log(`\nProcessing image chunk [${image.id}] - ${image.imageUrl}`);
        try {
            // 1. Fetch image buffer (Timeout 5s) to detect Blocked/403 or 404
            const req = await axios.get(image.imageUrl, {
                responseType: 'arraybuffer',
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
                }
            });

            const buffer = Buffer.from(req.data);
            
            // 2. Hash Duplicate Protection
            const hash = crypto.createHash('md5').update(buffer).digest('hex');
            const dupes = await prisma.placeImage.count({
                where: { hash: hash, id: { not: image.id }, status: 'APPROVED' }
            });

            if (dupes > 0) {
                await updateFailed(image.id, "Duplicate Image Hash Match", hash);
                continue;
            }

            // 3. Size and Dimension Validation
            if (buffer.length < 5000) { // < 5KB is generally a placeholder or icon
                await updateFailed(image.id, "Image buffer too small (<5KB)", hash);
                continue;
            }

            let dimensions;
            try {
                dimensions = sizeOf(buffer);
            } catch (e) {
                await updateFailed(image.id, "Invalid image format", hash);
                continue;
            }

            if (!dimensions || !dimensions.width || !dimensions.height) {
                await updateFailed(image.id, "Could not determine dimensions", hash);
                continue;
            }

            if (dimensions.width < 400 || dimensions.height < 300) {
                await updateFailed(image.id, `Tiny image rejected (${dimensions.width}x${dimensions.height})`, hash);
                continue;
            }
            
            // 4. Score and Quality Labeling
            let qualityScore = 50;
            let labels: string[] = [];

            // Rule 5: Source Trust Weighting
            const urlLower = image.imageUrl.toLowerCase();
            const sourceLower = (image.imageSource || "").toLowerCase();
            if (urlLower.includes("wikimedia") || sourceLower.includes("wikimedia") || sourceLower.includes("official")) {
                qualityScore += 20; // High trust source
                labels.push("official-source");
            } else if (urlLower.includes("tripadvisor") || urlLower.includes("booking")) {
                qualityScore += 10; // Moderate trust
            } else {
                qualityScore -= 5; // Weak third party
            }

            // Rule 3 (Heuristic tagging for category-specific primary rules)
            // Stays
            if (/exterior|facade|outside|building/.test(urlLower)) labels.push("exterior");
            if (/lobby|reception/.test(urlLower)) labels.push("lobby");
            if (/room|bed|suite/.test(urlLower)) labels.push("room");
            
            // Dining
            if (/food|menu|dish|plate/.test(urlLower)) labels.push("food");
            if (/venue|dining|restaurant|inside|interior/.test(urlLower)) labels.push("venue");

            // Tours
            if (/landmark|historic|monument/.test(urlLower)) labels.push("landmark");
            if (/activity|tour|group|people/.test(urlLower)) labels.push("activity");

            // Transport
            if (/vehicle|car|bus|plane|airport/.test(urlLower)) labels.push("vehicle");

            // Heuristics for avoiding weak heroes:
            if (/logo|map|screenshot|pdf|text/.test(urlLower)) {
                qualityScore -= 40;
                labels.push("weak-hero");
            }

            if (dimensions.width > 1200) qualityScore += 30; // High res bonus
            if (dimensions.width > 1920) qualityScore += 10; // Extra bonus
            const aspectRatio = dimensions.width / dimensions.height;
            if (aspectRatio > 1.3 && aspectRatio < 1.8) {
                 qualityScore += 10; // Good landscape ratio
                 labels.push("landscape");
            }
            else if (aspectRatio < 0.8) {
                labels.push("portrait");
                qualityScore -= 10; // Less ideal for hero cards
            }

            // 5. Source-Safe Mirroring to Supabase
            console.log(`Mirroring ${image.imageUrl} to secure bucket...`);
            let mirroredUrl = null;
            try {
                mirroredUrl = await mirrorImage(image.imageUrl, 'verified-assets', `${image.placeId}_${hash.substring(0,8)}`);
            } catch (mirrErr: any) {
                // If mirroring fails but we downloaded it, it's mostly due to bucket perms. Fallback gracefully but don't fail the image.
                console.error("Mirror failed (likely local credentials missing). Resuming without mirror:", mirrErr.message);
                mirroredUrl = null; 
            }

            // 6. DB Approval & Finalization 
            await prisma.placeImage.update({
                where: { id: image.id },
                data: {
                    status: 'APPROVED',
                    isMirrored: mirroredUrl ? true : false,
                    mirroredUrl: mirroredUrl,
                    width: dimensions.width,
                    height: dimensions.height,
                    qualityScore: qualityScore,
                    hash: hash,
                    labels: labels,
                    verifiedAt: new Date()
                }
            });

            console.log(`[APPROVED] Image updated. Score: ${qualityScore}`);

        } catch (error: any) {
            // Hotlink protection or broken link (403/404)
            let reason = error.message;
            if (error.response && error.response.status === 403) reason = "Blocked (403 Forbidden / Hotlink protected)";
            else if (error.response && error.response.status === 404) reason = "Broken URL (404 Not Found)";
            
            console.log(`[FAILED] ${reason}`);
            await updateFailed(image.id, reason);
        }
    }
    
    console.log("=== BATCH COMPLETE ===");
    
    // Post-Process: Recalculate Place primary heroes based on best scores
    await assignPrimaryHeroes();

    await prisma.$disconnect();
    pool.end();
}

async function updateFailed(id: string, reason: string, hash?: string) {
    await prisma.placeImage.update({
        where: { id },
        data: {
            status: 'FAILED',
            rejectionReason: reason,
            hash: hash || null
        }
    });
}

async function assignPrimaryHeroes() {
    console.log("\nRe-evaluating primary hero images natively...");
    const places = await prisma.place.findMany({
        where: { images: { some: { status: 'APPROVED' } } },
        include: { images: { where: { status: 'APPROVED' }, orderBy: { qualityScore: 'desc' } } }
    });

    let swaps = 0;
    for (const p of places) {
        if (p.images.length > 0) {
            // Filter real vs representative for scoring Engine
            const realImages = p.images.filter((i: any) => i.imageTruthType === 'place_real' && !i.labels.includes("weak-hero"));
            const imgCount = realImages.length;

            // Rule 3: Category-specific primary image rules (applies to ALL images for UI aesthetics)
            const preferredLabels = p.type === 'hotel' ? ['exterior', 'room', 'lobby'] :
                                    p.type === 'restaurant' ? ['venue', 'food', 'exterior'] :
                                    (p.type === 'museum' || p.type === 'tour') ? ['landmark', 'activity'] :
                                    ['vehicle']; // transport

            let bestImage = p.images[0]; // defaults to highest quality score across ALL available
            for (const img of p.images) {
                if (img.labels && img.labels.some((l:string) => preferredLabels.includes(l)) && !img.labels.includes("weak-hero")) {
                    bestImage = img;
                    break;
                }
            }

            // Reset all to gallery (priority 1)
            await prisma.placeImage.updateMany({
                where: { placeId: p.id },
                data: { priority: 1 }
            });
            // Set best as hero (priority 0)
            await prisma.placeImage.update({
                where: { id: bestImage.id },
                data: { priority: 0 }
            });
            swaps++;
            
            // Rule 4: Split scoring and Rule 5 Gallery Coverage Rules
            const limit = p.type === 'hotel' ? 5 : (p.type === 'museum' || p.type === 'tour' ? 4 : (p.type === 'restaurant' ? 3 : 2));
            
            // Generate visual score independent of verification confidence based on Maturity Bands (Only mapped off Real Images!)
            let visualScoreUpdate = 0;
            if (imgCount === 0) {
                visualScoreUpdate = 0;
            } else if (imgCount === 1) {
                visualScoreUpdate = 30; // 1 approved hero
            } else if (imgCount >= 2 && imgCount < limit) {
                visualScoreUpdate = 60; // 2-3 approved images
            } else if (imgCount >= limit && imgCount < limit + 5) {
                visualScoreUpdate = 85; // threshold met
            } else if (imgCount >= limit + 5) {
                visualScoreUpdate = 100; // rich gallery
            }

            // Small quality adjustment based on REAL hero images only
            if (realImages.length > 0) {
                 const qualityBonus = Math.floor(realImages[0].qualityScore / 10);
                 visualScoreUpdate = Math.min(100, visualScoreUpdate + qualityBonus);
            }
            
            await prisma.place.update({
                where: { id: p.id },
                data: { visualScore: Math.round(Math.max(0, visualScoreUpdate)) }
            });
        }
    }
    console.log(`Evaluated and prioritized ${swaps} heroes.`);
}

processImageBucket();
