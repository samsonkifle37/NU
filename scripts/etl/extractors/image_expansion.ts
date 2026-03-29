import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
};

async function expandImages() {
    console.log("=== PHASE 4A: IMAGE COVERAGE EXPANSION ===");
    
    // Thresholds
    const thresholdMap: Record<string, number> = {
        hotel: 5, guesthouse: 5, resort: 5, apartment: 5,
        tour: 4, museum: 4, landmark: 4,
        restaurant: 3, cafe: 3, coffee: 3, club: 3, nightlife: 3,
        transport: 2
    };

    // Find underdeveloped places
    const places = await prisma.place.findMany({
        where: { status: 'APPROVED' },
        include: { images: true, placeSources: true }
    });

    let processed = 0;
    let foundImages = 0;

    for (const place of places) {
        const threshold = thresholdMap[place.type] || 2;
        if (place.images.length >= threshold) continue;

        console.log(`[${place.type.toUpperCase()}] ${place.name} missing images (has ${place.images.length}/${threshold})`);
        processed++;
        
        const extractedMaps = new Map<string, string>(); // url -> sourcePageUrl

        // 1. Extract from Official Website
        if (place.websiteUrl) {
            console.log(` -> Scraping official site: ${place.websiteUrl}`);
            const urls = await scrapeHtml(place.websiteUrl, place.type);
            urls.forEach(u => extractedMaps.set(u, place.websiteUrl as string));
        }

        // 2. Extract from external sources (Wikimedia, Booking, etc.)
        for (const source of place.placeSources) {
            if (source.url.includes("openstreetmap.org")) continue;
            
            console.log(` -> Scraping source mapping: ${source.url}`);
            const urls = await scrapeHtml(source.url, place.type);
            urls.forEach(u => extractedMaps.set(u, source.url));
        }
        
        // 3. Fallback mock for Wikipedia via API if nothing else found!
        if (extractedMaps.size === 0 && (place.type === 'landmark' || place.type === 'museum' || place.type === 'transport' || place.type === 'restaurant')) {
             const wikiUrls = await fetchWikiImages(`${place.name} Addis Ababa`);
             wikiUrls.forEach(u => extractedMaps.set(u, `https://en.wikipedia.org/w/api.php?search=${encodeURIComponent(place.name)}`));
        }

        // Insert into PlaceImage Queue as PENDING (Real Source extractions)
        let insertedThisPass = 0;
        const CAP = 10;
        
        for (const [rawUrl, sourcePage] of Array.from(extractedMaps.entries())) {
            if (insertedThisPass >= CAP) break;
            
            const exists = await prisma.placeImage.findFirst({ where: { placeId: place.id, imageUrl: rawUrl }});
            if (!exists) {
                await prisma.placeImage.create({
                    data: {
                        placeId: place.id,
                        imageUrl: rawUrl.trim(),
                        sourcePageUrl: sourcePage,
                        status: 'PENDING',
                        qualityScore: 0,
                        isMirrored: false,
                        imageSource: 'pipeline_auto_extractor',
                        imageTruthType: 'place_real' // Real derived images
                    }
                });
                foundImages++;
                insertedThisPass++;
            }
        }

        // Phase 6: Representative UI Fallback for visually starved categories
        if (insertedThisPass === 0 && place.images.length === 0) {
            // Apply a strictly tagged representative image for UI compliance without inflating Real Score
            let genericTerm = 'ethiopia addis ababa';
            if (place.type === 'restaurant') genericTerm = 'ethiopian food restaurant';
            else if (place.type === 'cafe' || place.type === 'coffee') genericTerm = 'coffee shop cafe addis';
            else if (place.type === 'club' || place.type === 'nightlife') genericTerm = 'nightclub bar lounge addis';
            else if (place.type === 'transport') genericTerm = 'taxi bus transport ethiopia';
            else if (place.type === 'tour') genericTerm = 'tour tourists ethiopia';

            const representativeUrl = `https://source.unsplash.com/1200x800/?${encodeURIComponent(genericTerm)}&sig=${place.id}`;
            const exists = await prisma.placeImage.findFirst({ where: { placeId: place.id, imageUrl: representativeUrl }});
            
            if (!exists) {
                console.log(` -> Injecting representative Unsplash fallback for UI aesthetic (${genericTerm})`);
                await prisma.placeImage.create({
                    data: {
                        placeId: place.id,
                        imageUrl: representativeUrl,
                        sourcePageUrl: 'https://unsplash.com/',
                        status: 'PENDING',
                        qualityScore: 10,
                        isMirrored: false,
                        imageSource: 'unsplash_fallback',
                        imageTruthType: 'representative' // DO NOT count for visualScore!
                    }
                });
                foundImages++;
            }
        }
    }

    console.log(`\n=== EXPANSION COMPLETE ===`);
    console.log(`Evaluated ${processed} underserviced listings.`);
    console.log(`Queued ${foundImages} new raw image URLs for ETL validation engine.`);
    
    await prisma.$disconnect();
    pool.end();
}

/**
 * Phase 4B: Source-Aware Extractor Core
 */
async function scrapeHtml(targetUrl: string, category: string): Promise<string[]> {
    const results: string[] = [];
    try {
        const res = await axios.get(targetUrl, { headers: HEADERS, timeout: 8000 });
        const html = res.data;
        const $ = cheerio.load(html);

        const baseUrl = new URL(targetUrl);

        const resolveUrl = (src?: string) => {
            if (!src) return null;
            if (src.startsWith('data:')) return null; // Drop inline base64
            if (src.startsWith('//')) return `https:${src}`;
            if (src.startsWith('/')) return `${baseUrl.origin}${src}`;
            return src;
        };

        // Rule 1: Master OG properties (Most official hero images)
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) {
            const resUrl = resolveUrl(ogImage);
            if (resUrl) results.push(resUrl);
        }
        
        const twitterImage = $('meta[name="twitter:image"]').attr('content');
        if (twitterImage) {
             const resUrl = resolveUrl(twitterImage);
             if (resUrl) results.push(resUrl);
        }

        // Search directory profiles linked statically (Yelp / Social pages)
        // If a business links to their Facebook/Instagram, pull the OG image from that
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('facebook.com') || href.includes('instagram.com/')) && !href.includes('share') && !href.includes('/groups/')) {
                // Not recursively scraping facebook due to heavy auth blocks, but we flag for future
                // Some smaller directory listings or unauthenticated pages can be scraped directly
            }
        });

        // Rule 2: JSON-LD Structured Data
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const data = JSON.parse($(el).html() || '{}');
                // Could be array or object
                const extractLdImages = (obj: any) => {
                    if (!obj) return;
                    if (obj.image) {
                        if (typeof obj.image === 'string') results.push(resolveUrl(obj.image) as string);
                        if (Array.isArray(obj.image)) obj.image.forEach((img: any) => {
                            if (typeof img === 'string') results.push(resolveUrl(img) as string);
                            if (img.url) results.push(resolveUrl(img.url) as string);
                        });
                    }
                    if (Array.isArray(obj)) obj.forEach(extractLdImages);
                };
                extractLdImages(data);
            } catch(e) {}
        });

        // Rule 3: Native DOM img tags (Gallery thumbnails & lazy-loads)
        // Avoid tiny icons, tracking pixels, logos 
        $('img').each((i, el) => {
            const classAttr = ($(el).attr('class') || "").toLowerCase();
            const altAttr = ($(el).attr('alt') || "").toLowerCase();
            const src = $(el).attr('src');
            const dataSrc = $(el).attr('data-src') || $(el).attr('data-lazy-src');
            
            // Skip obvious bad assets
            if (classAttr.includes('logo') || classAttr.includes('icon') || classAttr.includes('avatar') || classAttr.includes('map')) return;
            if (altAttr.includes('logo') || altAttr.includes('icon') || altAttr.includes('map') || altAttr.includes('rating')) return;

            const finalSrc = resolveUrl(dataSrc || src);
            if (finalSrc && (finalSrc.endsWith('.jpg') || finalSrc.endsWith('.png') || finalSrc.endsWith('.jpeg') || finalSrc.endsWith('.webp'))) {
                results.push(finalSrc);
            }
        });
        
    } catch (e: any) {
        // Many official sites might be down or block scraping gracefully fail
        console.log(`   [Extract Fail] ${targetUrl} - ${e.message}`);
    }

    // Deduplicate
    return [...new Set(results)].filter(Boolean);
}

/**
 * Phase 5 Adapter: Wikipedia / Wikimedia Commons Structured API Integration
 */
async function fetchWikiImages(query: string): Promise<string[]> {
    console.log(` -> Querying Wikimedia API: ${query}`);
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(query)}&pithumbsize=1200&format=json`;
        const res = await axios.get(url, { headers: HEADERS });
        const pages = res.data.query?.pages;
        if (!pages) return [];
        
        let found = [];
        for (const pageId in pages) {
            if (pages[pageId].thumbnail?.source) {
                found.push(pages[pageId].thumbnail.source);
            }
        }
        return found;
    } catch(e) {
        return [];
    }
}

expandImages();
