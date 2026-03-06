"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
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
    Heart,
    Share2,
    ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useInAppBrowser } from "@/components/InAppBrowser";
import { getPrimaryImage } from "@/lib/images";

interface PlaceImage {
    id: string;
    imageUrl: string;
    altText: string | null;
    priority: number;
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
    phone: string | null;
    email: string | null;
    tags: string[];
    images: PlaceImage[];
    reviews: Review[];
    avgRating: number | null;
    _count: { reviews: number; favorites: number };
    auditStatus?: "ok" | "missing" | "blocked" | "broken" | null;
}

async function fetchPlace(slug: string): Promise<PlaceDetail> {
    const res = await fetch(`/api/places/${slug}`);
    if (!res.ok) throw new Error("Place not found");
    return res.json();
}

export default function PlaceDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const browser = useInAppBrowser();
    const [activeTab, setActiveTab] = useState<"overview" | "gallery" | "reviews">("overview");
    const [isSaved, setIsSaved] = useState(false);

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

    const heroImage = getPrimaryImage(place);

    // Curated factual fallback for places with only short descriptions
    let displayDescription = place.longDescription;
    if (!displayDescription && place.shortDescription) {
        const typeNoun = place.type.replace('_', ' ');
        displayDescription = `${place.shortDescription} Located in ${place.area ? `${place.area}, ` : ""}${place.city}, this ${typeNoun} offers visitors an authentic experience. Whether you're looking to explore the local atmosphere or simply enjoy the surroundings, it's a great choice for travelers.`;
    }

    return (
        <div className="space-y-0 -mx-4">
            {/* Hero image */}
            <div className="relative h-80 overflow-hidden">
                <VerifiedImage
                    src={heroImage}
                    alt={place.name}
                    className="w-full h-full"
                    entityType={place.type as any}
                    status={place.auditStatus}
                    showBadge={false}
                    priority={true}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Top bar */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                    <Link
                        href="/"
                        className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div className="flex gap-2">
                        <button
                            onClick={() => user ? toggleFav.mutate() : alert("Sign in to save places!")}
                            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-transform"
                        >
                            <Heart
                                className={`w-5 h-5 transition-colors ${isSaved ? "text-ethiopia-red fill-ethiopia-red" : "text-white"}`}
                            />
                        </button>
                        <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                            <Share2 className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-4 left-4 right-4 z-10">
                    <span
                        className={`${typeColors[place.type] || "bg-gray-500"} text-white text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full`}
                    >
                        {place.type}
                    </span>
                    <h1 className="text-white text-2xl font-black tracking-tight mt-2 leading-tight drop-shadow-lg">
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
                                <Star className="w-3.5 h-3.5 text-ethiopia-yellow fill-ethiopia-yellow" />
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
            </div>

            {/* Tabs */}
            <div className="px-4">
                <div className="flex gap-0 bg-gray-50 rounded-2xl p-1 mt-4">
                    {(["overview", "gallery", "reviews"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab
                                ? "bg-white text-brand-dark shadow-sm"
                                : "text-gray-400 hover:text-gray-600"
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
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-3">
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-1">
                                    Contact & Links
                                </h3>
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
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                {place.bookingUrl && (
                                    <button
                                        onClick={() => browser.open(place.bookingUrl!, place.name + " — Book Now")}
                                        className="flex-1 bg-ethiopia-green text-white py-3.5 rounded-2xl text-center text-xs font-black uppercase tracking-widest shadow-lg shadow-ethiopia-green/30 hover:shadow-xl transition-shadow"
                                    >
                                        Book Now
                                    </button>
                                )}
                                {place.websiteUrl && (
                                    <button
                                        onClick={() => browser.open(place.websiteUrl!, place.name)}
                                        className="flex-1 bg-white text-brand-dark py-3.5 rounded-2xl text-center text-xs font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        View Website
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === "gallery" && (
                        <div className="grid grid-cols-2 gap-3">
                            {place.images.filter((img) =>
                                !img.imageUrl.includes("unsplash.com") &&
                                !img.imageUrl.includes("placeholder.com") &&
                                !img.imageUrl.includes("placehold.co")
                            ).map((img) => (
                                <div
                                    key={img.id}
                                    className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group"
                                >
                                    <VerifiedImage
                                        src={img.imageUrl}
                                        alt={img.altText || place.name}
                                        className="w-full h-full group-hover:scale-110 transition-transform duration-500"
                                        entityType={place.type as any}
                                        status={place.auditStatus}
                                        showBadge={false}
                                    />
                                </div>
                            ))}
                            {place.images.filter((img) =>
                                !img.imageUrl.includes("unsplash.com") &&
                                !img.imageUrl.includes("placeholder.com") &&
                                !img.imageUrl.includes("placehold.co")
                            ).length === 1 && (
                                    <div className="relative aspect-square rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center p-4 text-center">
                                        <div className="text-2xl mb-2 opacity-50">📷</div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">More photos<br />coming soon</p>
                                    </div>
                                )}
                            {place.images.filter((img) =>
                                !img.imageUrl.includes("unsplash.com") &&
                                !img.imageUrl.includes("placeholder.com") &&
                                !img.imageUrl.includes("placehold.co")
                            ).length === 0 && (
                                    <div className="col-span-2 text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <div className="text-4xl mb-3">📸</div>
                                        <p className="text-sm font-bold text-gray-900">No photos yet</p>
                                        <p className="text-xs text-gray-400 mt-1">We're verifying real images for this place.</p>
                                    </div>
                                )}
                        </div>
                    )}

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
                                <Link href="/auth" className="block bg-ethiopia-green/5 rounded-2xl p-5 text-center border border-ethiopia-green/10">
                                    <h3 className="text-sm font-bold text-gray-900">Log in to leave a review</h3>
                                    <p className="text-xs text-brand-muted mt-1">Join the community to share your experience.</p>
                                </Link>
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
        </div>
    );
}
