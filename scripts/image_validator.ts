import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function validateImage(url: string) {
    if (!url) return { status: 'missing', code: 0 };

    try {
        const response = await axios.head(url, {
            timeout: 5000,
            headers: { 'User-Agent': 'AddisViewBot/1.0' }
        });

        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
            return { status: 'not_image', code: response.status, notes: `Content-Type: ${contentType}` };
        }

        return { status: 'ok', code: response.status };
    } catch (error: any) {
        if (error.response) {
            return { status: 'broken', code: error.response.status, notes: error.message };
        }
        return { status: 'broken', code: 500, notes: error.message };
    }
}

async function main() {
    console.log("Starting image validation audit...");

    const places = await prisma.place.findMany({
        include: { images: true }
    });

    console.log(`Auditing ${places.length} items...`);

    for (const place of places) {
        const imageUrl = place.images[0]?.imageUrl || null;
        console.log(`Checking [${place.type}] ${place.name}...`);

        const result = await validateImage(imageUrl || "");

        await prisma.imageAudit.upsert({
            where: { id: place.id }, // We can use place.id as audit id if we want 1-to-1, or just create new
            create: {
                id: place.id,
                entityType: place.type,
                entityId: place.id,
                name: place.name,
                imageUrl: imageUrl,
                status: result.status,
                httpCode: result.code,
                notes: result.notes || null,
                checkedAt: new Date()
            },
            update: {
                imageUrl: imageUrl,
                status: result.status,
                httpCode: result.code,
                notes: result.notes || null,
                checkedAt: new Date()
            }
        });
    }

    console.log("Image audit complete.");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
