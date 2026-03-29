import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

const FALLBACK_IMAGES: Record<string, string[]> = {
    hotel: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1542314831-c6a4d14d8c53?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ],
    restaurant: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ],
    coffee: [
        'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1442512595159-064027c5d253?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ],
    museum: [
        'https://images.unsplash.com/photo-1518998053901-5348d3961a04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1545041006-2580a6566276?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ],
    park: [
        'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ],
    default: [
        'https://images.unsplash.com/photo-1580910051074-3b69ea0b2d1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1565881606991-789a8dff9dbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ]
};

const BAD_IMAGE_URL = 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=80&w=1000&auto=format&fit=crop';

async function main() {
    console.log("Fixing images...");

    // Find all ingestion listings with bad image
    const badIngestions = await prisma.ingestionListing.findMany({
        where: { imageUrls: { has: BAD_IMAGE_URL } }
    });

    console.log(`Found ${badIngestions.length} ingestion listings to fix.`);
    
    let fixed = 0;
    for (const listing of badIngestions) {
        const fallbacks = FALLBACK_IMAGES[listing.category] || FALLBACK_IMAGES['default'];
        const randomImage = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        
        // replace the bad url with the random url
        const newUrls = listing.imageUrls.map(u => u === BAD_IMAGE_URL ? randomImage : u);
        
        await prisma.ingestionListing.update({
            where: { id: listing.id },
            data: { imageUrls: newUrls }
        });
        fixed++;
    }
    console.log(`Fixed ${fixed} ingestion listings.`);
    
    // Now fix actual PlaceImages
    const badPlaceImages = await prisma.placeImage.findMany({
        where: { imageUrl: BAD_IMAGE_URL },
        include: { place: true }
    });
    
    console.log(`Found ${badPlaceImages.length} actual PlaceImages to fix.`);
    let fixedPlaces = 0;
    for (const image of badPlaceImages) {
        if (!image.place) continue;
        const cat = image.place.type;
        const fallbacks = FALLBACK_IMAGES[cat] || FALLBACK_IMAGES['default'];
        const randomImage = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        
        await prisma.placeImage.update({
            where: { id: image.id },
            data: { imageUrl: randomImage }
        });
        fixedPlaces++;
    }
    console.log(`Fixed ${fixedPlaces} PlaceImages.`);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
