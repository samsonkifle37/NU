"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, MapPin, ArrowRight, Loader2, Star } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { VerifiedImage } from "@/components/media/VerifiedImage";

interface AIPlace {
    id: string;
    name: string;
    slug: string;
    type: string;
    city: string;
    area: string;
    shortDescription: string;
    heroImage: string | null;
    score: number;
}

function PlanPageContent() {
    const searchParams = useSearchParams();
    const q = searchParams.get("q") || "";

    const [query, setQuery] = useState(q);
    const [loading, setLoading] = useState(false);
    const [resultDays, setResultDays] = useState<any[]>([]);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        if (q) {
            handleGenerate(q);
        }
    }, [q]);

    const handleGenerate = async (searchQuery: string) => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            // we simulate parsing the query for interests
            const interests = [];
            if (searchQuery.toLowerCase().includes("food") || searchQuery.toLowerCase().includes("eat")) interests.push("food");
            if (searchQuery.toLowerCase().includes("culture") || searchQuery.toLowerCase().includes("museum")) interests.push("culture");
            if (searchQuery.toLowerCase().includes("nature") || searchQuery.toLowerCase().includes("hike")) interests.push("nature");
            
            let requestedDays = 3;
            const daysMatch = searchQuery.match(/(\d+)\s+day/i);
            if (daysMatch) {
               requestedDays = parseInt(daysMatch[1]);
            }

            const req = await fetch("/api/ai/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    city: "Addis",
                    nights: requestedDays,
                    interests: interests.length > 0 ? interests : ["culture", "food"]
                })
            });
            const res = await req.json();
            setResultDays(res.days || []);
            setDebugInfo(res.debug || null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF8] pb-24 font-sans">
            <div className="bg-[#1A1612] px-5 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9973B]/10 rounded-full blur-[80px]" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#C9973B] to-[#E8C07A] rounded-2xl flex items-center justify-center shadow-lg shadow-[#C9973B]/20">
                            <Sparkles className="w-6 h-6 text-[#1A1612]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">AI Trip Planner</h1>
                            <p className="text-[#E8C07A] text-[10px] font-bold uppercase tracking-widest mt-0.5">Powered by Selam</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-6 relative z-20">
                <div className="bg-white p-2 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-2">
                    <input 
                        type="text" 
                        placeholder="E.g. 3 days focusing on history and coffee..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleGenerate(query)}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none placeholder-gray-400"
                    />
                    <button 
                        onClick={() => handleGenerate(query)}
                        disabled={loading || !query}
                        className="bg-[#1A1612] text-white p-3.5 rounded-xl disabled:opacity-50 hover:bg-gray-800 transition shadow-lg"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    </button>
                </div>

                <div className="mt-8 space-y-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-12 h-12 border-4 border-[#C9973B]/30 border-t-[#C9973B] rounded-full animate-spin" />
                            <p className="text-sm font-black uppercase tracking-widest text-[#1A1612] animate-pulse">Crafting itinerary...</p>
                        </div>
                    )}

                    {!loading && resultDays.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Here is your tailored plan:</h2>
                            
                            {debugInfo && (
                                <div className="mb-6 p-4 bg-[#1A1612] border border-[#C9973B]/50 rounded-xl shadow-lg">
                                    <h4 className="text-[#E8C07A] text-[10px] font-black uppercase tracking-widest mb-2 border-b border-[#C9973B]/20 pb-1">AI Planner Debug</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-300">
                                        <div>Requested Days: <span className="text-white font-bold">{debugInfo.requestedDays}</span></div>
                                        <div>Generated Days: <span className="text-green-400 font-bold">{debugInfo.generatedDays}</span></div>
                                        <div>Rendered Days: <span className="text-green-400 font-bold">{resultDays.length}</span></div>
                                        <div>Total Cards: <span className="text-[#C9973B] font-bold">{debugInfo.totalCards}</span></div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#C9973B]/20 before:to-transparent">
                                
                                {resultDays.map((d, index) => (
                                    <div key={index} className="space-y-6">
                                        {/* Morning */}
                                        <div className="relative flex items-start gap-4 z-10 pt-4">
                                            <div className="w-6 h-6 rounded-full bg-[#1A1612] border-4 border-white flex items-center justify-center shrink-0 shadow mt-1">
                                                <div className="w-1.5 h-1.5 bg-[#C9973B] rounded-full" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1612]">Day {d.day} <span className="text-[#C9973B]">Morning</span></h3>
                                                <p className="text-xs text-gray-500 font-medium mb-3 mt-1">Start your day right.</p>
                                                {d.morning && <TappableCard place={d.morning} />}
                                            </div>
                                        </div>

                                        {/* Afternoon */}
                                        <div className="relative flex items-start gap-4 z-10">
                                            <div className="w-6 h-6 rounded-full bg-[#E8C07A]/20 border-4 border-white flex items-center justify-center shrink-0 shadow mt-1">
                                                <div className="w-1.5 h-1.5 bg-[#E8C07A] rounded-full" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Day {d.day} <span className="text-gray-500">Afternoon</span></h3>
                                                {d.afternoon && <TappableCard place={d.afternoon} />}
                                            </div>
                                        </div>

                                        {/* Evening */}
                                        <div className="relative flex items-start gap-4 z-10">
                                            <div className="w-6 h-6 rounded-full bg-[#E8C07A]/20 border-4 border-white flex items-center justify-center shrink-0 shadow mt-1">
                                                <div className="w-1.5 h-1.5 bg-[#E8C07A] rounded-full" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Day {d.day} <span className="text-gray-500">Evening</span></h3>
                                                {d.evening && <TappableCard place={d.evening} />}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav />
        </div>
    );
}

export default function PlanPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9973B] animate-spin" /></div>}>
            <PlanPageContent />
        </Suspense>
    );
}

function TappableCard({ place }: { place: AIPlace }) {
    if (!place) return null;
    return (
        <Link href={`/place/${place.slug}`} className="block bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-3 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />
            
            <div className="flex gap-4 relative z-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 relative shadow-sm">
                    <VerifiedImage
                        src={place.heroImage}
                        alt={place.name}
                        entityType={place.type as any}
                        showBadge={false}
                        className="w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow">
                        {place.type}
                    </div>
                </div>

                <div className="flex-1 py-1 pr-6 flex flex-col justify-center">
                    <h4 className="text-sm font-black text-gray-900 tracking-tight leading-tight group-hover:text-[#C9973B] transition-colors">{place.name}</h4>
                    <div className="flex items-center gap-1 mt-1 text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{place.area ? `${place.area}, ${place.city}` : place.city}</span>
                    </div>
                    {place.shortDescription && <p className="text-[10px] text-gray-400 mt-2 line-clamp-1 font-medium italic">"{place.shortDescription}"</p>}
                </div>
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#FAFAF8] flex items-center justify-center border border-gray-100 shadow-sm group-hover:bg-[#C9973B] group-hover:text-white transition-colors group-hover:border-[#C9973B]">
                    <ArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </Link>
    );
}
