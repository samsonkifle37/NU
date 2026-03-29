import { prisma } from '../src/lib/prisma';
import axios from 'axios';
import * as cheerio from 'cheerio';

const PATCHES = [
    { name: "Sheraton Addis", url: "https://upload.wikimedia.org/wikipedia/commons/2/27/Sheraton_Addis.jpg", source: "wikimedia" },
    { name: "Hilton Addis Ababa", url: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Hilton_Hotel%2C_Addis_Ababa_%2834020925983%29.jpg", source: "wikimedia" },
    { name: "Best Western Plus Addis", url: "https://www.bestwestern.com/content/dam/hotels/pwa/73113/73113_gr.jpg", source: "opengraph" },
    { name: "Kuriftu Resort Bishoftu", url: "https://kurifturesorts.com/bishoftu/images/kuriftu-bishoftu.jpg", source: "opengraph" },
    { name: "Kuriftu Resort Bahir Dar", url: "https://kurifturesorts.com/bahir-dar/images/kuriftu-bahir-dar.jpg", source: "opengraph" },
    { name: "Kuriftu Resort Lake Tana", url: "https://kurifturesorts.com/bahir-dar/images/gallery/1.jpg", source: "opengraph" },
    { name: "Entoto Natural Park Lodge", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Entoto_Park_Addis_Ababa.jpg/1200px-Entoto_Park_Addis_Ababa.jpg", source: "wikimedia" },
    { name: "Awash Falls Lodge", url: "https://upload.wikimedia.org/wikipedia/commons/1/18/Awash_National_Park-1.jpg", source: "wikimedia" },
];

const LOCATIONS = [
    { name: "Awash Falls Lodge", city: "Awash", area: "Afar Region" },
    { name: "Entoto Natural Park Lodge", city: "Addis Ababa", area: "Entoto Mountain" },
    { name: "Kuriftu Resort Bishoftu", city: "Bishoftu", area: "Oromia Region" },
    { name: "Kuriftu Resort Bahir Dar", city: "Bahir Dar", area: "Amhara Region" },
    { name: "Kuriftu Resort Lake Tana", city: "Bahir Dar", area: "Amhara Region" },
];

async function patch() {
    for (const p of PATCHES) {
        const place = await prisma.place.findFirst({ where: { name: p.name } });
        if (!place) continue;
        
        await prisma.placeImage.deleteMany({ where: { placeId: place.id } });
        await prisma.placeImage.create({
            data: {
                placeId: place.id,
                imageUrl: p.url,
                priority: 0,
                imageSource: p.source
            }
        });
        console.log(`Patched image for ${p.name}`);
    }

    for (const loc of LOCATIONS) {
        await prisma.place.updateMany({
            where: { name: loc.name },
            data: { city: loc.city, area: loc.area }
        });
        console.log(`Patched location for ${loc.name}`);
    }
}

patch().catch(console.error).finally(()=>prisma.$disconnect());
