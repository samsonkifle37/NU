import { prisma } from '../src/lib/prisma';

async function main() {
    console.log("Forcing enrichment for all places...");
    const places = await prisma.place.findMany();
    
    let enr = 0;
    for (const listing of places) {
        let tags: string[] = [];
        let shortDesc = '';
        let longDesc = '';
        
        if (listing.type === 'hotel') {
            tags = ['wifi', 'parking', 'luxury', 'breakfast', 'comfortable'];
            shortDesc = `Experience legendary Ethiopian hospitality at ${listing.name}, beautifully situated in the heart of ${listing.city}.`;
            longDesc = `An ideal haven combining authentic local charm with modern comfort. Guests at ${listing.name} enjoy spacious rooms, excellent service, and easy access to ${listing.city}'s most iconic historical sites and vibrant local markets. Perfect for both business travelers and adventurous tourists exploring Ethiopia.`;
        } else if (listing.type === 'restaurant') {
            tags = ['food', 'ethiopian cuisine', 'culture', 'live music', 'local experience'];
            shortDesc = `Traditional Ethiopian dining with live cultural music performances at ${listing.name}.`;
            longDesc = `${listing.name} is one of ${listing.city}'s most beloved dining venues. Visitors come to enjoy authentic traditional Ethiopian cuisine alongside live music and dance performances that showcase vibrant regional traditions.`;
        } else if (listing.type === 'coffee' || listing.type === 'cafe') {
            tags = ['coffee', 'ceremony', 'cafe', 'roasted', 'local'];
            shortDesc = `Authentic Ethiopian coffee ceremony and masterfully roasted beans at ${listing.name}.`;
            longDesc = `Ethiopia is the birthplace of coffee, and ${listing.name} honors this rich heritage by serving some of the finest traditional brews in ${listing.city}. Relax in a welcoming atmosphere, partake in a customary coffee ceremony, and enjoy fresh, locally sourced beans.`;
        } else if (listing.type === 'museum' || listing.type === 'culture') {
            tags = ['history', 'culture', 'heritage', 'artifacts', 'educational'];
            shortDesc = `Discover the rich history and deep cultural heritage of Ethiopia at ${listing.name}.`;
            longDesc = `Take a journey through time at ${listing.name}. Housing extraordinary artifacts, historical documents, and cultural exhibitions, this museum is a must-visit in ${listing.city} to truly understand the ancient roots and diverse cultures that make up modern Ethiopia.`;
        } else if (listing.type === 'park' || listing.type === 'tour') {
            tags = ['nature', 'outdoors', 'scenic', 'hiking', 'explore'];
            shortDesc = `Breathtaking natural beauty and guided explorations through the landscapes of ${listing.city}.`;
            longDesc = `Immerse yourself in stunning scenery at ${listing.name}. Whether you're looking for peaceful walks, spectacular panoramic views, or thrilling nature trails, this destination in ${listing.city} offers an unforgettable outdoor experience in the heart of Ethiopia.`;
        } else {
            tags = ['essential', 'local', 'popular', 'must-visit', 'authentic'];
            shortDesc = `A top-rated authentic local experience right in the heart of ${listing.city}.`;
            longDesc = `Highly recommended by locals and travelers alike, ${listing.name} is an essential stop when visiting ${listing.city}. Expect warm Ethiopian hospitality, great value, and an unforgettable memory of your journey.`;
        }

        await prisma.place.update({
            where: { id: listing.id },
            data: {
                shortDescription: shortDesc,
                longDescription: longDesc,
                tags,
                phone: listing.phone || '+251 91 123 4567'
            }
        });
        enr++;
    }
    
    console.log(`Enriched ${enr} places.`);
}
main().catch(console.error);
