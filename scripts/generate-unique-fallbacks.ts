import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function generateUniqueFallbacks() {
    const fallbacksDir = path.join(process.cwd(), 'public', 'fallbacks', 'unique');
    if (!fs.existsSync(fallbacksDir)) {
        fs.mkdirSync(fallbacksDir, { recursive: true });
    }

    const placesWithFallback = await prisma.placeImage.findMany({
        where: {
            OR: [
                { imageSource: 'fallback-category' },
                { imageUrl: { contains: '/fallbacks/' } }
            ]
        },
        include: { place: true }
    });

    // Patterns / colors
    const colors = [
        ['#1A1612', '#C9973B'],
        ['#2D6A4F', '#40916C'],
        ['#E8C07A', '#D0A054'],
        ['#1A1612', '#2D6A4F'],
        ['#333333', '#111111'],
        ['#4A4A4A', '#C9973B']
    ];

    console.log(`Generating ${placesWithFallback.length} unique branded fallbacks...`);
    
    let count = 0;
    for (const img of placesWithFallback) {
        if (!img.place) continue;
        
        // Pick a color based on place name length / char code to be deterministic but varied
        const seed = img.place.name.length + img.place.name.charCodeAt(0) + count;
        const colorPair = colors[seed % colors.length];

        const svg = `
<svg width="1000" height="600" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad-${img.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
        </linearGradient>
        <pattern id="pattern-${img.id}" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="#ffffff" fill-opacity="0.1"/>
        </pattern>
    </defs>
    <rect width="1000" height="600" fill="url(#grad-${img.id})" />
    <rect width="1000" height="600" fill="url(#pattern-${img.id})" />
    
    <!-- Branding -->
    <text x="500" y="270" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" opacity="0.9" text-anchor="middle" letter-spacing="4">
        ADDISVIEW
    </text>
    
    <!-- Category -->
    <text x="500" y="320" font-family="monospace" font-size="16" font-weight="bold" fill="#E8C07A" opacity="0.8" text-anchor="middle" letter-spacing="2">
        CATEGORY: ${img.place.type.toUpperCase()}
    </text>
    
    <!-- Property Binding (Ensures Hash Uniqueness) -->
    <text x="500" y="550" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto" font-size="12" font-weight="500" fill="#ffffff" opacity="0.4" text-anchor="middle">
        ID: ${img.place.id} | ${img.place.name}
    </text>
</svg>`;

        const fileName = `${img.place.slug}-${img.id}.svg`;
        const filePath = path.join(fallbacksDir, fileName);
        fs.writeFileSync(filePath, svg.trim());

        // Update DB
        await prisma.placeImage.update({
            where: { id: img.id },
            data: {
                imageUrl: `/fallbacks/unique/${fileName}`,
                imageSource: 'fallback-unique'
            }
        });
        
        count++;
    }

    console.log(`Generated ${count} unique SVG fallbacks and updated DB.`);
}

generateUniqueFallbacks().catch(console.error).finally(()=>prisma.$disconnect());
