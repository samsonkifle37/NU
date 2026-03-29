
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import { CheckCircle, XCircle, ImageIcon } from "lucide-react";

export default function DebugImagesPage() {
    const [filter, setFilter] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["admin-content-dashboard"],
        queryFn: () => fetch("/api/admin/content-dashboard").then(r => r.json()),
    });

    const entities = data?.entities?.filter((e: any) =>
        e.name.toLowerCase().includes(filter.toLowerCase())
    ) || [];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 min-h-screen bg-gray-50">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight">Image Debug Dashboard</h1>
                <p className="text-gray-500">Live audit of all entity images across the app.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-4 z-10 flex gap-4">
                <input
                    type="text"
                    placeholder="Filter entities..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand-dark/10 outline-none"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                    <span>Total: {entities.length}</span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-brand-dark" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {entities.map((entity: any) => (
                        <div key={entity.id} className="bg-white rounded-3xl p-4 shadow-xl shadow-gray-200/40 border border-white flex flex-col gap-4">
                            <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-gray-100 group">
                                {entity.primaryImage ? (
                                    <ManagedImage
                                        name={entity.name}
                                        id={entity.id}
                                    />
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                                        <ImageIcon className="w-8 h-8 opacity-20" />
                                        <span className="text-[10px] uppercase font-bold tracking-widest mt-2">No Image</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <h3 className="font-bold text-gray-900 leading-tight">{entity.name}</h3>
                                <div className="flex flex-wrap gap-2">
                                    <Badge label={entity.type} color="bg-gray-100 text-gray-500" />
                                    <StatusBadge label="Primary" active={entity.primaryImage} />
                                    <StatusBadge label="Gallery" active={entity.galleryCount > 0} count={entity.galleryCount} />
                                    <StatusBadge label="Maps" active={entity.mapsLink} />
                                    <StatusBadge label="Contact" active={entity.contact || entity.website} />
                                </div>
                                <div className="pt-2 flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Score</span>
                                        <span className={`text-lg font-black ${entity.score === 100 ? 'text-emerald-500' : entity.score >= 80 ? 'text-blue-500' : 'text-orange-500'}`}>{entity.score}%</span>
                                    </div>
                                    <button
                                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                                        onClick={() => window.open(`/place/${entity.slug}`, '_blank')}
                                    >
                                        Visit Page
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ManagedImage({ name, id }: { name: string; id: string }) {
    const { data: place, isLoading, isError } = useQuery({
        queryKey: ["debug-place", id],
        queryFn: async () => {
            const res = await fetch(`/api/places?search=${encodeURIComponent(name)}`);
            if (!res.ok) throw new Error("Failed to load debug place");
            const d = await res.json();
            return d.places?.[0] || null;
        },
    });

    if (isLoading) return <div className="animate-pulse bg-gray-200 h-full w-full" />;

    // Use the first image from the array
    const url = place?.images?.[0]?.imageUrl;

    if (isError) return <div className="h-full w-full flex items-center justify-center text-red-500 bg-red-50 text-[10px] font-bold uppercase">Failed to load</div>;
    if (!url) return <div className="h-full w-full flex items-center justify-center text-red-400 bg-red-50 text-[10px] font-bold uppercase">Corrupt Data (Null)</div>;

    return (
        <img
            src={url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
    );
}

function Badge({ label, color }: { label: string; color: string }) {
    return <span className={`${color} text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md`}>{label}</span>;
}

function StatusBadge({ label, active, count }: { label: string; active: boolean; count?: number }) {
    return (
        <span className={`${active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'} border text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1`}>
            {active ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
            {label} {count !== undefined && `(${count})`}
        </span>
    );
}
