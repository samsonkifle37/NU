import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const stats = await prisma.imageAudit.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const items = await prisma.imageAudit.findMany({
            orderBy: { checkedAt: 'desc' },
            take: 100
        });

        const places = await prisma.place.findMany({
            where: { id: { in: items.map((i: any) => i.entityId) } },
            include: { images: true }
        });

        const placeMap = new Map(places.map(p => [p.id, p]));

        const mappedItems = items.map((item: any) => {
            const p: any = placeMap.get(item.entityId);
            return {
                ...item,
                primaryImagePresent: (p?.images?.length ?? 0) > 0,
                galleryCount: p?.images?.length ?? 0,
                mapsLinkPresent: !!p?.googleMapsUrl,
                websitePresent: !!p?.websiteUrl,
                contactDetailsPresent: !!(p?.phone || p?.email || p?.bookingUrl)
            };
        });

        return NextResponse.json({ stats, items: mappedItems });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch audit" }, { status: 500 });
    }
}
