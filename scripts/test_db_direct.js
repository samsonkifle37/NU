const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
});

async function main() {
    try {
        console.log("Testing connection with DIRECT_URL...");
        const count = await prisma.place.count();
        console.log("Connection successful! Place count:", count);
    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
