import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { fullName, email, phone, relationship, proofNote, userId } = await req.json();
        const resolvedParams = await params;

        if (!fullName || !email || !phone || !relationship) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const place = await prisma.place.findUnique({
            where: { slug: resolvedParams.slug },
            select: { id: true }
        });

        if (!place) {
            return NextResponse.json({ error: "Place not found" }, { status: 404 });
        }

        const claim = await prisma.ownerClaim.create({
            data: {
                placeId: place.id,
                userId: userId || null, // from logged in user
                fullName,
                email,
                phone,
                relationship,
                proofNote,
                status: "PENDING"
            }
        });

        return NextResponse.json({ success: true, claim });
    } catch (error: any) {
        console.error("Failed to create claim:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
