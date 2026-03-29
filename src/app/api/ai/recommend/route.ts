import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Types that make sense for each time-of-day slot
const MORNING_TYPES   = ["museum", "religious site", "landmark", "church", "gallery"];
const AFTERNOON_TYPES = ["market", "park", "tour", "attraction", "cafe", "coffee"];
const EVENING_TYPES   = ["restaurant", "club", "nightlife", "bar"];

// Any type that should NEVER appear in an itinerary slot
const EXCLUDED_TYPES  = ["home", "apartment", "guesthouse", "hotel", "hostel", "lodge", "resort", "stay"];

function isValidPlace(p: { name?: string | null; slug?: string | null; type?: string | null }): boolean {
    if (!p.name || !p.slug) return false;
    // Filter garbled / non-printable names (e.g. "Xa 7ח")
    if (/[^\x00-\x7F\u1200-\u137F\u2000-\u206F\u2600-\u26FF]/.test(p.name)) return false;
    // Must be at least 2 readable chars
    if (p.name.trim().length < 2) return false;
    // Exclude accommodation types
    if (EXCLUDED_TYPES.some(t => (p.type || "").toLowerCase().includes(t))) return false;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { budget, nights, interests, city } = body;

        const where: Record<string, unknown> = { isActive: true };
        if (city) {
            where.city = { contains: city, mode: "insensitive" };
        }

        const places = await prisma.place.findMany({
            where,
            include: {
                images: { take: 1, orderBy: { priority: "asc" } },
            },
        });

        const interestTags = (interests || []).map((i: string) => i.toLowerCase());

        // Score & filter to valid itinerary candidates only
        const scored = places
            .filter(isValidPlace)
            .map((place) => {
                let score = 0;
                for (const tag of place.tags) {
                    if (interestTags.includes(tag.toLowerCase())) score += 3;
                }
                if (interestTags.includes("food")     && place.type === "restaurant")    score += 2;
                if (interestTags.includes("nightlife") && place.type === "club")          score += 2;
                if (interestTags.includes("nature")   && place.type === "park")           score += 2;
                if (interestTags.includes("history")  && place.type === "museum")         score += 2;
                if (interestTags.includes("culture")  && ["restaurant","tour","museum","religious site","landmark"].includes(place.type)) score += 1;
                // Boost verified / featured places
                if ((place as unknown as Record<string,unknown>).ownerVerified) score += 1;
                if ((place as unknown as Record<string,unknown>).featured)      score += 1;
                return { ...place, score };
            })
            .sort((a, b) => b.score - a.score);

        const mornings   = scored.filter(p => MORNING_TYPES.some(t =>   p.type?.toLowerCase().includes(t)));
        const afternoons = scored.filter(p => AFTERNOON_TYPES.some(t => p.type?.toLowerCase().includes(t)));
        const evenings   = scored.filter(p => EVENING_TYPES.some(t =>   p.type?.toLowerCase().includes(t)));

        // General fallback pool (excludes already-typed buckets and accommodations)
        const general = scored.filter(p =>
            !MORNING_TYPES.some(t => p.type?.toLowerCase().includes(t)) &&
            !AFTERNOON_TYPES.some(t => p.type?.toLowerCase().includes(t)) &&
            !EVENING_TYPES.some(t => p.type?.toLowerCase().includes(t))
        );

        const requestedDays = Math.min(nights || 3, 7);
        const daysArray: { day: number; morning: typeof scored[0] | null; afternoon: typeof scored[0] | null; evening: typeof scored[0] | null }[] = [];
        const usedIds = new Set<string>();
        let cardsGenerated = 0;

        function pickFrom(pool: typeof scored, fallback: typeof scored): typeof scored[0] | null {
            let pick = pool.find(x => !usedIds.has(x.id));
            if (!pick) pick = fallback.find(x => !usedIds.has(x.id)) ?? null;
            if (pick) { usedIds.add(pick.id); cardsGenerated++; }
            return pick ?? null;
        }

        for (let day = 1; day <= requestedDays; day++) {
            const m = pickFrom(mornings, general);
            const a = pickFrom(afternoons, general);
            const e = pickFrom(evenings, general);
            daysArray.push({ day, morning: m, afternoon: a, evening: e });
        }

        const formatPlace = (r: typeof scored[0] | null) => r ? ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            type: r.type,
            city: r.city,
            area: r.area,
            shortDescription: r.shortDescription,
            heroImage: r.images?.[0]?.imageUrl || null,
            score: r.score,
        }) : null;

        const recommendedFlat = daysArray.flatMap(d => [d.morning, d.afternoon, d.evening]).filter(Boolean);
        const explanation = generateExplanation(
            recommendedFlat as { name: string; type: string }[],
            budget, nights, interests, city
        );

        // Server-side only debug log — never sent to client
        console.log("[AI Planner] days=%d cards=%d", daysArray.length, cardsGenerated);

        return NextResponse.json({
            days: daysArray.map(d => ({
                day: d.day,
                morning:   formatPlace(d.morning),
                afternoon: formatPlace(d.afternoon),
                evening:   formatPlace(d.evening),
            })),
            explanation,
        });
    } catch (error) {
        console.error("AI recommendation error:", error);
        return NextResponse.json(
            { error: "Failed to generate recommendations" },
            { status: 500 }
        );
    }
}

function generateExplanation(
    places: { name: string; type: string }[],
    budget: string | undefined,
    nights: number | undefined,
    interests: string[] | undefined,
    city: string | undefined
): string {
    const parts: string[] = [];
    if (city)    parts.push(`in ${city}`);
    if (nights)  parts.push(`for ${nights} night${nights > 1 ? "s" : ""}`);
    if (budget)  parts.push(`on a ${budget} budget`);
    if (interests?.length) parts.push(`interested in ${interests.join(", ")}`);

    const context = parts.length ? `Based on your trip ${parts.join(", ")}, ` : "";

    const activityRecs = places
        .filter(p => !["hotel","guesthouse","apartment","resort"].includes(p.type))
        .map(p => p.name);

    let explanation = context + "here are my top picks for you:\n\n";
    if (activityRecs.length > 0) {
        explanation += `🎯 **Experience**: ${activityRecs.join(", ")}\n`;
    }
    explanation += "\nEnjoy your Ethiopian adventure! 🇪🇹";
    return explanation;
}
