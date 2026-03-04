const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Prisma keys:", Object.keys(prisma).filter(k => !k.startsWith('_')));

    if (!prisma.imageAudit) {
        console.log("imageAudit NOT FOUND on prisma client. Checking lowercase...");
        if (prisma.imageaudit) console.log("Found imageaudit (lowercase)");
    }

    const stats = await prisma.imageAudit.groupBy({
        by: ['status'],
        _count: { id: true }
    });
    console.log("Audit Stats:", stats);

    const broken = await prisma.imageAudit.findMany({
        where: { status: { not: 'ok' } },
        take: 5
    });
    console.log("\nBroken Example:", broken);
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => pool.end()));
