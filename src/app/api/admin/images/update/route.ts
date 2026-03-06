import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Force re-compile for prisma schema update

export async function POST(req: NextRequest) {
    try {
        // B) Add an admin protection check
        const authHeader = req.headers.get("Authorization");
        const adminSecret = process.env.ADMIN_SEED_SECRET; // Using existing seed secret as admin key

        if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, imageUrl, source, sourcePageUrl } = await req.json(); // id is ImageAudit.id
        console.log(`[UpdateAPI] Processing Audit: ${id} for URL: ${imageUrl}`);

        const audit = await prisma.imageAudit.findUnique({ where: { id } });
        if (!audit) {
            console.error(`[UpdateAPI] Audit record not found: ${id}`);
            return NextResponse.json({ error: "Audit record not found" }, { status: 404 });
        }

        // A) /api/admin/images/update is server-side only logic here
        const { mirrorImage } = await import("@/lib/supabase-storage");

        let finalUrl = imageUrl;
        let mirrorSuccessful = false;

        // Try mirroring if possible
        try {
            // Use audit.entityId to find the actual Place
            const place = await prisma.place.findUnique({ where: { id: audit.entityId } });
            if (place && imageUrl) {
                console.log(`[UpdateAPI] Mirroring for Place: ${place.name} (${place.slug})`);
                // C) Mirroring must: download with headers, upload to Supabase, store public URL
                // Determine folder based on entityType
                const typeFolder = (audit.entityType === 'tour') ? 'tours' :
                    (audit.entityType === 'stay') ? 'stays' : 'places';
                const folder = `${typeFolder}/${place.slug}`;
                finalUrl = await mirrorImage(imageUrl, folder, "cover");
                mirrorSuccessful = true;
                console.log(`[UpdateAPI] Mirrored successfully: ${finalUrl}`);
            } else {
                console.warn(`[UpdateAPI] Place not found for entityId: ${audit.entityId}`);
            }
        } catch (mirrorError) {
            console.warn("Mirroring failed:", mirrorError);
            // In strict mode (Rule 2), if mirror fails, we might want to reject.
            // But we'll return an error so the caller knows.
            return NextResponse.json({
                error: `Mirroring failed: ${String(mirrorError)}`,
                item: imageUrl
            }, { status: 500 });
        }

        // C) Store public URL, imageSource, sourcePageUrl, verifiedAt
        const existingImage = await prisma.placeImage.findFirst({
            where: { placeId: audit.entityId }
        });

        const imageMetadata = {
            imageUrl: finalUrl,
            imageSource: source || (imageUrl.includes('wikimedia') ? 'wikimedia' : 'official'),
            sourcePageUrl: sourcePageUrl || imageUrl,
            verifiedAt: new Date()
        };

        if (existingImage) {
            await prisma.placeImage.update({
                where: { id: existingImage.id },
                data: imageMetadata
            });
        } else {
            await prisma.placeImage.create({
                data: {
                    placeId: audit.entityId,
                    ...imageMetadata,
                    priority: 0
                }
            });
        }

        // 2. Update Audit table
        await prisma.imageAudit.update({
            where: { id },
            data: {
                imageUrl: finalUrl,
                status: 'ok',
                httpCode: 200,
                notes: mirrorSuccessful ? "Mirrored to Supabase" : "Manual Update",
                checkedAt: new Date(),
                verifiedAt: new Date(),
                source: imageMetadata.imageSource,
                sourcePageUrl: imageMetadata.sourcePageUrl
            }
        });

        return NextResponse.json({ success: true, mirrored: mirrorSuccessful, url: finalUrl });
    } catch (error) {
        console.error("Update API error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
