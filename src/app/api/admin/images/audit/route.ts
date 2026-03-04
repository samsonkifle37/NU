import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const stats = await prisma.imageAudit.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const items = await prisma.imageAudit.findMany({
            where: {
                status: { not: 'ok' }
            },
            orderBy: { checkedAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ stats, items });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch audit" }, { status: 500 });
    }
}
