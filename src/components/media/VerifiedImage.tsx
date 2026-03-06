"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, Image as ImageIcon } from "lucide-react";

interface VerifiedImageProps {
    src?: string | null;
    alt: string;
    className?: string;
    entityType?: "place" | "stay" | "tour" | "dining" | "nightlife" | "operator" | "transport";
    status?: "ok" | "missing" | "blocked" | "broken" | null;
    showBadge?: boolean;
    badgeText?: string;
    fallbackSrc?: string;
    priority?: boolean;
}

export function VerifiedImage({
    src,
    alt,
    className = "",
    entityType = "place",
    status,
    showBadge = true,
    badgeText = "Real Photo",
    fallbackSrc = "/images/place-fallback.jpg",
    priority = false,
}: VerifiedImageProps) {
    const [imgError, setImgError] = useState(false);

    const isMissingStatus = status === "missing" || status === "blocked" || status === "broken";
    const hasValidSrc = src && src.trim() !== "";

    // Determine the final source to attempt to load
    const shouldShowFallback = imgError || isMissingStatus || !hasValidSrc;
    const finalSrc = shouldShowFallback ? fallbackSrc : src as string;

    // Badge logic: only if it's a supabase URL AND it has a status of "ok" (or verifiedAt logic depending on what we have, but status="ok" works as requested)
    const isVerified = !shouldShowFallback && finalSrc.includes("supabase.co") && status === "ok";

    return (
        <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
            {!shouldShowFallback ? (
                <Image
                    src={finalSrc}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-all duration-700"
                    onError={() => setImgError(true)}
                    priority={priority}
                    loading={priority ? undefined : "lazy"}
                    decoding="async"
                />
            ) : (
                // Clean fallback without scary "Pending" labels
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center opacity-80">
                    <ImageIcon className="w-8 h-8 text-gray-400/50 mb-2" />
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                        {entityType} Image
                    </span>
                </div>
            )}

            {/* Badge */}
            {showBadge && isVerified && (
                <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                    <span className="bg-black/60 backdrop-blur-md text-white/90 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow text-shadow-sm border border-white/10 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        {badgeText}
                    </span>
                </div>
            )}
        </div>
    );
}
