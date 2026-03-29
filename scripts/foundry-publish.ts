import { prisma } from '../src/lib/prisma';


async function main() {
    console.log("Fetching REVIEW and DRAFT listings to publish...");
    const draftsAndReviews = await prisma.ingestionListing.findMany({
        where: {
            status: {
                in: ["DRAFT", "REVIEW"]
            }
        }
    });
    
    console.log(`Found ${draftsAndReviews.length} listings to publish.`);
    
    let published = 0;
    for (const listing of draftsAndReviews) {
        try {
            if (listing.placeId) continue; // Already published

            await prisma.ingestionListing.update({
                where: { id: listing.id },
                data: { status: "PUBLISHED" }
            });

            const place = await prisma.place.create({
                data: {
                    name: listing.name,
                    slug: listing.slug,
                    type: listing.category.toLowerCase(), // map type
                    city: listing.city,
                    country: listing.country,
                    latitude: listing.lat,
                    longitude: listing.lng,
                    neighborhood: listing.address || '',
                    area: listing.district || '',
                    shortDescription: listing.shortDescription,
                    longDescription: listing.longDescription,
                    websiteUrl: listing.website,
                    phone: listing.phone,
                    tags: listing.tags,
                    source: 'foundry-ingestion',
                    status: 'APPROVED',
                    isActive: true,
                }
            });

            if (listing.imageUrls && listing.imageUrls.length > 0) {
                await prisma.placeImage.createMany({
                    data: listing.imageUrls.map((url, i) => ({
                        placeId: place.id,
                        imageUrl: url,
                        priority: i,
                        imageSource: 'foundry-resolved'
                    }))
                });
            }

            await prisma.ingestionListing.update({
                where: { id: listing.id },
                data: { placeId: place.id }
            });

            published++;
            if (published % 50 === 0) console.log(`Published ${published} items...`);
        } catch (err: any) {
            console.error(`Failed to publish listing ${listing.id}: ${err.message}`);
        }
    }

    
    console.log(`Successfully published ${published} listings! Frontend should now display hundreds of records.`);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

