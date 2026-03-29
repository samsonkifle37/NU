import { prisma } from '../src/lib/prisma';

async function main() {
    const images = await prisma.placeImage.findMany({ select: { imageUrl: true } });
    const urls = images.map(i => i.imageUrl);
    const counts: Record<string, number> = {};
    urls.forEach(u => counts[u] = (counts[u] || 0) + 1);
    
    const dupes = Object.entries(counts).filter(([u, c]) => c > 1).sort((a, b) => b[1] - a[1]);
    console.log('Top image duplications:');
    dupes.slice(0, 15).forEach(([u, c]) => console.log(c, u));
    
    const blanks = urls.filter(u => !u || u.trim() === '');
    console.log('Blank/empty images count:', blanks.length);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
