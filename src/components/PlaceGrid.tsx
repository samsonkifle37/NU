"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PlaceCard } from "./PlaceCard";
import { Search, Filter } from "lucide-react";
import { getPrimaryVerifiedImage } from "@/lib/images";

interface PlaceGridProps {
    title: string;
    types: string;
    filterOptions: { value: string; label: string }[];
    searchPlaceholder?: string;
    accentColor?: string;
    areaOptions?: { value: string; label: string; emoji?: string }[];
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
    images: { imageUrl: string; priority?: number; imageTruthType?: string; status?: string }[];
    auditStatus?: "ok" | "missing" | "blocked" | "broken" | null;
    ownerVerified?: boolean;
    featured?: boolean;
    verificationScore?: number;
    _count?: { reviews: number; favorites: number };
}

interface PlacesResponse {
    places: PlaceData[];
    total: number;
}

async function fetchPlaces(types: string, search: string, pageParam: number = 0, area: string = ""): Promise<PlacesResponse> {
    const params = new URLSearchParams();
    if (types) params.set("type", types);
    if (search) params.set("search", search);
    if (area) params.set("neighborhood", area);
    params.set("limit", "18");
    params.set("offset", pageParam.toString());

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
    areaOptions,
}: PlaceGridProps) {
    const [activeFilter, setActiveFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [areaFilter, setAreaFilter] = useState("");

    const activeTypes = activeFilter || types;

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ["places", activeTypes, searchQuery, areaFilter],
        queryFn: ({ pageParam }) => fetchPlaces(activeTypes, searchQuery, pageParam, areaFilter),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const currentCount = allPages.reduce((acc, page) => acc + page.places.length, 0);
            if (currentCount < lastPage.total) {
                return currentCount;
            }
            return undefined;
        },
    });

    const allPlaces = data?.pages.flatMap(page => page.places) || [];
    const totalCount = data?.pages[0]?.total || 0;

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

            <div className="sticky top-0 z-30 bg-[#FAFAF8]/90 backdrop-blur-xl pb-3 pt-2 -mx-1 px-2 space-y-4">
                {/* Search */}
                <div className="flex gap-2">
                    <div className="relative group flex-1">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#C9973B] transition-colors z-10`} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            className={`w-full pl-10 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C9973B]/20 transition-all font-semibold text-sm relative z-0`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    {/* Placeholder Sort Control */}
                    <button className="flex items-center justify-center shrink-0 w-[52px] h-[52px] bg-white rounded-2xl border border-gray-200 shadow-sm text-gray-600 hover:text-[#1A1612] transition-colors active:scale-95">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>
                    </button>
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {filterOptions.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => {
                                setActiveFilter(filter.value);
                                setSearchQuery("");
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeFilter === filter.value
                                ? "bg-[#1A1612] text-white shadow-md border-[#1A1612]"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900"
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

                {/* Area / Neighbourhood chips */}
                {areaOptions && areaOptions.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
                        <button
                            onClick={() => setAreaFilter("")}
                            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${!areaFilter ? "bg-[#C9973B] text-white border-[#C9973B] shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
                        >
                            📍 All Areas
                        </button>
                        {areaOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setAreaFilter(areaFilter === opt.value ? "" : opt.value)}
                                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${areaFilter === opt.value ? "bg-[#C9973B] text-white border-[#C9973B] shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
                            >
                                {opt.emoji}{opt.label}
                            </button>
                        ))}
                    </div>
                )}

            {/* Content */}
            <div className="space-y-4 px-1">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="bg-gray-100 animate-pulse h-72 rounded-[2rem] shadow-sm"
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
                ) : allPlaces.length === 0 ? (
                    <div className="text-center py-20 bg-[#FAFAF8] rounded-[2rem] border border-[#C9973B]/20 shadow-inner">
                        <div className="w-16 h-16 bg-[#C9973B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-[#C9973B]" />
                        </div>
                        <h3 className="text-lg font-black text-[#1A1612]">
                            No places found
                        </h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-[200px] mx-auto leading-relaxed">
                            Try adjusting your filters or search term to discover more.
                        </p>
                        <button 
                            onClick={() => { setSearchQuery(""); setActiveFilter(""); }}
                            className="mt-6 text-[10px] font-black uppercase tracking-widest bg-[#1A1612] text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{totalCount} {title} found</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {allPlaces.map((place) => (
                            <PlaceCard
                                key={place.id}
                            slug={place.slug}
                            name={place.name}
                            type={place.type}
                            city={place.city}
                            area={place.area}
                            shortDescription={place.shortDescription}
                            heroImage={getPrimaryVerifiedImage(place)}
                            avgRating={place.avgRating}
                            tags={place.tags}
                            websiteUrl={place.websiteUrl}
                            source={place.source}
                            auditStatus={place.auditStatus}
                            ownerVerified={place.ownerVerified}
                            featured={place.featured}
                            verificationScore={place.verificationScore}
                            reviewCount={place._count?.reviews}
                            hasRealPhotos={place.images?.some(img => img.imageTruthType === 'place_real' && img.status !== 'REJECTED' && img.status !== 'BLOCKED' && img.status !== 'FAILED')}
                        />
                    ))}
                    </div>
                    
                    {hasNextPage && (
                        <div className="flex justify-center pt-8 pb-4">
                            <button
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="bg-white border-2 border-gray-100 text-gray-900 font-black uppercase tracking-widest text-xs px-8 py-3.5 rounded-2xl hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                        Fetching...
                                    </>
                                ) : (
                                    "Load More"
                                )}
                            </button>
                        </div>
                    )}
                    {!hasNextPage && allPlaces.length > 0 && (
                        <div className="text-center py-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                You've reached the end
                            </p>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
    );
}
