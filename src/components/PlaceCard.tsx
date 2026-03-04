"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, ExternalLink } from "lucide-react";

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
}: PlaceCardProps) {
    const [imgError, setImgError] = useState(false);
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
            <div className="relative overflow-hidden h-52">
                {heroImage && !imgError ? (
                    <Image
                        src={heroImage}
                        alt={name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 512px) 100vw, 512px"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center opacity-80">
                        <span className="text-4xl opacity-30 grayscale transition-all group-hover:grayscale-0 group-hover:scale-110 duration-700">🏛️</span>
                        <span className="mt-2 text-[8px] font-black uppercase tracking-widest text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Image Pending</span>
                    </div>
                )}

                {/* Type badge */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                    <span
                        className={`${typeColors[type] || "bg-gray-500/90"} text-white text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full backdrop-blur-sm`}
                    >
                        {type}
                    </span>
                    {source === "user-host" && (
                        <span className="bg-emerald-400/90 text-white text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full backdrop-blur-sm w-fit">
                            🏠 Hosted Home
                        </span>
                    )}
                </div>

                {/* Rating */}
                {avgRating && (
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-ethiopia-yellow fill-ethiopia-yellow" />
                        <span className="text-xs font-black text-gray-800">
                            {avgRating.toFixed(1)}
                        </span>
                    </div>
                )}

                {/* Tags */}
                {tags && tags.length > 0 && (
                    <div className="absolute bottom-3 left-4 flex gap-1.5 flex-wrap">
                        {tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="bg-black/30 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-white/10"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight group-hover:text-ethiopia-green transition-colors truncate">
                            {name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                {area ? `${area}, ${city}` : city}
                            </span>
                        </div>
                    </div>

                    {websiteUrl && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-ethiopia-green/10 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-ethiopia-green transition-colors" />
                        </div>
                    )}
                </div>

                {shortDescription && (
                    <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed font-medium">
                        {shortDescription}
                    </p>
                )}
            </div>
        </Link>
    );
}
