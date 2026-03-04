import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.places || !Array.isArray(body.places)) {
            return NextResponse.json({ error: "Invalid JSON format. Expected { 'places': [...] }" }, { status: 400 });
        }

        let inserted = 0;
        let updated = 0;
        let skipped = 0;
        const skipReasons: string[] = [];

        for (const place of body.places) {
            try {
                // Validation
                if (!place.name || !place.category || !place.google_maps_link) {
                    skipped++;
                    skipReasons.push(`Skipped place due to missing required fields: ${place.name || 'Unnamed'}`);
                    continue;
                }

                if (place.image_url && !place.image_url.startsWith("http")) {
                    skipped++;
                    skipReasons.push(`Skipped place ${place.name} due to invalid image_url`);
                    continue;
                }

                const slug = slugify(place.name, { lower: true, strict: true }) + "-" + place.category;

                // Create or Update (Upsert based on slug or name)
                const existing = await prisma.place.findUnique({ where: { slug } });

                const placeData = {
                    type: place.category,
                    name: place.name,
                    slug: slug,
                    shortDescription: place.description || null,
                    city: place.city || "Addis Ababa",
                    country: place.country || "Ethiopia",
                    googleMapsUrl: place.google_maps_link,
                    websiteUrl: place.official_website || null,
                    source: "explore-v2.5",
                    priceLevel: place.price_level || null,
                    neighborhood: place.neighborhood || null,
                    featured: !!place.featured,
                };

                if (existing) {
                    await prisma.place.update({
                        where: { id: existing.id },
                        data: placeData,
                    });

                    // Upsert image if valid
                    if (place.image_url) {
                        const existingImage = await prisma.placeImage.findFirst({ where: { placeId: existing.id } });
                        if (existingImage) {
                            await prisma.placeImage.update({
                                where: { id: existingImage.id },
                                data: { imageUrl: place.image_url, sourcePageUrl: place.image_source || null }
                            });
                        } else {
                            await prisma.placeImage.create({
                                data: {
                                    placeId: existing.id,
                                    imageUrl: place.image_url,
                                    sourcePageUrl: place.image_source || null
                                }
                            });
                        }
                    }
                    updated++;
                } else {
                    const newPlace = await prisma.place.create({ data: placeData });
                    if (place.image_url) {
                        await prisma.placeImage.create({
                            data: {
                                placeId: newPlace.id,
                                imageUrl: place.image_url,
                                sourcePageUrl: place.image_source || null
                            }
                        });
                    }
                    inserted++;
                }
            } catch (innerError) {
                skipped++;
                skipReasons.push(`Error on ${place.name}: ${String(innerError)}`);
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                total: body.places.length,
                inserted,
                updated,
                skipped,
                skipReasons
            }
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
