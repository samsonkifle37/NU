import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const places = await prisma.place.findMany({
            include: { images: true }
        });

        const entities = places.map((p: any) => {
            const hasImage = p.images && p.images.length > 0;
            const hasVerifiedImage = p.images?.some((img: any) => img.imageUrl?.includes("supabase.co") || img.imageUrl?.includes("wikimedia.org"));
            const galleryCount = p.images?.length || 0;
            const hasDescription = !!(p.longDescription || p.shortDescription);
            const hasMapsLink = !!p.googleMapsUrl;
            const hasWebsite = !!p.websiteUrl;
            const hasContact = !!(p.phone || p.email || p.bookingUrl);

            // Score: 5 criteria, each worth 20%
            let score = 0;
            if (hasImage) score += 20;
            if (galleryCount >= 2) score += 20; else if (galleryCount === 1) score += 10;
            if (hasDescription) score += 20;
            if (hasMapsLink) score += 20;
            if (hasContact || hasWebsite) score += 20;

            return {
                name: p.name,
                type: p.type,
                slug: p.slug,
                id: p.id,
                primaryImage: hasImage,
                verifiedImage: hasVerifiedImage,
                galleryCount,
                description: hasDescription,
                mapsLink: hasMapsLink,
                website: hasWebsite,
                contact: hasContact,
                score,
            };
        });

        entities.sort((a: any, b: any) => a.score - b.score);

        const totalEntities = entities.length;
        const avgScore = Math.round(entities.reduce((sum: number, e: any) => sum + e.score, 0) / totalEntities);
        const perfect = entities.filter((e: any) => e.score === 100).length;
        const needsWork = entities.filter((e: any) => e.score < 80).length;

        return NextResponse.json({
            summary: {
                totalEntities,
                averageScore: avgScore,
                perfectEntities: perfect,
                needsWorkEntities: needsWork,
            },
            entities,
        });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
