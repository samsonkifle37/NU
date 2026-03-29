import { prisma } from '../src/lib/prisma';

async function verifyImages() {
    const checkNames = [
        "Sheraton Addis",
        "Hilton Addis Ababa",
        "National Museum",
        "Holy Trinity Cathedral",
        "Entoto Maryam Church",
        "Unity Park",
        "Yod Abyssinia",
        "Tomoca Coffee"
    ];

    console.log(`\n===========================================`);
    console.log(`🛎️  ADDISVIEW IMAGE VERIFICATION REPORT 🛎️`);
    console.log(`===========================================\n`);

    for (const name of checkNames) {
        // we check starting with name as suffix might exist on some old entries just in case
        const place = await prisma.place.findFirst({
            where: { name: { startsWith: name } },
            include: { images: true }
        });

        if (!place) {
            console.log(`❌ [NOT FOUND] ${name}`);
            continue;
        }

        const img = place.images?.[0];
        if (!img) {
            console.log(`❌ [NO IMAGE ENTRY] ${name} (ID: ${place.id})`);
            continue;
        }

        const isFallback = img.imageUrl.includes('/fallbacks/') || img.imageSource === 'fallback-category';
        const sourceStr = isFallback ? "FALLBACK" : `REAL (${img.imageSource})`;
        
        const statusIcon = isFallback ? "⚠️" : "✅";

        console.log(`${statusIcon} ${name.padEnd(25)} | SOURCE: ${sourceStr.padEnd(18)} | URL: ${img.imageUrl}`);
        if (img.imageUrl.includes("unsplash.com") || img.imageSource === "unsplash") {
            console.log("   ❌ CRITICAL WARNING: Random Unsplash image detected!");
        }
    }
    console.log(`\n===========================================\n`);
}

verifyImages().catch(console.error).finally(()=>prisma.$disconnect());
