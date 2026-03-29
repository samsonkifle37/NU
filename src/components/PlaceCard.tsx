"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Star, ExternalLink, ShieldCheck } from "lucide-react";
import { VerifiedImage } from "@/components/media/VerifiedImage";

interface PlaceCardProps {
    slug: string;
    name: string;
    type: string;
    city: string;
    area: string;
    shortDescription?: string | null;
    heroImage?: string | null;
    avgRating?: number | null;
    tags?: string[];
    websiteUrl?: string | null;
    source?: string | null;
    auditStatus?: "ok" | "missing" | "blocked" | "broken" | null;
    reviewCount?: number;
    verificationScore?: number;
    visualScore?: number;
    ownerVerified?: boolean;
    featured?: boolean;
    hasRealPhotos?: boolean;
}

export function PlaceCard({
    slug,
    name,
    type,
    city,
    area,
    shortDescription,
    heroImage,
    avgRating,
    tags,
    websiteUrl,
    source,
    auditStatus,
    reviewCount = 0,
    verificationScore = 30,
    visualScore = 0,
    ownerVerified = false,
    featured = false,
    hasRealPhotos = false,
}: PlaceCardProps) {
    const typeColors: Record<string, string> = {
        hotel: "bg-blue-500/90",
        guesthouse: "bg-emerald-500/90",
        apartment: "bg-violet-500/90",
        tour: "bg-orange-500/90",
        restaurant: "bg-rose-500/90",
        club: "bg-purple-500/90",
        resort: "bg-teal-500/90",
    };

    return (
        <Link
            href={`/place/${slug}`}
            className="block bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 overflow-hidden border border-gray-50 active:scale-[0.98] transition-all duration-300 group"
        >
            <div className="relative overflow-hidden h-52 group/image">
                <VerifiedImage
                    src={heroImage}
                    alt={name}
                    className="w-full h-full"
                    entityType={type as any}
                    status={auditStatus}
                    showBadge={false}
                    isRepresentative={!hasRealPhotos && !!heroImage}
                />

                {/* Type badge */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                    <span
                        className={`${typeColors[type] || "bg-gray-500/90"} text-white text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full backdrop-blur-sm`}
                    >
                        {type}
                    </span>
                    
                    {featured && (
                        <span className="bg-[#C9973B]/90 text-white text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full backdrop-blur-sm w-fit flex items-center gap-1 shadow-md">
                            <Star className="w-2.5 h-2.5 text-white fill-white" /> Popular
                        </span>
                    )}

                    {hasRealPhotos && heroImage && !heroImage.includes('unsplash.com') && !heroImage.includes('/fallbacks/') && (
                        <span className="bg-emerald-500/90 text-white text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full backdrop-blur-sm w-fit flex items-center gap-1 shadow-md border border-white/20">
                            <span className="text-[10px]">📷</span> Real Photos
                        </span>
                    )}

                    {ownerVerified && (
                        <span className="bg-[#1A1612]/90 text-white text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full backdrop-blur-sm w-fit flex items-center gap-1 shadow-md border border-white/20">
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-500" /> Owner Verified
                        </span>
                    )}
                </div>

            </div>

            <div className="p-4">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-gray-900 tracking-tight leading-tight group-hover:text-[#C9973B] transition-colors truncate">
                            {name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                {area ? `${area}, ${city}` : city}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    {/* Key Tag */}
                    <div className="flex gap-1.5">
                        {tags && tags.filter(t => !["automated", "mock"].includes(t.toLowerCase())).slice(0, 1).map((tag) => (
                            <span
                                key={tag}
                                className="bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Rating / Tour info */}
                    <div className="flex items-center gap-1">
                        {type === 'tour' || type === 'park' ? (
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-600">
                                <span>Duration varies</span>
                                <span>•</span>
                                <span>Local guide</span>
                            </div>
                        ) : reviewCount > 0 && avgRating ? (
                            <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-[#C9973B] fill-[#C9973B]" />
                                <span className="text-[11px] font-black text-gray-800">
                                    {avgRating.toFixed(1)} <span className="text-gray-400 font-medium">({reviewCount})</span>
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-[#C9973B] fill-[#C9973B]" />
                                <span className="text-[10px] font-bold text-[#C9973B] uppercase tracking-wider bg-[#C9973B]/10 px-2 py-0.5 rounded-full">New listing</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
