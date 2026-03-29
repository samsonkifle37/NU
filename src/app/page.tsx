"use client";

import { useLanguage } from "@/contexts/LanguageContext";



import Link from "next/link";

import { VerifiedImage } from "@/components/media/VerifiedImage";

import { getPrimaryVerifiedImage } from "@/lib/images";

import { useQuery } from "@tanstack/react-query";

import { Logo } from "@/components/Logo";

import {

  Sparkles,

  BedDouble,

  Map,

  UtensilsCrossed,

  Music,

  ArrowRight,

  Star,

  MapPin,

  Plane,

  Car,

  Wifi,

  Banknote,

  Navigation,

  Compass,

  Wine

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

  _count?: { reviews: number };

  priceLevel?: string;

}



async function fetchPlaces(types: string, limit: number, search?: string) {

  const url = search 

    ? `/api/places?type=${types}&limit=${limit}&search=${encodeURIComponent(search)}`

    : `/api/places?type=${types}&limit=${limit}`;

  const res = await fetch(url);

  if (!res.ok) throw new Error("Failed");

  return res.json();

}



function HeroSection() {
  const { tr } = useLanguage();

  const [prompt, setPrompt] = useState("");



  const suggestions = [

    "3 days in Addis with coffee tours",

    "Hidden restaurants in Addis",

    "Weekend in Lalibela",

    "Ethiopia historical route"

  ];



  return (

    <div className="relative pt-16 pb-12 px-5 rounded-b-[3rem] bg-gradient-to-br from-[#1A1A2E] via-[#6B3E26] to-[#1A1A2E] overflow-hidden -mx-4 -mt-4 sm:mx-0 sm:mt-0 shadow-2xl">

      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518998053901-5348d3961a04?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />

      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#1A1A2E]/80 via-transparent to-[#1A1A2E]" />



      <div className="relative z-10 flex flex-col items-center text-center space-y-6">

        <div className="flex flex-col items-center justify-center">

                        {/* ኑ using Noto Sans Ethiopic already loaded in layout */}


            <span


                className="mb-2 block"


                style={{ fontFamily: "'Noto Sans Ethiopic', serif", fontSize: "4rem", fontWeight: 900, color: "#D4AF37", lineHeight: 1 }}


            >


                ኑ


            </span>

            <h1 className="text-4xl font-black tracking-widest text-[#D4AF37]">NU</h1>

            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mt-2 opacity-90">

                {tr("home","tagline")}

            </p>

        </div>



        <h2 className="text-2xl font-bold tracking-tight text-white mt-4">

          {tr("home","hero")}

        </h2>



        {/* AI Trip Planner directly in Hero */}

        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl p-2 rounded-3xl border border-white/20 shadow-2xl mt-6">

          <div className="flex items-center gap-2 bg-[#1A1A2E]/50 p-2 rounded-2xl border border-[#D4AF37]/30 focus-within:border-[#D4AF37] transition-all">

            <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#D4AF37]/30 text-[#1A1A2E]">

              <Sparkles className="w-5 h-5" />

            </div>

            <input 

              type="text" 

              placeholder={tr("home","placeholder")} 

              className="flex-1 bg-transparent text-white text-sm px-2 placeholder-gray-400 focus:outline-none"

              value={prompt}

              onChange={e => setPrompt(e.target.value)}

            />

            <Link href={`/plan${prompt ? `?q=${encodeURIComponent(prompt)}` : ''}`} className="bg-[#D4AF37] text-[#1A1A2E] p-3 rounded-xl hover:opacity-90 transition-opacity shrink-0 font-black">

               <ArrowRight className="w-4 h-4" />

            </Link>

          </div>

        </div>



        {/* Suggestion Chips */}

        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-lg">

            {suggestions.map((sug) => (

                <button 

                  key={sug}

                  onClick={() => setPrompt(sug)}

                  className="bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/50 text-gray-300 hover:text-white px-3 py-1.5 rounded-full text-[10px] font-medium transition-all"

                >

                    {sug}

                </button>

            ))}

        </div>

      </div>

    </div>

  );

}



function CategorySection() {
  const { tr } = useLanguage();

  const categories = [
    { icon: Car,            key: "pickup",    href: "/transport" },
    { icon: BedDouble,      key: "stays",     href: "/stays"     },
    { icon: Map,            key: "tours",     href: "/tours"     },
    { icon: Navigation,     key: "transport", href: "/transport" },
    { icon: UtensilsCrossed,key: "dining",    href: "/dining"    },
    { icon: Wine,           key: "nightlife", href: "/dining"    },
  ];



  return (

    <div className="grid grid-cols-3 gap-3 px-1 mt-8">

      {categories.map(({ icon: Icon, key, href }) => (

        <Link

          key={key}

          href={href}

          className="flex flex-col items-center gap-2 group p-4 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-[#D4AF37]/50 hover:shadow-md transition-all active:scale-95"

        >

          <div className="w-12 h-12 bg-[#1A1A2E]/5 text-[#6B3E26] rounded-2xl flex items-center justify-center group-hover:bg-[#1A1A2E] group-hover:text-[#D4AF37] transition-colors">

            <Icon className="w-5 h-5" strokeWidth={1.5} />

          </div>

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]">

            {tr("home", key).toUpperCase()}

          </span>

        </Link>

      ))}

    </div>

  );

}



function AirportUtilityCard() {
  const { tr } = useLanguage();

  return (

    <div className="bg-[#1A1A2E] rounded-[2rem] p-6 shadow-xl border border-[#D4AF37]/20 relative overflow-hidden mt-8 text-white">

      <div className="absolute right-0 top-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 mb-5 relative z-10">

        <div className="w-12 h-12 bg-[#D4AF37]/20 text-[#D4AF37] rounded-2xl flex items-center justify-center">

          <Plane className="w-6 h-6" />

        </div>

        <div>

          <h3 className="text-[#D4AF37] font-black text-sm uppercase tracking-widest">Just landed at Bole?</h3>

          <p className="text-xs text-gray-400 font-medium mt-0.5">Your first-hour essentials.</p>

        </div>

      </div>

      

      <div className="grid grid-cols-2 gap-3 relative z-10">

        <Link href="/transport" className="bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase text-white transition">

          <Car className="w-3.5 h-3.5 text-[#D4AF37]" /> Airport Pickup

        </Link>

        <Link href="/currency" className="bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase text-white transition">

          <Banknote className="w-3.5 h-3.5 text-[#D4AF37]" /> Exchange Money

        </Link>

        <Link href="/sim" className="bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase text-white transition">

          <Wifi className="w-3.5 h-3.5 text-[#D4AF37]" /> Get a SIM

        </Link>

        <Link href="/plan?q=First+day+in+Addis+Ababa" className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1A1A2E] flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition shadow-lg shadow-[#D4AF37]/20">

          <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} /> Quick AI Plan

        </Link>

        <Link href="/coffee-passport" className="bg-[#C9973B]/20 hover:bg-[#C9973B]/30 border border-[#C9973B]/30 col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase text-[#E8C07A] transition">

          {tr("home","coffeePassport")}

        </Link>

      </div>

    </div>

  );

}



function FeaturedStays() {

  const { data, isLoading } = useQuery({

    queryKey: ["home-stays"],

    queryFn: () => fetchPlaces("hotel,guesthouse,apartment,resort", 4),

  });



  return (

    <div className="mt-10 space-y-4">

      <div className="flex justify-between items-center px-2">

        <h2 className="text-xl font-black tracking-tight text-[#1A1A2E]">

          Featured Stays

        </h2>

        <Link

          href="/stays"

          className="text-[#6B3E26] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"

        >

          See All <ArrowRight className="w-3.5 h-3.5" />

        </Link>

      </div>



      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-2">

        {isLoading

          ? [1, 2, 3].map((i) => (

            <div key={i} className="flex-shrink-0 w-64 h-72 bg-gray-100 rounded-[2rem] animate-pulse" />

          ))

          : data?.places?.map((place: PlaceData) => {

              // Generate mock price starting from $40 up to $250 based on string length

              const mockPrice = 40 + (place.name.length * 7 % 210);

            

              return (

              <Link

                key={place.id}

                href={`/place/${place.slug}`}

                className="flex-shrink-0 w-64 bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 overflow-hidden border border-gray-100 group active:scale-[0.98] transition-all flex flex-col"

              >

                <div className="relative h-48 overflow-hidden shrink-0">

                  <VerifiedImage

                    src={getPrimaryVerifiedImage(place)}

                    alt={place.name}

                    className="w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"

                    entityType={place.type as any}

                    status={place.auditStatus}

                    showBadge={false}

                    isRepresentative={!place.images?.some(img => (img as any).imageTruthType === 'place_real')}

                  />

                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg">

                    <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />

                    <span className="text-[11px] font-black text-[#1A1A2E]">{place.avgRating ? place.avgRating.toFixed(1) : 'New'}</span>

                  </div>

                </div>

                

                <div className="p-5 flex-1 flex flex-col justify-between">

                  <div>

                      <div className="flex justify-between items-start gap-2">

                          <h3 className="text-[15px] font-black text-[#1A1A2E] leading-tight line-clamp-1">

                            {place.name}

                          </h3>

                      </div>

                      <div className="flex items-center gap-1 text-gray-500 mt-1.5">

                        <MapPin className="w-3 h-3" />

                        <span className="text-[10px] font-bold uppercase tracking-wider line-clamp-1">

                          {place.area ? `${place.area}, ${place.city}` : place.city}

                        </span>

                      </div>

                  </div>

                  

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">

                      <span className="text-xs font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-lg uppercase">

                          {place.type}

                      </span>

                      <div className="text-right">

                          <span className="text-sm font-black text-[#1A1A2E]">${mockPrice}</span>

                          <span className="text-[10px] text-gray-400 font-bold"> / night</span>

                      </div>

                  </div>

                </div>

              </Link>

            )})}

      </div>

    </div>

  );

}



function TopExperiences() {

    const { data: expData, isLoading } = useQuery({

      queryKey: ["home-experiences"],

      queryFn: () => fetchPlaces("tour,tour_operator,museum,market,experience", 10),

    });

  

    // Filter to ensure we have exactly these examples if possible, fallback to others

    const targetSlugs = ['coffee-ceremony-experience', 'entoto-park', 'merkato-market', 'addis-food-tour'];

    let experiences = expData?.places || [];

    // Prioritize the requested examples

    experiences = [...experiences].sort((a,b) => {

        const aMatch = targetSlugs.some(s => a.slug.includes(s)) ? 1 : 0;

        const bMatch = targetSlugs.some(s => b.slug.includes(s)) ? 1 : 0;

        return bMatch - aMatch;

    }).slice(0, 4);



    return (

      <div className="mt-10 space-y-4">

        <div className="flex justify-between items-center px-2">

          <h2 className="text-xl font-black tracking-tight text-[#1A1A2E]">

            Top Experiences in Addis

          </h2>

          <Link

            href="/tours"

            className="text-[#6B3E26] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"

          >

            See All <ArrowRight className="w-3.5 h-3.5" />

          </Link>

        </div>

  

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-2">

          {isLoading

            ? [1, 2, 3].map((i) => (

              <div key={i} className="flex-shrink-0 w-[18rem] h-48 bg-gray-100 rounded-[2rem] animate-pulse" />

            ))

            : experiences.map((place: PlaceData) => (

                <Link

                  key={place.id}

                  href={`/place/${place.slug}`}

                  className="flex-shrink-0 w-[18rem] h-48 rounded-[2rem] overflow-hidden group relative flex items-end shadow-lg shadow-gray-200/50"

                >

                  <VerifiedImage

                    src={getPrimaryVerifiedImage(place)}

                    alt={place.name}

                    className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out z-0"

                    entityType={place.type as any}

                    status={place.auditStatus}

                    showBadge={false}

                    isRepresentative={!place.images?.some(img => (img as any).imageTruthType === 'place_real')}

                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/40 to-transparent z-10" />

                  

                  <div className="relative z-20 p-5 w-full">

                      <div className="flex justify-between items-end">

                          <div className="flex-1 pr-2">

                              <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-1 block">

                                  {place.type}

                              </span>

                              <h3 className="text-white font-black text-lg leading-tight line-clamp-2 shadow-sm">

                                  {place.name}

                              </h3>

                          </div>

                          <div className="bg-white/20 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/20 group-hover:bg-[#D4AF37] transition-colors">

                              <Compass className="w-4 h-4 text-white group-hover:text-[#1A1A2E]" />

                          </div>

                      </div>

                  </div>

                </Link>

              ))}

        </div>

      </div>

    );

  }



function AiRecommendations() {

    const plans = [

        { title: "The Ultimate Addis Weekender", desc: "A perfectly paced 2-day dive into the city's heart.", img: "https://hrbxtdzpseitkegkeknt.supabase.co/storage/v1/object/public/place-images/tours/ec3e82bf-4bbf-4346-8dc7-4dcc891e9441/AU_ZVEFWiaOvaASr0j6FS-D6lRW30QhA8RM53TILOjSzrBeaEcCFP0v77ZfPmRdx-x04a8h_5_rMhsiDbs-DdmEItKljkKiTXXAdyOBwTHW4PLjTrxemGOn6ul2PY6-xcNiBsSCXF1DE2a5a7Q-zGDvFctOzAJNmzmZ7u4Q2IXpdnBctbAZMqKJtUoCrv9y39Kt4vBaDLk8x2huYC4uGpHd-mv8znSJKRKnkUJyyx2RHCRaOeTRn9Z1QV5cfFNbQp_V0186b5BjGdyvz8wi6CpXpk9LQocskTkyNGWeQZFQOT6YxMfQywza2b1wIlt2iPszdkkPGASQqx2Y-rFmqUYYsEaq9EQYcWJ0Qhc4rn78SdSzDM1f9Mc90q10-uJ4vIFYt7KMV4Xnr8M-beHZbMo1etAPHnrRLs01AKP6HsDdF_rkYLlCZ.jpg" },

        { title: "Historic Lalibela Journey", desc: "Discover the architectural wonders of the north.", img: "https://hrbxtdzpseitkegkeknt.supabase.co/storage/v1/object/public/place-images/tours/93f7fabe-3197-44e4-a6f1-62481a51f306/AU_ZVEFJEM4BXXZQ6ne3IhHKv7ZkZl8tvPHsR8NIHtHtnK3s1j6df93zeOuoSRNWRXyRJqSU6fQSOAnoQ-2NaIfUZBVxp2tUU0r7O99Au5VvJFOwE33a-ZSKNLY-51sIsZXJ3aTMa0jbefVubp8tXtc7oBtMUSDZdv8c7d6MM6pZ-qK4pomSabmeaDoWqKvxyUbZkA2Y-NNcrjjWrR8bDcBVlgYG5fYA69LAjbjVjeRfAtFCbRvOdKTv1XbXROMcRPIaqtFYP3mXN4RLu0eW3Ho5zv2q_HkBDPQGwc6zOj5U5_L7V3zNw7NaL6t_LxDprPzymOqHCjB0mqSQvmGDuwI9xVRcyatdQ4HZ9wrJ4Wvia9F5nD7g5Po9MyxXZc8MiRHHPkflRgz-2JHtvn4nZqB6p0qP3p-CIF5n-D2B6XifvnM.jpg" },

        { title: "Omo Valley Adventure", desc: "Deep cultural immersion in the southern nations.", img: "https://hrbxtdzpseitkegkeknt.supabase.co/storage/v1/object/public/place-images/tours/2074dd80-f85e-4d29-b68b-71d7069e0e59/AU_ZVEEsLHb9IdsNbxpdqgCc6A2GoCaArYNs-id8xK_XIaq3rAYh8Oo5E_G1Jr-N10nEvZiOerk_y-vrZuIOj106bLJr5VbUrOFzg5b44YR3NjPlO-2ne7Ys2SRd23AihAURyOaPGehdW5c1Xj-sgcKJMfpqdpE5MbiS1-eaDSDWpSIF7KODrG8fQhoxwwgB17A3iImLw0dmRU9IuHI8sYJ_63qdpAGHNgIAGE-dOWGD-M__2p1mK6Pm1TxAPUo39JYDf33GMoQfbCyS4HTCfeQVdM8FGH9BPcva-3D2MaFvWF7v2PDhw-v1OKkwMk83vqDrIrEKQhquV8EiqHN-xD4gJKjuDS2lWfQjXeH_UyjUTMawTEDdS9-4IYKeX0hj734MTv8adkdbgjU43JfK6RVQ6tNMt4nTsRsKnGuAuDIxiET75O8r.jpg" }

    ];



    return (

        <div className="mt-10 mb-6 bg-gradient-to-br from-[#1A1A2E] to-[#6B3E26] -mx-4 px-4 py-10 sm:mx-0 sm:rounded-[3rem]">

            <div className="flex items-center gap-2 mb-6 px-2">

                <Sparkles className="w-6 h-6 text-[#D4AF37]" />

                <h2 className="text-2xl font-black tracking-tight text-white">

                    Recommended for you

                </h2>

            </div>



            <div className="flex flex-col gap-4 px-2">

                {plans.map((plan, idx) => (

                    <Link href={`/plan?q=${encodeURIComponent(plan.title)}`} key={idx} className="bg-white/10 border border-white/20 rounded-[2rem] p-4 flex gap-4 items-center backdrop-blur-md hover:bg-white/20 transition-all group">

                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-lg shadow-black/20 relative">

                            <VerifiedImage src={plan.img} alt={plan.title} entityType="tour" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" showBadge={false} />

                        </div>

                        <div className="flex-1 py-1">

                            <h4 className="text-white font-bold text-sm leading-snug">{plan.title}</h4>

                            <p className="text-gray-300 text-[11px] font-medium mt-1 leading-relaxed line-clamp-2">{plan.desc}</p>

                        </div>

                        <div className="shrink-0 w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#1A1A2E] shadow-lg">

                            <ArrowRight className="w-4 h-4 font-black" />

                        </div>

                    </Link>

                ))}

            </div>

        </div>

    );

}



function ThisWeekInAddis() {
  // Ethiopian months & seasonal tips
  const ethiopianMonths: Record<number, { name: string; season: string; tip: string }> = {
    1:  { name: "Meskerem", season: "Spring", tip: "New Year celebrations just ended — explore festival venues." },
    2:  { name: "Tikimt",   season: "Post-rain", tip: "Perfect weather for outdoor dining and walking tours." },
    3:  { name: "Hidar",    season: "Dry season", tip: "Clear skies — ideal for Entoto Mountain hikes." },
    4:  { name: "Tahsas",   season: "Cool & dry", tip: "Christmas (Genna) preparations — visit churches." },
    5:  { name: "Tir",      season: "Dry season", tip: "Timkat (Epiphany) — the biggest festival of the year!" },
    6:  { name: "Yekatit",  season: "Warm & dry", tip: "Coffee harvest season — perfect for coffee tours." },
    7:  { name: "Megabit",  season: "Pre-rain",   tip: "Warm days, cool nights — great patio weather." },
    8:  { name: "Miazya",   season: "Small rains", tip: "Fasika (Easter) celebrations — incredible church ceremonies." },
    9:  { name: "Ginbot",   season: "Pre-summer",  tip: "Markets are lively — visit Mercato and Shola Market." },
    10: { name: "Sene",     season: "Early rains",  tip: "Lush green hills — beautiful scenic drives." },
    11: { name: "Hamle",    season: "Rainy season", tip: "Cozy cafés and indoor cultural shows." },
    12: { name: "Nehase",   season: "Rainy season", tip: "Perfect for museum visits and injera cooking classes." },
    13: { name: "Pagume",   season: "Transition",   tip: "Last days before Ethiopian New Year — gift shopping!" },
  };
  const now = new Date();
  const gregMonth = now.getMonth(); // 0-indexed
  // Rough Gregorian → Ethiopian month mapping
  const ethMonthNum = ((gregMonth + 4) % 13) + 1; // approximate
  const ethMonth = ethiopianMonths[Math.min(ethMonthNum, 13)] || ethiopianMonths[1];

  const editorialPicks = [
    { emoji: "☕", title: "Coffee Ceremony 101", desc: "Experience Ethiopia's most sacred daily ritual.", link: "/coffee-passport", color: "from-amber-500 to-orange-600" },
    { emoji: "🎵", title: "Live Jazz Nights", desc: "Find the best Ethiopian jazz clubs in Bole.", link: "/dining", color: "from-purple-500 to-indigo-600" },
    { emoji: "🏛️", title: "Heritage Walk", desc: "Piazza's colonial architecture & hidden cafés.", link: "/tours", color: "from-emerald-500 to-teal-600" },
    { emoji: "🌄", title: "Entoto Escapes", desc: "Eucalyptus forests 20 min from the city center.", link: "/tours", color: "from-sky-500 to-blue-600" },
  ];

  return (
    <div className="py-8 space-y-5">
      {/* Ethiopian calendar awareness */}
      <div className="bg-gradient-to-r from-[#1A1612] to-[#2A2A3A] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🗓️</span>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#C9973B]">This Week in Addis</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{ethMonth.name} — {ethMonth.season}</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 font-medium leading-relaxed">{ethMonth.tip}</p>
      </div>

      {/* Editorial picks — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {editorialPicks.map((pick, i) => (
          <Link
            key={i}
            href={pick.link}
            className="shrink-0 w-[200px] bg-gradient-to-br rounded-2xl p-4 text-white shadow-lg hover:scale-[1.02] transition-transform"
            style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
          >
            <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${pick.color} p-4`}>
              <span className="text-2xl">{pick.emoji}</span>
              <h3 className="text-sm font-black mt-2 leading-tight">{pick.title}</h3>
              <p className="text-[10px] font-medium mt-1 opacity-80 leading-snug">{pick.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {

  return (

    <div className="pb-8">

      <HeroSection />

      

      <CategorySection />

      

      <AirportUtilityCard />

      <ThisWeekInAddis />



      <FeaturedStays />

      

      <TopExperiences />



      <AiRecommendations />

    </div>

  );

}




