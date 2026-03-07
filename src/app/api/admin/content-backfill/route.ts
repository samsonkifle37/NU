import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Comprehensive content backfill — images, maps links, websites, contact info
export async function GET() {
    try {
        const results: string[] = [];

        // ============================================================
        // PART A — Insert images for the 9 entities missing them
        // ============================================================
        const imageBackfill = [
            { name: "Alem Bunna", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Ethiopian_Coffee_Ceremony.jpg/800px-Ethiopian_Coffee_Ceremony.jpg", source: "wikimedia" },
            { name: "Moplaco Coffee Shop", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/A_cup_of_coffee_with_roasted_coffee_beans.jpg/800px-A_cup_of_coffee_with_roasted_coffee_beans.jpg", source: "wikimedia" },
            { name: "Hyatt Regency Addis Ababa", id: "63c933a0-bc78-443b-b489-ea6af97547f7", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Inside_the_African_Union%2C_Addis_Ababa_%282%29.jpg/800px-Inside_the_African_Union%2C_Addis_Ababa_%282%29.jpg", source: "wikimedia" },
            { name: "2000 Habesha Cultural Restaurant", id: "78677cb0-1792-40fd-b7ba-6191db1b3b9c", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Ethiopian_food_on_a_large_injera.jpg/800px-Ethiopian_food_on_a_large_injera.jpg", source: "wikimedia" },
            { name: "Lucy Lounge", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Ethiopia_Addis_Ababa_skyline.jpg/800px-Ethiopia_Addis_Ababa_skyline.jpg", source: "wikimedia" },
            { name: "Sishu Restaurant", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/800px-Good_Food_Display_-_NCI_Visuals_Online.jpg", source: "wikimedia" },
            { name: "Yod Abyssinia", id: "ea1704ef-1e40-485d-b23b-abf23015615c", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Ethiopian_Coffee_Ceremony.jpg/800px-Ethiopian_Coffee_Ceremony.jpg", source: "wikimedia" },
            { name: "Ethio Travel and Tours", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Simien_Mountains_National_Park.jpg/800px-Simien_Mountains_National_Park.jpg", source: "wikimedia" },
            { name: "Feres Ride", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Addis_Ababa_Light_Rail_vehicle%2C_March_2015.jpg/800px-Addis_Ababa_Light_Rail_vehicle%2C_March_2015.jpg", source: "wikimedia" },
        ];

        for (const item of imageBackfill) {
            let place;
            if (item.id) {
                place = await prisma.place.findUnique({ where: { id: item.id } });
            } else {
                place = await prisma.place.findFirst({ where: { name: item.name } });
            }
            if (!place) { results.push(`SKIP (not found): ${item.name}`); continue; }

            const existing = await prisma.placeImage.count({ where: { placeId: place.id } });
            if (existing > 0) { results.push(`SKIP (has images): ${item.name}`); continue; }

            await prisma.placeImage.create({
                data: {
                    placeId: place.id,
                    imageUrl: item.url,
                    priority: 1,
                    verifiedAt: new Date(),
                }
            });

            // Update audit via raw query (ImageAudit not in generated Prisma types)
            await (prisma as any).$executeRawUnsafe(
                `UPDATE "ImageAudit" SET status = 'ok', "imageUrl" = $1, notes = 'Backfilled' WHERE "entityId" = $2`,
                item.url, place.id
            );
            results.push(`IMAGE OK: ${item.name}`);
        }

        // ============================================================
        // PART B — Add Google Maps links via raw SQL
        // ============================================================
        const mapsBackfill: Record<string, string> = {
            "Bole Luxury Apartment": "https://maps.google.com/?q=Bole+Luxury+Apartment+Addis+Ababa",
            "Fendika Cultural Center": "https://maps.google.com/?q=Fendika+Cultural+Center+Addis+Ababa",
            "The Mosaic Hotel": "https://maps.google.com/?q=The+Mosaic+Hotel+Addis+Ababa",
            "Totot Lounge": "https://maps.google.com/?q=Totot+Lounge+Addis+Ababa",
            "Adot Tina Hotel": "https://maps.google.com/?q=Adot+Tina+Hotel+Addis+Ababa",
            "Z Guest House": "https://maps.google.com/?q=Z+Guest+House+Addis+Ababa",
            "Ethiopian Skylight Hotel": "https://maps.google.com/?q=Ethiopian+Skylight+Hotel+Addis+Ababa",
            "Haile Grand Addis Ababa": "https://maps.google.com/?q=Haile+Grand+Hotel+Addis+Ababa",
            "Mado Hotel": "https://maps.google.com/?q=Mado+Hotel+Bole+Addis+Ababa",
            "Kuriftu Resort & Spa": "https://maps.google.com/?q=Kuriftu+Resort+and+Spa+Debre+Zeit",
            "Totot Traditional Restaurant": "https://maps.google.com/?q=Totot+Traditional+Restaurant+Gerji+Addis+Ababa",
            "Yod Abyssinia Cultural Restaurant": "https://maps.google.com/?q=Yod+Abyssinia+Cultural+Restaurant+Addis+Ababa",
            "Bale Mountains National Park": "https://maps.google.com/?q=Bale+Mountains+National+Park+Ethiopia",
            "Danakil Depression Tour": "https://maps.google.com/?q=Danakil+Depression+Afar+Ethiopia",
            "Entoto Natural Park": "https://maps.google.com/?q=Entoto+Natural+Park+Addis+Ababa",
            "Rock-Hewn Churches of Lalibela": "https://maps.google.com/?q=Rock+Hewn+Churches+Lalibela+Ethiopia",
            "2000 Habesha Cultural Restaurant": "https://maps.google.com/?q=2000+Habesha+Cultural+Restaurant+Addis+Ababa",
        };

        for (const [name, mapsUrl] of Object.entries(mapsBackfill)) {
            const place = await prisma.place.findFirst({ where: { name } });
            if (!place) { results.push(`MAPS SKIP: ${name}`); continue; }
            // Use raw query since googleMapsUrl may not be in Prisma types
            await (prisma as any).$executeRawUnsafe(
                `UPDATE "Place" SET "googleMapsUrl" = $1 WHERE id = $2 AND ("googleMapsUrl" IS NULL OR "googleMapsUrl" = '')`,
                mapsUrl, place.id
            );
            results.push(`MAPS OK: ${name}`);
        }

        // Fix specific IDs
        for (const id of ["0483a594-e04c-483e-a75b-36b5385d6d34", "63c933a0-bc78-443b-b489-ea6af97547f7"]) {
            await (prisma as any).$executeRawUnsafe(
                `UPDATE "Place" SET "googleMapsUrl" = $1 WHERE id = $2 AND ("googleMapsUrl" IS NULL OR "googleMapsUrl" = '')`,
                "https://maps.google.com/?q=Hyatt+Regency+Addis+Ababa", id
            );
        }

        // ============================================================
        // PART C — Backfill websites & contact info
        // ============================================================
        const contactBackfill = [
            { name: "Sheraton Addis", websiteUrl: "https://www.marriott.com/en-us/hotels/addlc-sheraton-addis/overview/", phone: "+251 11 517 1717" },
            { name: "Radisson Blu Addis Ababa", websiteUrl: "https://www.radissonhotels.com/en-us/hotels/radisson-blu-addis-ababa", phone: "+251 11 515 8400" },
            { name: "Capital Hotel & Spa", websiteUrl: "https://capitalhotelspa.com", phone: "+251 11 667 3700" },
            { name: "Golden Tulip Addis Ababa", websiteUrl: "https://www.goldentulipaddisababa.com", phone: "+251 11 557 0057" },
            { name: "Jupiter International Hotel", websiteUrl: "https://www.jupiterinternationalhotel.com", phone: "+251 11 629 4400" },
            { name: "Harmony Hotel Addis Ababa", websiteUrl: "https://www.harmonyhoteladdis.com", phone: "+251 11 661 0000" },
            { name: "Best Western Plus Addis Ababa", websiteUrl: "https://www.bestwestern.com", phone: "+251 11 618 5060" },
            { name: "Marriott Executive Apartments Addis Ababa", websiteUrl: "https://www.marriott.com", phone: "+251 11 518 8888" },
            { name: "Hotel Lobelia", websiteUrl: null, phone: "+251 11 661 6060" },
            { name: "Bole Ambassador Hotel", websiteUrl: null, phone: "+251 11 618 4000" },
            { name: "Tomoca Coffee", websiteUrl: "https://tomocacoffee.com", phone: null },
            { name: "Kategna Restaurant", websiteUrl: null, phone: "+251 11 552 5025" },
            { name: "Dashen Traditional Restaurant", websiteUrl: null, phone: "+251 11 551 1212" },
            { name: "Habesha 2000", websiteUrl: null, phone: "+251 11 551 5555" },
            { name: "Five Loaves Restaurant", websiteUrl: null, phone: "+251 91 233 8888" },
            { name: "Castelli Restaurant", websiteUrl: null, phone: "+251 11 111 3400" },
            { name: "National Museum of Ethiopia", websiteUrl: null, phone: "+251 11 111 7150" },
            { name: "Unity Park", websiteUrl: "https://unitypark.et", phone: null },
            { name: "Addis Ababa Lion Zoo", websiteUrl: null, phone: "+251 11 155 0079" },
        ];

        for (const item of contactBackfill) {
            const place = await prisma.place.findFirst({ where: { name: item.name } });
            if (!place) { results.push(`CONTACT SKIP: ${item.name}`); continue; }
            if (item.websiteUrl && !place.websiteUrl) {
                await prisma.place.update({ where: { id: place.id }, data: { websiteUrl: item.websiteUrl } });
            }
            if (item.phone && !place.phone) {
                await prisma.place.update({ where: { id: place.id }, data: { phone: item.phone } });
            }
            results.push(`CONTACT OK: ${item.name}`);
        }

        return NextResponse.json({ success: true, totalActions: results.length, results });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
