"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { VerifiedImage } from "@/components/media/VerifiedImage";
import {
    ArrowLeft,
    Star,
    MapPin,
    Globe,
    Phone,
    Mail,
    ExternalLink,
    MessageCircle,
    Heart,
    Share2,
    ChevronRight,
    X,
    CheckCircle2,
    PlusCircle,
    Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useInAppBrowser } from "@/components/InAppBrowser";
import { getPrimaryVerifiedImage } from "@/lib/images";

interface PlaceImage {
    id: string;
    imageUrl: string;
    altText: string | null;
    priority: number;
    imageTruthType?: string; // place_real, representative, placeholder
}

interface Review {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    createdAt: string;
    user: { name: string };
}

interface PlaceDetail {
    id: string;
    slug: string;
    name: string;
    type: string;
    city: string;
    area: string;
    country: string;
    shortDescription: string | null;
    longDescription: string | null;
    websiteUrl: string | null;
    bookingUrl: string | null;
    googleMapsUrl: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    tags: string[];
    images: PlaceImage[];
    reviews: Review[];
    avgRating: number | null;
    auditStatus?: "ok" | "missing" | "blocked" | "broken" | null;
    ownerVerified: boolean;
    featured: boolean;
    verificationScore: number;
    _count: { reviews: number; favorites: number };
    openingHours: string[] | null;
    whatsapp: string | null;
    priceLevel: number | null;
}

async function fetchPlace(slug: string): Promise<PlaceDetail> {
    const res = await fetch(`/api/places/${slug}`);
    if (!res.ok) throw new Error("Place not found");
    return res.json();
}

function ClaimModal({ place, user, onClose, onSuccess }: { place: PlaceDetail, user: any, onClose: () => void, onSuccess: () => void }) {
    const [fullName, setFullName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState("");
    const [relationship, setRelationship] = useState("");
    const [proofNote, setProofNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/places/${place.slug}/claim`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, phone, relationship, proofNote, userId: user?.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Claim failed");
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                    <X className="w-4 h-4 text-gray-500" />
                </button>
                <div className="mb-6">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Claim {place.name}</h2>
                    <p className="text-xs text-gray-500 mt-1">Please provide your details so our team can verify your relationship to this business.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-[#C9973B] transition-all" />
                    <input type="email" placeholder="Business Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-[#C9973B] transition-all" />
                    <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-[#C9973B] transition-all" />
                    <select value={relationship} onChange={e => setRelationship(e.target.value)} required className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-[#C9973B] transition-all text-gray-700">
                        <option value="" disabled>Relationship to Business</option>
                        <option value="owner">Owner / Proprietor</option>
                        <option value="manager">General Manager</option>
                        <option value="marketing">Marketing / PR</option>
                        <option value="other">Other</option>
                    </select>
                    <textarea placeholder="Any proof notes? (Website link, LinkedIn, etc.)" value={proofNote} onChange={e => setProofNote(e.target.value)} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-[#C9973B] transition-all min-h-[80px]" />
                    {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-[#1A1A2E] text-[#D4AF37] font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-xl shadow-gray-900/10 hover:bg-gray-800 transition-colors disabled:opacity-50 mt-2">
                        {loading ? "Submitting..." : "Submit Claim Request"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function PlaceDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const browser = useInAppBrowser();
    const [activeTab, setActiveTab] = useState<"overview" | "gallery" | "reviews">("overview");
    const [isSaved, setIsSaved] = useState(false);
    const searchParams = useSearchParams();
    const [showClaimForm, setShowClaimForm] = useState(false);
    const [claimSuccess, setClaimSuccess] = useState(false);

    // Visited / Journal state
    const [myVisits, setMyVisits] = useState<Array<{ id: string; visitedAt: string; note: string | null; rating: number | null }>>([]);
    const [totalVisitors, setTotalVisitors] = useState(0);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitNote, setVisitNote] = useState("");
    const [visitRating, setVisitRating] = useState(0);
    const [isLoggingVisit, setIsLoggingVisit] = useState(false);

    useEffect(() => {
        if (searchParams.get("tab") === "reviews") {
            setActiveTab("reviews");
        }
        if (searchParams.get("claim") === "1" && user) {
            setShowClaimForm(true);
        }
    }, [searchParams, user]);

    // Review form state
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const { data: place, isLoading, error } = useQuery({
        queryKey: ["place", slug],
        queryFn: () => fetchPlace(slug),
        enabled: !!slug,
    });

    // Check if place is favorited
    useEffect(() => {
        if (!user || !place) return;
        fetch("/api/user/favorites")
            .then((r) => r.json())
            .then((data) => {
                const favIds = (data.favorites || []).map((f: { placeId: string }) => f.placeId);
                setIsSaved(favIds.includes(place.id));
            })
            .catch(() => { });
    }, [user, place]);

    // Load visit data
    useEffect(() => {
        if (!place) return;
        fetch(`/api/places/${slug}/visits`)
            .then(r => r.json())
            .then(data => {
                setMyVisits(data.myVisits || []);
                setTotalVisitors(data.totalVisitors || 0);
            })
            .catch(() => {});
    }, [place, slug]);

    const logVisit = async () => {
        if (!user) {
            window.location.href = `/auth?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
            return;
        }
        setIsLoggingVisit(true);
        try {
            const res = await fetch(`/api/places/${slug}/visits`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note: visitNote || undefined, rating: visitRating || undefined }),
            });
            if (res.ok) {
                const visit = await res.json();
                setMyVisits((prev: any[]) => [visit, ...prev]);
                setTotalVisitors((prev: number) => myVisits.length === 0 ? prev + 1 : prev);
                setShowVisitModal(false);
                setVisitNote("");
                setVisitRating(0);
            }
        } finally {
            setIsLoggingVisit(false);
        }
    };

    const deleteVisit = async (visitId: string) => {
        await fetch(`/api/places/${slug}/visits`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitId }),
        });
        setMyVisits((prev: any[]) => prev.filter((v: any) => v.id !== visitId));
    };

    const toggleFav = useMutation({
        mutationFn: async () => {
            if (!place) return;
            if (isSaved) {
                await fetch("/api/user/favorites", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ placeId: place.id }),
                });
            } else {
                await fetch("/api/user/favorites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ placeId: place.id }),
                });
            }
        },
        onSuccess: () => {
            setIsSaved(!isSaved);
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
        },
    });

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rating) return;
        setIsSubmittingReview(true);
        try {
            const res = await fetch(`/api/places/${slug}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, comment: reviewComment }),
            });
            if (res.ok) {
                setRating(0);
                setReviewComment("");
                queryClient.invalidateQueries({ queryKey: ["place", slug] });
            } else {
                alert("Failed to post review. Please try again.");
            }
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (isLoading) {
        return (
            <div className="pt-4 space-y-4">
                <div className="bg-gray-100 animate-pulse h-72 rounded-[2rem]" />
                <div className="bg-gray-100 animate-pulse h-8 rounded-xl w-48" />
                <div className="bg-gray-100 animate-pulse h-4 rounded-lg w-32" />
                <div className="bg-gray-100 animate-pulse h-32 rounded-2xl" />
            </div>
        );
    }

    if (error || !place) {
        return (
            <div className="pt-8 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h2 className="text-xl font-bold">Place not found</h2>
                <Link href="/" className="text-ethiopia-green text-sm font-bold mt-4 inline-block">
                    ← Back to Home
                </Link>
            </div>
        );
    }

    const typeColors: Record<string, string> = {
        hotel: "bg-blue-500",
        guesthouse: "bg-emerald-500",
        apartment: "bg-violet-500",
        tour: "bg-orange-500",
        restaurant: "bg-rose-500",
        club: "bg-purple-500",
        resort: "bg-teal-500",
    };

    const heroImage = getPrimaryVerifiedImage(place);

    const galleryImages = (place.images || []).filter(img =>
        !img.imageUrl.includes('unsplash.com') &&
        !img.imageUrl.includes('placeholder.com') &&
        !img.imageUrl.includes('placehold.co')
    );
    if (heroImage && !galleryImages.some(img => img.imageUrl === heroImage)) {
        galleryImages.unshift({ id: 'fallback-hero', imageUrl: heroImage, altText: place.name, priority: 0 } as any);
    }

    // Curated factual fallback for places with only short descriptions
    let displayDescription = place.longDescription;
    if (!displayDescription && place.shortDescription) {
        const typeNoun = place.type.replace('_', ' ');
        displayDescription = `${place.shortDescription} Located in ${place.area ? `${place.area}, ` : ""}${place.city}, this ${typeNoun} offers visitors an authentic experience. Whether you're looking to explore the local atmosphere or simply enjoy the surroundings, it's a great choice for travelers.`;
    }

    return (
        <div className="space-y-0 -mx-4">
            {/* Header Image Carousel */}
            <div className="relative h-80 overflow-x-auto snap-x snap-mandatory flex no-scrollbar bg-black">
                {galleryImages.map((img, index) => (
                    <div key={img.id || index} className="relative w-full shrink-0 h-full snap-start">
                        <VerifiedImage
                            src={img.imageUrl}
                            alt={img.altText || place.name}
                            className="w-full h-full object-cover"
                            entityType={place.type as any}
                            status={place.auditStatus}
                            showBadge={index === 0}
                            priority={index === 0}
                            isRepresentative={img.imageTruthType !== 'place_real'}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        {/* Honesty cue for representative/placeholder images */}
                        {img.imageTruthType && img.imageTruthType !== 'place_real' && (
                            <div className="absolute top-14 right-3 z-20">
                                <span className="bg-black/40 backdrop-blur-md text-white/80 text-[8px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border border-white/10">
                                    {img.imageTruthType === 'representative' ? '📷 Visual preview' : '🖼 Placeholder'}
                                </span>
                            </div>
                        )}
                    </div>
                ))}

                {/* Top bar */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 sticky left-0 w-full mb-auto mt-0 px-4">
                    <button
                        onClick={() => window.history.back()}
                        className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => user ? toggleFav.mutate() : alert("Sign in to save places!")}
                            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-transform"
                        >
                            <Heart
                                className={`w-5 h-5 transition-colors ${isSaved ? "text-[#C9973B] fill-[#C9973B]" : "text-white"}`}
                            />
                        </button>
                        <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                            <Share2 className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Bottom info overlaid on the first slide logically, or fixed across all. We stick it at the bottom of the container */}
                <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none sticky left-0 px-4 w-full">
                    <div className="flex gap-1.5 mb-2">
                        <span className={`bg-[#2D6A4F]/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full`}>
                            {place.type}
                        </span>

                        {place.priceLevel !== null && place.priceLevel !== undefined && (
                            <span className="bg-white/20 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full border border-white/20">
                                {place.priceLevel === 0 ? "Free" : "$".repeat(place.priceLevel)}
                            </span>
                        )}
                        
                        {place.featured && (
                            <span className="bg-[#C9973B]/90 text-white text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full backdrop-blur-sm w-fit flex items-center gap-1 shadow-md">
                                <Star className="w-2.5 h-2.5 text-white fill-white" /> Popular
                            </span>
                        )}

                        {place.ownerVerified && (
                            <span className="bg-[#1A1612]/90 text-white text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full backdrop-blur-sm w-fit flex items-center gap-1 shadow-md border border-white/20">
                                🛡️ Owner Verified
                            </span>
                        )}
                        
                        {!place.ownerVerified && place.verificationScore >= 40 && (
                            <span className="bg-slate-400/90 text-white text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full backdrop-blur-sm w-fit flex items-center gap-1 shadow-md border border-white/40">
                                ✓ Verified
                            </span>
                        )}
                    </div>
                    <h1 className="text-white text-3xl font-black tracking-tight leading-tight drop-shadow-lg">
                        {place.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-white/90">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {place.area ? `${place.area}, ${place.city}` : place.city}
                            </span>
                        </div>
                        {place.avgRating && (
                            <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-[#C9973B] fill-[#C9973B]" />
                                <span className="text-white text-xs font-black">
                                    {place.avgRating.toFixed(1)}
                                </span>
                                <span className="text-white/60 text-[10px]">
                                    ({place._count.reviews})
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                
                {galleryImages.length > 1 && (
                     <div className="absolute bottom-4 right-6 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold tracking-widest sticky left-[calc(100%-80px)] z-20">
                         {galleryImages.length} PHOTOS &rarr;
                     </div>
                )}
            </div>

            {/* Tabs */}
            <div className="px-4 pb-24">
                <div className="flex gap-0 bg-gray-100 rounded-xl p-1 mt-4">
                    {(["overview", "reviews"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab
                                ? "bg-white text-[#1A1612] shadow-sm"
                                : "text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="py-6 space-y-5">
                    {activeTab === "overview" && (
                        <>
                            {/* Description */}
                            {displayDescription && (
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-3">
                                        About
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                        {displayDescription}
                                    </p>
                                </div>
                            )}

                            {/* Opening Hours */}
                            {place.openingHours && place.openingHours.length > 0 && (
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-2">
                                        <span>🕐</span> Hours
                                    </h3>
                                    <div className="space-y-1">
                                        {place.openingHours.map((day: string, i: number) => {
                                            const [dayName, hours] = day.split(": ");
                                            const isToday = new Date().toLocaleDateString("en-US",{weekday:"long"}) === dayName;
                                            return (
                                                <div key={i} className={`flex justify-between text-sm ${isToday ? "font-bold text-gray-900" : "text-gray-500 font-medium"}`}>
                                                    <span className="w-28 shrink-0">{dayName}</span>
                                                    <span className={`text-right ${isToday ? "text-ethiopia-green" : ""}`}>{hours || "Closed"}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {place.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {place.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-gray-100"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Contact info */}

                            {/* 🇪🇹 Amharic Phrases for Visitors */}
                            {(() => {
                                const amharicPhrases: Record<string, Array<{ amharic: string; latin: string; english: string }>> = {
                                    hotel: [
                                        { amharic: "ሰላም", latin: "Selam", english: "Hello / Peace" },
                                        { amharic: "ክፍል እፈልጋለሁ", latin: "Kifil ifelgalehu", english: "I need a room" },
                                        { amharic: "ዋጋው ስንት ነው?", latin: "Wagaw sint new?", english: "How much does it cost?" },
                                        { amharic: "አመሰግናለሁ", latin: "Ameseginalehu", english: "Thank you" },
                                        { amharic: "ውሃ", latin: "Wiha", english: "Water" },
                                    ],
                                    restaurant: [
                                        { amharic: "ሰላም", latin: "Selam", english: "Hello / Peace" },
                                        { amharic: "ምግብ ዝርዝር", latin: "Migib zirizir", english: "Menu, please" },
                                        { amharic: "ኢንጀራ", latin: "Injera", english: "Injera (staple flatbread)" },
                                        { amharic: "ጣፋጭ ነው!", latin: "Tafach new!", english: "It's delicious!" },
                                        { amharic: "ሂሳቡን", latin: "Hisabun", english: "The bill, please" },
                                        { amharic: "በቃ", latin: "Beka", english: "Enough / I'm full" },
                                    ],
                                    tour: [
                                        { amharic: "ሰላም", latin: "Selam", english: "Hello / Peace" },
                                        { amharic: "ይህ ምንድን ነው?", latin: "Yih mindin new?", english: "What is this?" },
                                        { amharic: "ፎቶ ልነሳ?", latin: "Foto linesa?", english: "Can I take a photo?" },
                                        { amharic: "ቆንጆ ነው!", latin: "Konjo new!", english: "It's beautiful!" },
                                        { amharic: "እባክዎ", latin: "Ibakwo", english: "Please" },
                                    ],
                                    default: [
                                        { amharic: "ሰላም", latin: "Selam", english: "Hello / Peace" },
                                        { amharic: "አመሰግናለሁ", latin: "Ameseginalehu", english: "Thank you" },
                                        { amharic: "ዋጋው ስንት ነው?", latin: "Wagaw sint new?", english: "How much?" },
                                        { amharic: "እባክዎ", latin: "Ibakwo", english: "Please" },
                                        { amharic: "ቻው", latin: "Chaw", english: "Goodbye" },
                                    ],
                                };
                                const placeType = place.type?.toLowerCase() || "";
                                const typeKey = placeType.includes("hotel") || placeType.includes("guesthouse") || placeType.includes("apartment") || placeType.includes("resort")
                                    ? "hotel"
                                    : placeType.includes("restaurant") || placeType.includes("club")
                                        ? "restaurant"
                                        : placeType.includes("tour")
                                            ? "tour"
                                            : "default";
                                const phrases = amharicPhrases[typeKey];
                                return (
                                    <div className="bg-gradient-to-br from-[#F5F0E8] to-white rounded-2xl p-5 shadow-sm border border-[#C9973B]/10">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-2">
                                            <span>🇪🇹</span> Useful Amharic
                                        </h3>
                                        <div className="space-y-2">
                                            {phrases.map((p, i) => (
                                                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                                                    <span className="text-lg font-bold text-gray-900 w-24 shrink-0 text-right">{p.amharic}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-bold text-[#C9973B]">{p.latin}</span>
                                                        <span className="text-[11px] text-gray-400 font-medium ml-2">{p.english}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-gray-400 font-medium mt-3 text-center uppercase tracking-wider">Tap & hold to copy • Locals appreciate the effort!</p>
                                    </div>
                                );
                            })()}

                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-3">
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-1">
                                    Contact & Links
                                </h3>

                                {place.googleMapsUrl && (
                                    <button
                                        onClick={() => browser.open(place.googleMapsUrl!, place.name + " — Maps")}
                                        className="flex items-center gap-3 text-sm text-gray-600 hover:text-ethiopia-green transition-colors group w-full text-left"
                                    >
                                        <MapPin className="w-4 h-4 text-gray-400 group-hover:text-ethiopia-green" />
                                        <span className="font-medium truncate flex-1">Open in Maps</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </button>
                                )}
                                {place.websiteUrl && (
                                    <button
                                        onClick={() => browser.open(place.websiteUrl!, place.name + " — Website")}
                                        className="flex items-center gap-3 text-sm text-gray-600 hover:text-ethiopia-green transition-colors group w-full text-left"
                                    >
                                        <Globe className="w-4 h-4 text-gray-400 group-hover:text-ethiopia-green" />
                                        <span className="font-medium truncate flex-1">Website</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </button>
                                )}
                                {place.bookingUrl && place.bookingUrl !== place.websiteUrl && (
                                    <button
                                        onClick={() => browser.open(place.bookingUrl!, place.name + " — Book")}
                                        className="flex items-center gap-3 text-sm text-gray-600 hover:text-ethiopia-green transition-colors group w-full text-left"
                                    >
                                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-ethiopia-green" />
                                        <span className="font-medium truncate flex-1">Book / Reserve</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </button>
                                )}
                                {place.phone && (
                                    <a
                                        href={`tel:${place.phone}`}
                                        className="flex items-center gap-3 text-sm text-gray-600"
                                    >
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{place.phone}</span>
                                    </a>
                                )}
                                {place.email && (
                                    <a
                                        href={`mailto:${place.email}`}
                                        className="flex items-center gap-3 text-sm text-gray-600"
                                    >
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{place.email}</span>
                                    </a>
                                )}

                                {place.whatsapp && (
                                    <a
                                        href={`https://wa.me/${place.whatsapp.replace(/[^0-9]/g, "")}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 text-sm text-gray-600 hover:text-green-600 transition-colors group w-full text-left"
                                    >
                                        <MessageCircle className="w-4 h-4 text-green-500 group-hover:text-green-600" />
                                        <span className="font-medium truncate flex-1">WhatsApp</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </a>
                                )}

                                {!place.websiteUrl && !place.bookingUrl && !place.phone && !place.email && !place.whatsapp && (
                                    <div className="text-[10px] text-gray-400 font-medium italic mt-2">
                                        More contact details coming soon.
                                    </div>
                                )}
                            </div>

                            {/* ✅ Visited / Journal Section */}
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                                        <span>✅</span> Visited
                                    </h3>
                                    {totalVisitors > 0 && (
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            {totalVisitors} traveller{totalVisitors !== 1 ? "s" : ""} been here
                                        </span>
                                    )}
                                </div>

                                {myVisits.length === 0 ? (
                                    <button
                                        onClick={() => user ? setShowVisitModal(true) : (window.location.href = `/auth?callbackUrl=${encodeURIComponent(window.location.pathname)}`)}
                                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3.5 text-sm font-bold text-gray-400 hover:border-ethiopia-green hover:text-ethiopia-green transition-colors"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        I've been here
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        {myVisits.map(v => (
                                            <div key={v.id} className="flex items-start gap-3 bg-gray-50 rounded-xl px-3.5 py-3">
                                                <CheckCircle2 className="w-4 h-4 text-ethiopia-green shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-black text-gray-700">
                                                            {new Date(v.visitedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                        </span>
                                                        {v.rating && (
                                                            <span className="text-[10px] text-[#C9973B] font-bold">
                                                                {"\u2605".repeat(v.rating)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {v.note && <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-tight">{v.note}</p>}
                                                </div>
                                                <button onClick={() => deleteVisit(v.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setShowVisitModal(true)}
                                            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-ethiopia-green transition-colors py-1"
                                        >
                                            <PlusCircle className="w-3.5 h-3.5" /> Log another visit
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* LOCATION BLOCK */}
                            <div className="mt-8">
                                <h2 className="text-xl font-black text-[#1A1A2E] mb-4">Location</h2>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col">
                                    <div className="w-full h-48 relative bg-gray-100">
                                        <iframe 
                                            width="100%" 
                                            height="100%" 
                                            style={{ border: 0 }}
                                            loading="lazy" 
                                            allowFullScreen 
                                            src={`https://maps.google.com/maps?q=${place.lat && place.lng ? `${place.lat},${place.lng}` : encodeURIComponent(place.name + " " + (place.city || ""))}&hl=en&z=15&output=embed`}
                                        ></iframe>
                                    </div>

                                    <div className="p-5 flex gap-4 relative z-10 bg-white">
                                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shrink-0 border border-gray-100/50 shadow-inner">
                                            <MapPin className="w-4 h-4 text-[#D4AF37]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 leading-tight">
                                                {place.address || place.area || place.city}
                                            </p>
                                            {(place.lat && place.lng) && (
                                                <p className="text-[10px] text-gray-400 font-mono mt-1">
                                                    {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
                                                </p>
                                            )}
                                            
                                            <a
                                                href={place.googleMapsUrl || (place.lat && place.lng ? `https://www.google.com/maps?q=${place.lat},${place.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + (place.address || place.city || ""))}`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-[#D4AF37] uppercase tracking-wider hover:text-amber-600 transition-colors"
                                            >
                                                Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Owner Claim + Photo Upload CTA — shown on zero/low real image listings */}
                            {(!place.images.some((img: PlaceImage) => img.imageTruthType === 'place_real')) && (
                                <div className="bg-gradient-to-br from-[#1A1A2E] to-[#2A2A4A] rounded-2xl p-6 border border-[#D4AF37]/20 shadow-xl text-white">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[#D4AF37] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#D4AF37]/20">
                                                <span className="text-xl">🚀</span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black tracking-tight text-[#D4AF37] uppercase">
                                                    Own this business?
                                                </h3>
                                                <p className="text-xs text-gray-300 font-medium">Claim your listing for free in 60 seconds.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-gray-200">
                                                <span className="text-[#D4AF37]">✓</span> Add real photos
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-200">
                                                <span className="text-[#D4AF37]">✓</span> Instantly boost your category ranking
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-200">
                                                <span className="text-[#D4AF37]">✓</span> Get the "Owner Verified" gold badge
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <button
                                                onClick={() => {
                                                    if (!user) {
                                                        window.location.href = `/auth?callbackUrl=${encodeURIComponent(window.location.pathname + '?claim=1')}`;
                                                    } else {
                                                        setShowClaimForm(true);
                                                    }
                                                }}
                                                className="w-full bg-[#D4AF37] text-black text-[11px] font-black uppercase tracking-[0.2em] px-4 py-3.5 rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 active:scale-95"
                                            >
                                                Claim & Upgrade Listing
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PREMIUM MONETIZATION CTA */}
                            {place.featured && (
                                <div className="mt-4 bg-[#1A1612] rounded-2xl p-5 shadow-xl text-white">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-[#C9973B] mb-1">
                                                Premium Partner
                                            </h3>
                                            <p className="text-xs text-gray-300">
                                                Book directly to secure the best rates and perks.
                                            </p>
                                        </div>
                                        {place.bookingUrl || place.websiteUrl ? (
                                            <button 
                                                onClick={() => browser.open((place.bookingUrl || place.websiteUrl)!, `Book ${place.name}`)}
                                                className="bg-[#C9973B] text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl hover:bg-amber-500 transition-colors shadow-lg shadow-amber-500/20"
                                            >
                                                Book Now
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => alert("Booking integration coming soon!")}
                                                className="bg-[#C9973B] text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl hover:bg-amber-500 transition-colors shadow-lg shadow-amber-500/20"
                                            >
                                                Inquire
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action buttons embedded in content if long, but mostly we'll use a sticky footer */}
                        </>
                    )}

{/* Replaced Gallery Tab entirely by the new Hero Carousel */}

                    {activeTab === "reviews" && (
                        <div className="space-y-4">
                            {/* Review Form */}
                            {user ? (
                                <form onSubmit={submitReview} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Write a Review</h3>

                                    <div className="flex gap-1 mb-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1 -ml-1 hover:scale-110 transition-transform"
                                            >
                                                <Star className={`w-6 h-6 ${(hoverRating || rating) >= star ? "text-ethiopia-yellow fill-ethiopia-yellow" : "text-gray-300"}`} />
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 mb-3 min-h-[80px]"
                                        placeholder="How was your experience?"
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        required
                                    />

                                    <button
                                        type="submit"
                                        disabled={!rating || isSubmittingReview}
                                        className="bg-brand-dark text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl disabled:opacity-50"
                                    >
                                        {isSubmittingReview ? "Submitting..." : "Submit Review"}
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={() => {
                                        window.location.href = `/auth?callbackUrl=${encodeURIComponent(window.location.pathname + '?tab=reviews')}`;
                                    }}
                                    className="w-full bg-[#1A1A2E]/5 rounded-2xl p-5 text-center border border-[#1A1A2E]/10 hover:bg-[#1A1A2E]/10 transition-colors"
                                >
                                    <h3 className="text-sm font-bold text-gray-900">Log in to leave a review</h3>
                                    <p className="text-xs text-gray-500 mt-1">Join the community to share your experience.</p>
                                </button>
                            )}

                            {/* Reviews List */}
                            {place.reviews.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 mt-4">
                                    <div className="text-4xl mb-3">⭐</div>
                                    <h3 className="text-sm font-bold text-gray-900">No reviews yet</h3>
                                    <p className="text-gray-400 text-xs mt-1">Be the first to share your experience</p>
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {place.reviews.map((review) => (
                                        <div key={review.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {review.user.name}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3 h-3 ${i < review.rating
                                                                ? "text-ethiopia-yellow fill-ethiopia-yellow"
                                                                : "text-gray-200"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            {review.title && (
                                                <h4 className="text-sm font-bold text-gray-800 mb-1">
                                                    {review.title}
                                                </h4>
                                            )}
                                            {review.body && (
                                                <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                                                    {review.body}
                                                </p>
                                            )}
                                            <div className="text-[9px] text-gray-400 mt-2 uppercase tracking-wide">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Inquiry Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-50 flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:px-8 max-w-lg mx-auto">
                {place.bookingUrl || place.websiteUrl ? (
                    <button
                        onClick={() => browser.open((place.bookingUrl || place.websiteUrl)!, place.name)}
                        className="flex-1 bg-[#1A1612] text-white py-3.5 rounded-2xl text-center text-[11px] font-black uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:bg-gray-800 transition-colors"
                    >
                        Request to Book
                    </button>
                ) : place.phone ? (
                    <a
                        href={`https://wa.me/${place.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-emerald-500 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
                    >
                        <Phone className="w-4 h-4" /> Inquiry via WhatsApp
                    </a>
                ) : (
                    <button
                        disabled
                        className="flex-1 bg-gray-100 text-gray-400 py-3.5 rounded-2xl text-center text-[11px] font-black uppercase tracking-widest"
                    >
                        Booking Info Unavailable
                    </button>
                )}
            </div>

            {/* Visit Log Modal */}
            {showVisitModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowVisitModal(false)} />
                    <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 animate-in slide-in-from-bottom shadow-2xl">
                        <button onClick={() => setShowVisitModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                        <div className="mb-5">
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Log your visit</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{place.name}</p>
                        </div>
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button key={s} onClick={() => setVisitRating(visitRating === s ? 0 : s)}
                                    className={`text-xl transition-transform hover:scale-110 ${visitRating >= s ? "opacity-100" : "opacity-30"}`}
                                >★</button>
                            ))}
                        </div>
                        <textarea
                            value={visitNote}
                            onChange={e => setVisitNote(e.target.value)}
                            placeholder="Add a note... (optional)"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 mb-4 min-h-[80px] resize-none"
                        />
                        <button
                            onClick={logVisit}
                            disabled={isLoggingVisit}
                            className="w-full bg-[#1A1612] text-white py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-gray-800 transition-colors"
                        >
                            {isLoggingVisit ? "Saving..." : "✓  Mark as Visited"}
                        </button>
                    </div>
                </div>
            )}

            {showClaimForm && user && (
                <ClaimModal place={place} user={user} onClose={() => setShowClaimForm(false)} onSuccess={() => {
                    setShowClaimForm(false);
                    setClaimSuccess(true);
                    setTimeout(() => setClaimSuccess(false), 5000);
                }} />
            )}

            {claimSuccess && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 text-xs font-bold whitespace-nowrap z-50 animate-in slide-in-from-bottom">
                    Claim request submitted successfully!
                </div>
            )}
        </div>
    );
}
