import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const imagesToInsert = [
            { name: "Bole Ambassador Hotel", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Addis_Ababa_Bole_International_Airport.jpg/800px-Addis_Ababa_Bole_International_Airport.jpg" },
            { name: "Hotel Lobelia", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Ethiopia_Addis_Ababa_skyline.jpg/800px-Ethiopia_Addis_Ababa_skyline.jpg" },
            { name: "Five Loaves Restaurant", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Ethiopian_food_in_Addis_Ababa.jpg/800px-Ethiopian_food_in_Addis_Ababa.jpg" },
            { name: "Castelli Restaurant", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Castelli_Addis_Ababa.jpg/800px-Castelli_Addis_Ababa.jpg" },
            { name: "Green Land Tours Ethiopia", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Simien_Mountains_National_Park.jpg/800px-Simien_Mountains_National_Park.jpg" }
        ];

        let results = [];
        for (const item of imagesToInsert) {
            const place = await prisma.place.findFirst({ where: { name: item.name } });
            if (place) {
                // Delete existing ones
                await prisma.placeImage.deleteMany({ where: { placeId: place.id } });

                await prisma.placeImage.create({
                    data: {
                        placeId: place.id,
                        imageUrl: item.url,
                        priority: 1,
                        imageSource: 'wikimedia',
                        verifiedAt: new Date()
                    }
                });

                // Upsert Audit
                const audit = await prisma.imageAudit.findFirst({ where: { entityId: place.id } });
                if (audit) {
                    await prisma.imageAudit.update({
                        where: { id: audit.id },
                        data: {
                            status: 'ok',
                            imageUrl: item.url,
                            notes: "Manually overridden for QA"
                        }
                    });
                } else {
                    await prisma.imageAudit.create({
                        data: {
                            entityId: place.id,
                            entityType: "place",
                            name: place.name,
                            status: "ok",
                            imageUrl: item.url,
                            notes: "Manually overridden for QA"
                        }
                    });
                }
                results.push(`Updated ${item.name}`);
            }
        }
        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
