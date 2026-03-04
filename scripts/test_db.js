const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Testing connection...");
        console.log("DB_URL:", process.env.DATABASE_URL ? "Exists" : "MISSING");
        const count = await prisma.place.count();
        console.log("Connection successful! Place count:", count);
    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
