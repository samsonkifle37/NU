
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, urls, mirror = false } = body;

        if (!name || !urls || !Array.isArray(urls)) {
            return NextResponse.json({ error: "Invalid body" }, { status: 400 });
        }

        // Find places with this name (insensitive)
        const places = await prisma.place.findMany({
            where: { name: { contains: name, mode: 'insensitive' } }
        });

        if (places.length === 0) return NextResponse.json({ success: true, fixed: 0, message: "Not found" });

        let totalFixed = 0;
        for (const place of places) {
            // Delete all current image associations for this place
            await prisma.placeImage.deleteMany({ where: { placeId: place.id } });

            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                if (!url) continue;

                await prisma.placeImage.create({
                    data: {
                        placeId: place.id,
                        imageUrl: url,
                        priority: i + 1,
                        imageSource: mirror ? "supabase" : "raw_wikimedia",
                        verifiedAt: new Date(),
                    }
                });
            }

            // Fix ImageAudit without unique constraint on entityId
            // Delete old audits for this entity and create a fresh 'ok' one
            await prisma.imageAudit.deleteMany({
                where: { entityId: place.id }
            });

            await prisma.imageAudit.create({
                data: {
                    entityType: 'place',
                    entityId: place.id,
                    name: place.name,
                    status: 'ok',
                    imageUrl: urls[0] || null,
                    notes: 'Fixed via Repair API',
                    checkedAt: new Date(),
                    verifiedAt: new Date()
                }
            });

            totalFixed++;
        }

        return NextResponse.json({ success: true, fixed: totalFixed });
    } catch (e: any) {
        console.error("Replacement error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
