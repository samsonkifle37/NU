import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

console.log("DB URL from env:", process.env.DATABASE_URL ? "Defined" : "UNDEFINED");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Starting inventory export...");

    const places = await prisma.place.findMany({
        include: {
            images: true,
        },
    });

    const inventory = places.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        city: p.city,
        existing_image_url: p.images[0]?.imageUrl || "",
        websiteUrl: p.websiteUrl || "",
        googleMapsUrl: p.googleMapsUrl || "",
        source: p.source,
        status: p.images.length > 0 ? "OK" : "missing",
    }));

    const outputPath = './image_inventory.json';
    fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2));

    console.log(`Inventory exported to ${outputPath}. Total items: ${inventory.length}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
