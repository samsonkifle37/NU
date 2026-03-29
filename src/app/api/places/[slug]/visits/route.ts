import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// Helper: verify auth and return userId
async function getAuthUserId(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) return null;
        const secret = process.env.JWT_SECRET || "fallback_secret";
        const decoded = jwt.verify(token, secret) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}

// GET — return my visits for this place + total visitor count
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const userId = await getAuthUserId();

        const place = await prisma.place.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!place) return NextResponse.json({ error: "Place not found" }, { status: 404 });

        const [totalVisitors, myVisits] = await Promise.all([
            // unique visitor count
            prisma.placeVisit.groupBy({
                by: ["userId"],
                where: { placeId: place.id },
            }).then(r => r.length),

            // my personal visits
            userId
                ? prisma.placeVisit.findMany({
                    where: { placeId: place.id, userId },
                    orderBy: { visitedAt: "desc" },
                })
                : [],
        ]);

        return NextResponse.json({ totalVisitors, myVisits });
    } catch (err) {
        console.error("GET /visits error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST — log a visit (optionally with note + rating)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const userId = await getAuthUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const place = await prisma.place.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!place) return NextResponse.json({ error: "Place not found" }, { status: 404 });

        const body = await request.json().catch(() => ({}));
        const { note, rating } = body as { note?: string; rating?: number };

        const visit = await prisma.placeVisit.create({
            data: {
                userId,
                placeId: place.id,
                note: note?.trim() || null,
                rating: rating && rating >= 1 && rating <= 5 ? rating : null,
            },
        });

        return NextResponse.json(visit, { status: 201 });
    } catch (err) {
        console.error("POST /visits error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// DELETE — remove a specific visit by id
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json().catch(() => ({}));
        const { visitId } = body as { visitId?: string };
        if (!visitId) return NextResponse.json({ error: "visitId required" }, { status: 400 });

        // Only delete if it belongs to this user
        const visit = await prisma.placeVisit.findFirst({
            where: { id: visitId, userId },
        });
        if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.placeVisit.delete({ where: { id: visitId } });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("DELETE /visits error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
