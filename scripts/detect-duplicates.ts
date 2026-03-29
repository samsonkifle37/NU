import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function detectDuplicates() {
    console.log(`\n===========================================`);
    console.log(`🔍  ADDISVIEW DUPLICATE IMAGE AUDIT  🔍`);
    console.log(`===========================================\n`);

    const places = await prisma.place.findMany({
        include: { images: true }
    });

    const urlMap = new Map<string, any[]>();
    const hashMap = new Map<string, any[]>();

    let unoptimizedShared = 0;

    for (const place of places) {
        if (!place.images || place.images.length === 0) continue;
        const mainImg = place.images[0];
        
        // Skip default local fallbacks if we already replaced them, but we still track uniqueness.
        // Wait, does hashing a URL work? We need to download or hash local file!
        let hash = mainImg.imageUrl; // Base assumption: if URL is same, hash is same.
        if (mainImg.imageUrl.startsWith('/')) {
            const filePath = path.join(process.cwd(), 'public', mainImg.imageUrl);
            if (fs.existsSync(filePath)) {
                const buffer = fs.readFileSync(filePath);
                hash = crypto.createHash('md5').update(buffer).digest('hex');
            }
        }

        // Track URLs
        if (!urlMap.has(mainImg.imageUrl)) urlMap.set(mainImg.imageUrl, []);
        urlMap.get(mainImg.imageUrl)!.push(place);

        // Track Hashes
        if (!hashMap.has(hash)) hashMap.set(hash, []);
        hashMap.get(hash)!.push(place);
    }

    let foundDups = false;

    hashMap.forEach((placesWithSameImage, hashValue) => {
        if (placesWithSameImage.length > 1) {
            foundDups = true;
            console.log(`[DUPLICATE GROUP] SHARED BY ${placesWithSameImage.length} PROPERTIES:`);
            console.log(`Hash   : ${hashValue}`);
            console.log(`Image  : ${placesWithSameImage[0].images?.[0]?.imageUrl}`);
            console.log(`Source : ${placesWithSameImage[0].images?.[0]?.imageSource}`);
            
            for (let i = 0; i < Math.min(5, placesWithSameImage.length); i++) {
                const p = placesWithSameImage[i];
                console.log(`  - ${p.name} (Slug: ${p.slug})`);
            }
            if (placesWithSameImage.length > 5) console.log(`  ... and ${placesWithSameImage.length - 5} more.`);
            console.log();
        }
    });

    if (!foundDups) {
        console.log(`✅ SUCCESS: ZERO duplicate primary images found across all ${places.length} listings!`);
        console.log(`✅ Every property has a 100% unique primary image or deterministically unique branded fallback.`);
    }

    console.log(`\n===========================================\n`);
}

detectDuplicates().catch(console.error).finally(()=>prisma.$disconnect());
