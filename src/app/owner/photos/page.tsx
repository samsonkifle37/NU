import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { OwnerPhotoUploadClient } from "@/components/owner/OwnerPhotoUploadClient";
import { createClient } from "@supabase/supabase-js";
import { Camera, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Upload Photos — AddisView Owner" };
export const dynamic = "force-dynamic";

async function getUserFromCookies(): Promise<{ id: string; email: string } | null> {
    try {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        const tokenCookie = allCookies.find(c =>
            c.name.includes("auth-token") || c.name === "sb-access-token"
        );
        if (!tokenCookie?.value) return null;

        let tokenValue = tokenCookie.value;
        try {
            const parsed = JSON.parse(tokenValue);
            tokenValue = parsed.access_token || tokenValue;
        } catch {}

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser(tokenValue);
        return user ? { id: user.id, email: user.email! } : null;
    } catch {
        return null;
    }
}

export default async function OwnerPhotosPage({
    searchParams
}: {
    searchParams: Promise<{ placeId?: string }>
}) {
    const resolvedParams = await searchParams;
    const user = await getUserFromCookies();

    if (!user) {
        redirect("/auth?redirect=/owner/photos");
    }

    // Fetch all approved claims for this user
    const claims = await prisma.ownerClaim.findMany({
        where: { userId: user.id, status: "APPROVED" },
        include: {
            place: {
                select: { id: true, name: true, type: true, city: true, slug: true }
            }
        },
        orderBy: { submittedAt: "desc" }
    });

    if (claims.length === 0) {
        return (
            <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
                <div className="max-w-sm text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-8 h-8 text-gray-400" />
                    </div>
                    <h1 className="text-xl font-black text-gray-900">No Approved Claims</h1>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        You don&apos;t have any approved business claims yet.
                        Find your place and submit a claim — we typically review within 48 hours.
                    </p>
                    <Link
                        href="/explore"
                        className="inline-block px-6 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-700 transition"
                    >
                        Find My Place
                    </Link>
                </div>
            </div>
        );
    }

    const activeClaim = claims.find(c => c.place.id === resolvedParams.placeId) || claims[0];

    return (
        <div className="min-h-screen bg-[#FAFAF8] pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-5">
                <div className="max-w-2xl mx-auto">
                    <Link
                        href="/profile"
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition text-sm font-bold mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                            <Camera className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">My Business Photos</h1>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">Owner Upload Portal</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
                {/* Place Selector (if multiple claims) */}
                {claims.length > 1 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Select Business</p>
                        <div className="flex flex-col gap-2">
                            {claims.map(claim => (
                                <Link
                                    key={claim.id}
                                    href={`/owner/photos?placeId=${claim.place.id}`}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
                                        claim.place.id === activeClaim.place.id
                                            ? "bg-gray-900 text-white border-gray-900"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{claim.place.name}</p>
                                        <p className={`text-xs ${claim.place.id === activeClaim.place.id ? "text-gray-300" : "text-gray-400"}`}>
                                            {claim.place.city} · {claim.place.type}
                                        </p>
                                    </div>
                                    <ShieldCheck className="w-4 h-4 shrink-0 text-green-400" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Place Badge */}
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 truncate">{activeClaim.place.name}</p>
                        <p className="text-xs text-gray-400">{activeClaim.place.city} · Verified Owner</p>
                    </div>
                    <Link
                        href={`/place/${activeClaim.place.slug}`}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 transition shrink-0"
                    >
                        View Listing →
                    </Link>
                </div>

                {/* Upload Widget — client component handles auth token */}
                <OwnerPhotoUploadClient
                    placeId={activeClaim.place.id}
                    placeName={activeClaim.place.name}
                />
            </div>
        </div>
    );
}
