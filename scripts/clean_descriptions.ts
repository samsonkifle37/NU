import 'dotenv/config';
import { prisma } from '../src/lib/prisma'; // Using application's prisma instance to ensure correctness

async function fix() {
    const places = await prisma.place.findMany();
    let count = 0;
    
    for (const p of places) {
        if (!p.name) continue;

        let modified = false;
        let newShort = p.shortDescription || "";
        let newLong = p.longDescription || "";

        // E.g. "Experience the finest hotel at Best Western Plus Addis 10, centrally located"
        // Replace " 10" to "" where it trails a known name.
        // The simplest way since some might have random strings: replace the pattern `Name \d+` with `Name`
        // We know the real name without suffix is `p.name` (we already fixed `p.name` earlier).
        // Wait, earlier we set `p.name` to e.g., "Best Western Plus Addis".
        // SO the description might still say "Best Western Plus Addis 3".
        
        // Let's replace any instance of `${p.name} \d+` with `${p.name}`
        const regex = new RegExp(`${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\d+`, 'g');
        
        if (regex.test(newShort)) {
            newShort = newShort.replace(regex, p.name);
            modified = true;
        }

        if (regex.test(newLong)) {
            newLong = newLong.replace(regex, p.name);
            modified = true;
        }

        if (modified) {
            await prisma.place.update({
                where: { id: p.id },
                data: {
                    shortDescription: newShort,
                    longDescription: newLong
                }
            });
            count++;
        }
    }
    console.log(`Updated ${count} places by removing numeric suffixes from descriptions.`);
}

fix();
