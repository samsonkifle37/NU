import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import axios from 'axios';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function searchWikiImage(query: string, limit: number = 5): Promise<string[]> {
    try {
        const queryParams = new URLSearchParams({
            action: 'query',
            generator: 'search',
            gsrsearch: query,
            gsrnamespace: '6', // File space
            prop: 'imageinfo',
            iiprop: 'url',
            format: 'json',
            gsrlimit: limit.toString()
        });

        const url = `https://commons.wikimedia.org/w/api.php?${queryParams.toString()}`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'AddisViewBot/1.0 (admin@addisview.example.com)' } });
        
        const urls: string[] = [];
        if (res.data && res.data.query && res.data.query.pages) {
            const pages = res.data.query.pages;
            for (const key of Object.keys(pages)) {
                const urlStr = pages[key].imageinfo?.[0]?.url;
                if (urlStr && urlStr.match(/\.(jpg|jpeg|png)$/i)) {
                    urls.push(urlStr);
                }
            }
        }
        return urls;
    } catch {
        return [];
    }
}

async function main() {
    console.log("Analyzing places to fix duplicate/blank images...");

    const places = await prisma.place.findMany({
        include: { images: true }
    });
    
    let processed = 0;
    let fixed = 0;
    
    // Create a generic fallback pool from wiki to avoid constant empty hits
    const fallbackPools: Record<string, string[]> = {};
    const categories = ['hotel', 'restaurant', 'coffee', 'museum', 'park', 'attraction'];
    
    console.log("Pre-fetching diverse generic African fallbacks for each category...");
    for (const cat of categories) {
        fallbackPools[cat] = await searchWikiImage(`${cat} Africa`, 50);
        await delay(500);
    }
    
    console.log("Generic fallback pools ready.");

    for (const place of places) {
        if (!place.images || place.images.length === 0) continue;
        const imgUrl = place.images[0].imageUrl;
        
        // If it's an unsplash fallback, it's one of my duplicates
        if (imgUrl.includes('unsplash.com') || imgUrl.trim() === '') {
            // we try to search specific to city
            let candidateUrls = await searchWikiImage(`${place.type} ${place.city} Ethiopia`, 10);
            await delay(100);
            
            if (candidateUrls.length === 0) {
                candidateUrls = await searchWikiImage(`${place.type} Ethiopia`, 10);
                await delay(100);
            }
            
            // if still empty, use generic afric pool
            if (candidateUrls.length === 0) {
                candidateUrls = fallbackPools[place.type] || fallbackPools['hotel'] || ['https://images.unsplash.com/photo-1542314831-c6a4d14d8c53?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80']; // last resort
            }
            
            if (candidateUrls.length > 0) {
                // Pick random from valid candidates
                let chosen = candidateUrls[Math.floor(Math.random() * candidateUrls.length)];
                
                await prisma.placeImage.update({
                    where: { id: place.images[0].id },
                    data: { imageUrl: chosen }
                });
                
                fixed++;
            }
            processed++;
            if (processed % 20 === 0) console.log(`Processed ${processed} problematic images, fixed ${fixed}...`);
        }
    }
    
    console.log(`Finished fixing images. Replaced ${fixed} duplicate/blank visuals!`);
    process.exit(0);
}

main().catch(console.error);
