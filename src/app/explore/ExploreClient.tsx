"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Map, Link as LinkIcon, Share2, Navigation } from "lucide-react";
import Link from "next/link";
import { VerifiedImage } from "@/components/media/VerifiedImage";
import { BottomNav } from "@/components/BottomNav";
import { getPrimaryVerifiedImage } from "@/lib/images";

interface Place {
    id: string;
    name: string;
    type: string;
    shortDescription: string;
    googleMapsUrl: string;
    websiteUrl: string | null;
    featured: boolean;
    images: { imageUrl: string; errorType?: string }[];
    auditStatus?: "ok" | "missing" | "blocked" | "broken" | null;
}

export function ExploreClient() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [sort, setSort] = useState("recommended");
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    const categories = [
        { id: "all", label: "All" },
        { id: "must-see", label: "Must-See" },
        { id: "park", label: "Parks" },
        { id: "market", label: "Markets" },
        { id: "coffee", label: "Coffee" },
        { id: "restaurant", label: "Restaurants" },
        { id: "hotel", label: "Hotels" },
        { id: "tour", label: "Tours" },
        { id: "transport", label: "Transport" },
        { id: "tour_operator", label: "Operators" }
    ];

    useEffect(() => {
        fetch("/api/places/explore")
            .then(res => res.json())
            .then(data => {
                setPlaces(data.places || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch explore places", err);
                setLoading(false);
            });
    }, []);

    const filteredPlaces = places.filter(place => {
        const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            place.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeTab === "all") return matchesSearch;
        if (activeTab === "must-see") return matchesSearch && place.featured;
        return matchesSearch && place.type === activeTab;
    }).sort((a, b) => {
        if (sort === "a-z") return a.name.localeCompare(b.name);
        if (sort === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        return 0; // recommended
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* Header */}
            <div className="bg-white px-6 py-8 shadow-sm">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Explore Addis</h1>
                <p className="text-sm font-medium text-gray-400 mt-1">Real places, real photos, real links.</p>

                {/* Search Bar */}
                <div className="relative mt-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search museums, parks, coffee..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 focus:bg-white transition-all shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Categories */}
                <div className="flex overflow-x-auto gap-2 mt-6 pb-2 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border ${activeTab === cat.id
                                ? "bg-brand-dark text-white border-brand-dark shadow-md shadow-gray-200"
                                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <div className="mt-4 flex justify-end">
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="text-xs font-bold text-gray-500 bg-transparent focus:outline-none appearance-none cursor-pointer"
                    >
                        <option value="recommended">Sort: Recommended</option>
                        <option value="a-z">Sort: A-Z</option>
                        <option value="featured">Sort: Featured</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="p-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-gray-200 animate-pulse h-64 rounded-[2rem]"></div>
                        ))}
                    </div>
                ) : filteredPlaces.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 font-medium">No places found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlaces.map(place => (
                            <PlaceCard key={place.id} place={place} onClick={() => setSelectedPlace(place)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Drawer */}
            {selectedPlace && (
                <PlaceModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
            )}

            <BottomNav />
        </div>
    );
}

function PlaceCard({ place, onClick }: { place: Place, onClick: () => void }) {
    const imageUrl = getPrimaryVerifiedImage(place) || "";

    return (
        <div
            onClick={onClick}
            className="group block bg-white rounded-[2rem] shadow-lg shadow-gray-200/40 overflow-hidden border border-gray-100 cursor-pointer active:scale-[0.98] transition-all"
        >
            <div className="relative h-48 w-full bg-gray-100 group/image">
                <VerifiedImage
                    src={imageUrl}
                    alt={place.name}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                    entityType={place.type as any}
                    status={place.auditStatus}
                    showBadge={true}
                />

                <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur text-brand-dark px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-sm">
                        {place.type}
                    </span>
                </div>
            </div>
            <div className="p-5">
                <h3 className="text-lg font-black text-gray-900 tracking-tight line-clamp-1">{place.name}</h3>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 font-medium leading-relaxed">{place.shortDescription}</p>
            </div>
        </div>
    );
}

function PlaceModal({ place, onClose }: { place: Place, onClose: () => void }) {
    const imageUrl = getPrimaryVerifiedImage(place) || "";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button onClick={onClose} className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                        ✕
                    </button>
                </div>

                <div className="relative h-64 w-full bg-gray-100 group/image">
                    <VerifiedImage
                        src={imageUrl}
                        alt={place.name}
                        className="w-full h-full"
                        entityType={place.type as any}
                        status={place.auditStatus}
                        showBadge={true}
                    />
                </div>

                <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="text-ethiopia-green text-[10px] font-black uppercase tracking-[0.15em]">{place.type}</span>
                            <h2 className="text-2xl font-black text-gray-900 mt-1 tracking-tight leading-tight">{place.name}</h2>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-4 leading-relaxed font-medium">
                        {place.shortDescription}
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <a
                            href={place.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 bg-brand-dark hover:bg-black text-white px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-gray-200"
                        >
                            <Navigation className="w-4 h-4" /> Open in Maps
                        </a>

                        {place.websiteUrl && (
                            <a
                                href={place.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 hover:text-gray-900 hover:border-gray-300 border border-gray-200 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
                            >
                                <LinkIcon className="w-4 h-4" /> Website
                            </a>
                        )}

                        <button
                            className="flex items-center justify-center w-12 h-12 bg-white border border-gray-200 rounded-2xl shrink-0 group hover:border-gray-300 transition-colors"
                            onClick={() => navigator.clipboard.writeText(window.location.host + '/explore?id=' + place.id)}
                        >
                            <Share2 className="w-4 h-4 text-gray-500 group-hover:text-gray-900 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

