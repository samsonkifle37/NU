import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/places/[slug]/upload-photo — Owner photo upload
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();
        const { imageUrl, altText, setPrimary } = body;

        if (!imageUrl) {
            return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
        }

        const place = await prisma.place.findUnique({ where: { slug } });
        if (!place) {
            return NextResponse.json({ error: "Place not found" }, { status: 404 });
        }

        // Check image count cap (max 10 per place)
        const existingCount = await prisma.placeImage.count({
            where: { placeId: place.id }
        });
        if (existingCount >= 10) {
            return NextResponse.json({ error: "Maximum 10 images per listing" }, { status: 400 });
        }

        // Create the image entry — goes through the normal pipeline for validation
        const image = await prisma.placeImage.create({
            data: {
                placeId: place.id,
                imageUrl: imageUrl.trim(),
                altText: altText || place.name,
                imageSource: "owner_upload",
                imageTruthType: "place_real", // Owner photos are real
                status: "PENDING", // Still goes through quality pipeline
                qualityScore: 70, // High trust — owner-provided
                priority: setPrimary ? 0 : 1,
                labels: ["owner-uploaded"]
            }
        });

        return NextResponse.json({
            success: true,
            imageId: image.id,
            message: "Photo uploaded and queued for processing."
        }, { status: 201 });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
    }
}
