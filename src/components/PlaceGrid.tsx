"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PlaceCard } from "./PlaceCard";
import { Search, Filter } from "lucide-react";
import { getPrimaryImage } from "@/lib/images";

interface PlaceGridProps {
    title: string;
    types: string;
    filterOptions: { value: string; label: string }[];
    searchPlaceholder?: string;
    accentColor?: string;
}

interface PlaceData {
    id: string;
    slug: string;
    name: string;
    type: string;
    city: string;
    area: string;
    shortDescription: string | null;
    avgRating: number | null;
    tags: string[];
    websiteUrl: string | null;
    source: string;
    images: { imageUrl: string; priority?: number }[];
    auditStatus?: "ok" | "missing" | "blocked" | "broken" | null;
}

interface PlacesResponse {
    places: PlaceData[];
    total: number;
}

async function fetchPlaces(types: string, search: string): Promise<PlacesResponse> {
    const params = new URLSearchParams();
    if (types) params.set("type", types);
    if (search) params.set("search", search);
    params.set("limit", "50");

    const res = await fetch(`/api/places?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch places");
    return res.json();
}

export function PlaceGrid({
    title,
    types,
    filterOptions,
    searchPlaceholder = "Search...",
    accentColor = "ethiopia-green",
}: PlaceGridProps) {
    const [activeFilter, setActiveFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const activeTypes = activeFilter || types;

    const { data, isLoading, error } = useQuery({
        queryKey: ["places", activeTypes, searchQuery],
        queryFn: () => fetchPlaces(activeTypes, searchQuery),
    });

    return (
        <div className="space-y-6 pt-4">
            {/* Header */}
            <div className="flex justify-between items-center px-1">
                <h1 className="text-2xl font-black tracking-tight uppercase">
                    {title}
                </h1>
                <button className="p-2.5 bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/30 active:scale-90 transition-transform">
                    <Filter className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Search */}
            <div className="relative group px-1">
                <div className={`absolute -inset-1 bg-gradient-to-r from-${accentColor}/10 to-transparent rounded-2xl blur opacity-20 pointer-events-none`} />
                <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-${accentColor} transition-colors z-10`} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className={`w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/20 focus:outline-none focus:ring-2 focus:ring-${accentColor}/10 focus:border-${accentColor}/30 transition-all font-semibold text-sm relative z-0`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                {filterOptions.map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => {
                            setActiveFilter(filter.value);
                            setSearchQuery("");
                        }}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeFilter === filter.value
                            ? "bg-brand-dark text-white shadow-lg shadow-gray-300/50 border-brand-dark"
                            : "bg-white text-gray-400 border-gray-100 shadow-sm hover:border-gray-200"
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-4 px-1">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="bg-gray-100 animate-pulse h-72 rounded-[2rem]"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-gray-200">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-bold text-gray-900">
                            Something went wrong
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Please try again later
                        </p>
                    </div>
                ) : data && data.places.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-gray-200">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-lg font-bold text-gray-900">
                            No results found
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Try adjusting your filters
                        </p>
                    </div>
                ) : (
                    data?.places.map((place) => (
                        <PlaceCard
                            key={place.id}
                            slug={place.slug}
                            name={place.name}
                            type={place.type}
                            city={place.city}
                            area={place.area}
                            shortDescription={place.shortDescription}
                            heroImage={getPrimaryImage(place)}
                            avgRating={place.avgRating}
                            tags={place.tags}
                            websiteUrl={place.websiteUrl}
                            source={place.source}
                            auditStatus={place.auditStatus}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
