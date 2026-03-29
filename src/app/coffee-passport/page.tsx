"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PlaceCard } from "@/components/PlaceCard";
import { getPrimaryVerifiedImage } from "@/lib/images";
import { Coffee, MapPin } from "lucide-react";

const STORAGE_KEY = "nu_coffee_passport_v1";

const STAMPS = [
    { id: "tomoca",       emoji: "☕", name: "Tomoca Coffee",        region: "Addis Ababa",  year: "Est. 1953",  color: "bg-amber-50  border-amber-200",  text: "text-amber-700"  },
    { id: "yirgacheffe",  emoji: "🌿", name: "Yirgacheffe Origin",   region: "SNNPR",        year: "Birthplace", color: "bg-green-50  border-green-200",  text: "text-green-700"  },
    { id: "kaffa",        emoji: "🌳", name: "Kaffa Forest Coffee",   region: "Kaffa Zone",   year: "Wild Origin",color: "bg-emerald-50 border-emerald-200",text: "text-emerald-700"},
    { id: "jimma",        emoji: "🫘", name: "Jimma Market Roast",    region: "Oromia",       year: "Trade Hub",  color: "bg-orange-50 border-orange-200", text: "text-orange-700" },
    { id: "harrar",       emoji: "🏺", name: "Harrar Dry Process",    region: "Harari Region",year: "Ancient",    color: "bg-red-50    border-red-200",    text: "text-red-700"    },
    { id: "ceremony",     emoji: "🔥", name: "Coffee Ceremony",       region: "Nationwide",   year: "Cultural",   color: "bg-rose-50   border-rose-200",   text: "text-rose-700"   },
    { id: "entoto",       emoji: "⛰️", name: "Entoto Forest Brew",   region: "Addis Ababa",  year: "Highland",   color: "bg-sky-50    border-sky-200",    text: "text-sky-700"    },
    { id: "sidama",       emoji: "✨", name: "Sidama Specialty",      region: "Sidama Region",year: "Award-Winning",color:"bg-purple-50 border-purple-200", text: "text-purple-700" },
];

interface StampRecord { id: string; date: string; }

export default function CoffeePassportPage() {
    const [collected, setCollected] = useState<StampRecord[]>([]);
    const [justStamped, setJustStamped] = useState<string | null>(null);

    // Fetch real coffee shops from DB
    const { data: coffeeData } = useQuery({
        queryKey: ["coffee-shops"],
        queryFn: async () => {
            const res = await fetch("/api/places?search=coffee&limit=6");
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
    });
    const coffeeShops = coffeeData?.places || [];

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setCollected(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    const stamp = (id: string) => {
        if (collected.find(s => s.id === id)) return; // already stamped
        const updated = [...collected, { id, date: new Date().toLocaleDateString("en-GB") }];
        setCollected(updated);
        setJustStamped(id);
        setTimeout(() => setJustStamped(null), 2000);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
    };

    const share = async () => {
        const count = collected.length;
        const text  = `I've collected ${count}/${STAMPS.length} stamps on my Ethiopian Coffee Passport with NU! ☕🇪🇹 #NUEthiopia #CoffeePassport`;
        if (navigator.share) {
            await navigator.share({ text, url: "https://addisview.vercel.app" }).catch(() => {});
        } else {
            await navigator.clipboard.writeText(text).catch(() => {});
            alert("Copied to clipboard!");
        }
    };

    const progressPct = Math.round((collected.length / STAMPS.length) * 100);

    return (
        <div className="space-y-6 pt-4 pb-24 px-1">
            {/* Header */}
            <header>
                <Link href="/" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition mb-3">
                    <ArrowLeft className="w-3 h-3" /> Back
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">☕</span>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">Coffee Passport</h1>
                            <p className="text-[10px] text-[#C9973B] font-black uppercase tracking-widest mt-0.5">Ethiopia — Birthplace of Coffee</p>
                        </div>
                    </div>
                    <button
                        onClick={share}
                        className="flex items-center gap-1.5 bg-[#C9973B] text-[#1A1612] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E8C07A] transition"
                    >
                        <Share2 className="w-3 h-3" /> Share
                    </button>
                </div>
            </header>

            {/* Progress bar */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#C9973B]" />
                        <span className="text-sm font-black text-gray-900">Your Collection</span>
                    </div>
                    <span className="text-sm font-black text-[#C9973B]">{collected.length} / {STAMPS.length}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-3 rounded-full bg-gradient-to-r from-[#C9973B] to-[#E8C07A] transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">
                    {collected.length === 0
                        ? "Tap any stamp below when you visit a coffee experience to collect it!"
                        : collected.length === STAMPS.length
                            ? "🎉 Congratulations — full passport collected! Share it with the world."
                            : `${STAMPS.length - collected.length} more stamp${STAMPS.length - collected.length > 1 ? "s" : ""} to go — keep exploring!`}
                </p>
            </div>

            {/* Stamps grid */}
            <div className="grid grid-cols-2 gap-3">
                {STAMPS.map(s => {
                    const record    = collected.find(c => c.id === s.id);
                    const isCollected = !!record;
                    const isNew     = justStamped === s.id;

                    return (
                        <button
                            key={s.id}
                            onClick={() => stamp(s.id)}
                            disabled={isCollected}
                            className={`relative rounded-[1.5rem] border-2 p-4 text-center space-y-2 transition-all active:scale-95 ${
                                isCollected
                                    ? `${s.color} ${s.text} opacity-100`
                                    : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
                            } ${isNew ? "scale-105 shadow-xl" : ""}`}
                        >
                            {isCollected && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-[10px]">✓</span>
                                </div>
                            )}
                            <div className={`text-4xl transition-all ${isNew ? "scale-125" : ""}`}>{s.emoji}</div>
                            <div>
                                <p className="text-[11px] font-black leading-tight">{s.name}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-0.5">{s.region}</p>
                            </div>
                            {isCollected && record ? (
                                <p className="text-[8px] font-bold opacity-60">{record.date}</p>
                            ) : (
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Tap to stamp</p>
                            )}
                        </button>
                    );
                })}
            </div>


            {/* Real Coffee Shops to Visit */}
            {coffeeShops.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Coffee className="w-5 h-5 text-[#C9973B]" />
                        <h2 className="text-lg font-black tracking-tight text-gray-900 uppercase">Coffee Shops to Visit</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {coffeeShops.map((place: any) => (
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
                                hasRealPhotos={place.images?.some((img: any) => img.imageTruthType === "place_real")}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Tip */}
            <div className="bg-[#C9973B]/5 border border-[#C9973B]/20 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    ☕ Visit a coffee experience in Ethiopia and tap its stamp to add it to your passport.
                    Collect all <strong>{STAMPS.length}</strong> to unlock your full Ethiopian Coffee Explorer badge — and share it!
                </p>
            </div>
        </div>
    );
}
