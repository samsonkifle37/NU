import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> } // Fix for Next.js 15 route segment config
) {
    try {
        const p = await params;
        const slug = p.slug;

        const body = await request.json();
        const { rating, comment } = body;

        // Verify Auth
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let decoded;
        try {
            const secret = process.env.JWT_SECRET || "fallback_secret";
            decoded = jwt.verify(token, secret) as { userId: string };
        } catch (e) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const userId = decoded.userId;

        // Find the place
        const place = await prisma.place.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!place) {
            return NextResponse.json({ error: "Place not found" }, { status: 404 });
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        // Check if user already reviewed
        const existingReview = await prisma.review.findFirst({
            where: {
                placeId: place.id,
                userId: userId,
            },
        });

        if (existingReview) {
            // Update existing
            const review = await prisma.review.update({
                where: { id: existingReview.id },
                data: {
                    rating,
                    body: comment,
                },
            });
            return NextResponse.json(review);
        } else {
            // Create new
            const review = await prisma.review.create({
                data: {
                    placeId: place.id,
                    userId: userId,
                    rating,
                    body: comment,
                },
            });
            return NextResponse.json(review);
        }
    } catch (error) {
        console.error("Review error:", error);
        return NextResponse.json(
            { error: "Failed to submit review" },
            { status: 500 }
        );
    }
}
