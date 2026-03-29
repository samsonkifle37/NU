"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, Image as ImageIcon } from "lucide-react";

interface VerifiedImageProps {
    src?: string | null;
    alt: string;
    className?: string;
    entityType?: "place" | "stay" | "tour" | "dining" | "nightlife" | "operator" | "transport" | string;
    status?: "ok" | "missing" | "blocked" | "broken" | "APPROVED" | "PENDING" | "FAILED" | null;
    showBadge?: boolean;
    badgeText?: string;
    fallbackSrc?: string;
    priority?: boolean;
    isRepresentative?: boolean;
}

export function VerifiedImage({
    src,
    alt,
    className = "",
    entityType = "place",
    status,
    showBadge = true,
    badgeText = "Real Photo",
    fallbackSrc = "", // empty defaults to the NU branded placeholder
    priority = false,
    isRepresentative = false,
}: VerifiedImageProps) {
    const [imgError, setImgError] = useState(false);

    const getFallbackPath = (type: string) => {
        const t = (type || "").toLowerCase();
        if (t.includes("hotel") || t.includes("stay") || t.includes("apartment") || t.includes("guesthouse") || t.includes("resort") || t.includes("lodge")) return "/fallbacks/stay-placeholder.svg";
        if (t.includes("restaurant") || t.includes("dining") || t.includes("coffee") || t.includes("nightlife") || t.includes("club") || t.includes("cafe")) return "/fallbacks/restaurant.png";
        if (t.includes("museum") || t.includes("culture") || t.includes("history")) return "/fallbacks/museum.png";
        if (t.includes("park") || t.includes("nature") || t.includes("tour") || t.includes("guide") || t.includes("attraction")) return "/fallbacks/park.png";
        if (t.includes("religious") || t.includes("church")) return "/fallbacks/religious.png";
        return "/fallbacks/landmark.png";
    };

    let safeSrc = src;
    if (safeSrc && safeSrc.includes('/fallbacks/hotel.png')) {
        safeSrc = '/fallbacks/stay-placeholder.svg';
    }

    const isDbFallback = safeSrc?.includes('/fallbacks/') || false;
    const hasValidSrc = safeSrc && safeSrc.trim() !== "" && !safeSrc.includes("unsplash.com") && !isDbFallback;
    const shouldShowFallback = imgError || !hasValidSrc || isDbFallback;
    const isExplicitRepresentative = isRepresentative || shouldShowFallback;
    
    const resolvedFallback = isDbFallback ? (safeSrc as string) : (fallbackSrc || getFallbackPath(entityType));

    // Use proxy only for supabase to bypass ORB/hotlinking
    const finalSrc = shouldShowFallback
        ? resolvedFallback
        : (safeSrc?.includes("supabase.co") || safeSrc?.startsWith("/") || safeSrc?.includes("wikimedia.org") || safeSrc?.includes("googleusercontent.com")
            ? safeSrc as string
            : `/api/image-proxy?url=${encodeURIComponent(safeSrc as string)}`);

    // Badge logic:
    const isVerified = !isExplicitRepresentative && (finalSrc.includes("supabase.co") || finalSrc.includes("wikimedia.org") || finalSrc.includes("googleusercontent.com") || status === "ok" || status === "APPROVED");

    return (
        <div className={`relative overflow-hidden bg-[#1A1612] ${className}`}>
            <Image
                src={finalSrc}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-all duration-700"
                onError={() => {
                    if (!imgError && finalSrc !== resolvedFallback) setImgError(true);
                }}
                priority={priority}
                loading={priority ? undefined : "lazy"}
                decoding="async"
                unoptimized={finalSrc?.includes('wikimedia.org') || finalSrc?.includes('/api/image-proxy') || finalSrc?.includes('googleusercontent.com') || finalSrc?.includes('/fallbacks/')}
            />

            {/* Badge */}
            {showBadge && isVerified && (
                <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                    <span className="bg-black/60 backdrop-blur-md text-white/90 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow text-shadow-sm border border-white/10 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        {badgeText}
                    </span>
                </div>
            )}
            
            {/* Fallback Label */}
            {isExplicitRepresentative && (
                <div className="absolute top-2 right-2 z-10 pointer-events-none">
                    <span className="bg-black/50 backdrop-blur-md text-gray-200 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm border border-white/5">
                        Representative Image
                    </span>
                </div>
            )}
        </div>
    );
}

