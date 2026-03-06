import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // comma-separated: hotel,guesthouse
        const city = searchParams.get("city");
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { isActive: true };

        if (type) {
            const types = type.split(",").map((t) => t.trim());
            where.type = { in: types };
        }

        if (city) {
            where.city = { contains: city, mode: "insensitive" };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { shortDescription: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
                { area: { contains: search, mode: "insensitive" } },
                { tags: { hasSome: [search.toLowerCase()] } },
            ];
        }

        const [places, total] = await Promise.all([
            prisma.place.findMany({
                where,
                include: {
                    images: {
                        orderBy: { priority: "asc" },
                        take: 3,
                    },
                    _count: { select: { reviews: true, favorites: true } },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.place.count({ where }),
        ]);

        // Fetch image audits for these places to provide explicit status
        const audits = await prisma.imageAudit.findMany({
            where: { entityId: { in: places.map((p) => p.id) } },
            select: { entityId: true, status: true }
        });
        const auditMap = new Map(audits.map((a: { entityId: string; status: string }) => [a.entityId, a.status]));

        // Compute avg rating per place & attach audit status
        const placesWithExtras = await Promise.all(
            places.map(async (place) => {
                const agg = await prisma.review.aggregate({
                    where: { placeId: place.id },
                    _avg: { rating: true },
                });
                return {
                    ...place,
                    avgRating: agg._avg.rating || null,
                    auditStatus: auditMap.get(place.id) || null
                };
            })
        );

        return NextResponse.json({
            places: placesWithExtras,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Error fetching places:", error);
        return NextResponse.json(
            { error: "Failed to fetch places" },
            { status: 500 }
        );
    }
}
