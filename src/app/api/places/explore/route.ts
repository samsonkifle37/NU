import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam) : 100;

        // Fetch places from explore-v2.5 data seed
        const places = await prisma.place.findMany({
            where: {
                source: "explore-v2.5",
                status: "APPROVED",
                isActive: true
            },
            include: {
                images: {
                    select: { imageUrl: true },
                    take: 1
                }
            },
            take: limit
        });

        return NextResponse.json({ places }, { status: 200 });
    } catch (error) {
        console.error("Explore fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
    }
}
