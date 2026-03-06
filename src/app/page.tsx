"use client";

import Link from "next/link";
import { VerifiedImage } from "@/components/media/VerifiedImage";
import { getPrimaryImage } from "@/lib/images";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Sparkles,
  BedDouble,
  Map,
  UtensilsCrossed,
  Music,
  ArrowRight,
  Star,
  MapPin,
} from "lucide-react";
import { useState } from "react";

interface PlaceData {
  id: string;
  slug: string;
  name: string;
  type: string;
  city: string;
  area: string;
  shortDescription: string | null;
  avgRating: number | null;
  images: { imageUrl: string }[];
  auditStatus?: "ok" | "missing" | "blocked" | "broken" | null;
}

async function fetchPlaces(types: string, limit: number) {
  const res = await fetch(`/api/places?type=${types}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

function HeroSection() {
  const [search, setSearch] = useState("");

  return (
    <div className="pt-8 pb-4 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          Selam! 👋
        </h1>
        <p className="text-brand-muted font-medium text-sm mt-1 italic">
          Explore the heartbeat of Ethiopia
        </p>
      </div>

      {/* Search bar */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-ethiopia-green/5 via-ethiopia-yellow/5 to-ethiopia-red/5 rounded-2xl blur-sm opacity-50 pointer-events-none" />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-ethiopia-green transition-colors z-10" />
        <input
          type="text"
          placeholder="Search stays, tours, restaurants..."
          className="w-full pl-13 pr-20 py-4.5 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/30 focus:outline-none focus:ring-2 focus:ring-ethiopia-green/10 font-semibold text-sm relative z-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link
          href={search ? `/stays?search=${encodeURIComponent(search)}` : "/stays"}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-dark text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider z-10 hover:bg-gray-800 transition-colors"
        >
          Go
        </Link>
      </div>

      {/* Quick category icons */}
      <div className="flex justify-around px-2">
        {[
          { icon: BedDouble, label: "Stays", href: "/stays", color: "bg-blue-50 text-blue-500" },
          { icon: Map, label: "Tours", href: "/tours", color: "bg-orange-50 text-orange-500" },
          { icon: UtensilsCrossed, label: "Dining", href: "/dining", color: "bg-rose-50 text-rose-500" },
          { icon: Music, label: "Nightlife", href: "/dining", color: "bg-purple-50 text-purple-500" },
        ].map(({ icon: Icon, label, href, color }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PlaceSection({
  title,
  types,
  href,
  accent,
}: {
  title: string;
  types: string;
  href: string;
  accent: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["home-places", types],
    queryFn: () => fetchPlaces(types, 4),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black tracking-tight uppercase">
          {title}
        </h2>
        <Link
          href={href}
          className={`text-${accent} text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all`}
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {isLoading
          ? [1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-52 h-64 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))
          : data?.places?.map((place: PlaceData) => (
            <Link
              key={place.id}
              href={`/place/${place.slug}`}
              className="flex-shrink-0 w-52 bg-white rounded-2xl shadow-lg shadow-gray-200/30 overflow-hidden border border-gray-50 group active:scale-[0.97] transition-all"
            >
              <div className="relative h-32 overflow-hidden">
                <VerifiedImage
                  src={getPrimaryImage(place)}
                  alt={place.name}
                  className="w-full h-full group-hover:scale-110 transition-transform duration-500"
                  entityType={place.type as any}
                  status={place.auditStatus}
                  showBadge={false}
                />
                {place.avgRating && (
                  <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 text-ethiopia-yellow fill-ethiopia-yellow" />
                    <span className="text-[10px] font-black">{place.avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="p-3.5">
                <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-ethiopia-green transition-colors">
                  {place.name}
                </h3>
                <div className="flex items-center gap-1 text-gray-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider truncate">
                    {place.area ? `${place.area}, ${place.city}` : place.city}
                  </span>
                </div>
                {place.shortDescription && (
                  <p className="text-[10px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {place.shortDescription}
                  </p>
                )}
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}

function AiCta() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-dark via-gray-800 to-brand-dark p-6 shadow-2xl shadow-gray-300/30">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-ethiopia-green/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-ethiopia-yellow/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-ethiopia-green to-emerald-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-ethiopia-green/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white text-lg font-black tracking-tight">
            AI Trip Planner
          </h3>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed font-medium">
            Tell us your interests and budget — we&apos;ll plan your perfect Ethiopian adventure.
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 mt-4 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-white/10"
          >
            Try it now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <HeroSection />
      <PlaceSection
        title="Featured Stays"
        types="hotel,guesthouse,apartment,resort"
        href="/stays"
        accent="ethiopia-green"
      />
      <PlaceSection
        title="Tours & Experiences"
        types="tour,park,market,coffee,museum,culture,nightlife,tour_operator"
        href="/tours"
        accent="orange-500"
      />
      <PlaceSection
        title="Cultural Dining"
        types="restaurant,club"
        href="/dining"
        accent="rose-500"
      />
      <AiCta />

      {/* Become a Host CTA */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-7 border border-amber-100/50 shadow-lg shadow-amber-100/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-ethiopia-yellow/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-ethiopia-yellow to-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-300/30 text-2xl">
            🏠
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">
              Become a Host
            </h3>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed font-medium">
              Have a home in Ethiopia? List it on AddisView and earn income from travelers.
            </p>
            <Link
              href="/become-a-host"
              className="inline-flex items-center gap-2 mt-4 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              List your place <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
