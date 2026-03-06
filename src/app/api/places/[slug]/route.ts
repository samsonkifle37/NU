import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const place = await prisma.place.findUnique({
            where: { slug },
            include: {
                images: { orderBy: { priority: "asc" } },
                reviews: {
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: "desc" },
                    take: 20,
                },
                _count: { select: { reviews: true, favorites: true } },
            },
        });

        if (!place) {
            return NextResponse.json({ error: "Place not found" }, { status: 404 });
        }

        const agg = await prisma.review.aggregate({
            where: { placeId: place.id },
            _avg: { rating: true },
        });

        const audit = await prisma.imageAudit.findFirst({
            where: { entityId: place.id },
            select: { status: true }
        });

        return NextResponse.json({
            ...place,
            avgRating: agg._avg.rating || null,
            auditStatus: audit?.status || null,
        });
    } catch (error) {
        console.error("Error fetching place:", error);
        return NextResponse.json(
            { error: "Failed to fetch place" },
            { status: 500 }
        );
    }
}
