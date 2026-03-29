import { prisma } from '../src/lib/prisma';

async function removeDups() {
    const allPlaces = await prisma.place.findMany({
        orderBy: { createdAt: 'asc' }
    });
    
    const seenNames = new Set();
    let deletedCount = 0;

    for (const p of allPlaces) {
        if (seenNames.has(p.name)) {
            // It's a duplicate, delete it (Prisma will cascade delete images, reviews, etc.)
            await prisma.place.delete({ where: { id: p.id } });
            deletedCount++;
            console.log(`Deleted duplicate: ${p.name} (Slug: ${p.slug})`);
        } else {
            seenNames.add(p.name);
        }
    }
    console.log(`Finished removing duplicates. Total deleted: ${deletedCount}`);
}
removeDups().catch(console.error).finally(()=>prisma.$disconnect());
