"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Car,
    Info,
    Phone,
    Map,
    Shield,
    Download,
    X,
    Globe,
    ChevronRight,
    Star,
    MapPin,
    Train,
    ArrowRight,
    RefreshCw,
} from "lucide-react";
import { useInAppBrowser } from "@/components/InAppBrowser";

interface ServiceDetail {
    name: string;
    color: string;
    textColor: string;
    phone: string;
    shortCode: string;
    description: string;
    website: string;
    playStore: string;
    appStore: string;
    howToUse: string[];
    priceRange: string;
    coverage: string;
    rating: string;
    tip: string;
}

// ========== LRT DATA ==========
const LRT_LINES = {
    blue: {
        name: "Blue Line (North-South)",
        color: "bg-blue-500",
        textColor: "text-blue-500",
        borderColor: "border-blue-500",
        stations: [
            "Menelik II Sq.",
            "Autobus Tera",
            "Merkato",
            "Abnet",
            "Sebategna",
            "Lideta",
            "Mexico",
            "Tegbared",
            "Stadium",
            "Legahar",
            "Meskel Square",
            "Urael",
            "Lancha",
            "Lem Hotel",
            "Saris",
            "Saris Abo",
            "Nifas Silk",
            "Kality",
        ],
        travelTimeMinutes: 2.5,
    },
    green: {
        name: "Green Line (East-West)",
        color: "bg-ethiopia-green",
        textColor: "text-ethiopia-green",
        borderColor: "border-ethiopia-green",
        stations: [
            "Ayat",
            "CMC Michael",
            "CMC",
            "Civil Service University",
            "St. Lideta",
            "Megenagna",
            "Aware",
            "Hayahulet 1",
            "Hayahulet 2",
            "Bambis",
            "Estifanos",
            "Merkato",
            "Atikilt Tera",
            "Autobis Tera",
            "Gurd Shola",
            "Torhailoch",
            "Meri",
            "Coca",
            "Gotera",
            "St. Urael",
            "Meskel Square",
        ],
        travelTimeMinutes: 2.2,
    },
};

function getFrequencyMinutes(hour: number): number {
    if (hour < 6 || hour >= 22) return 0;
    if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20)) return 8;
    if ((hour >= 6 && hour < 7) || (hour >= 20 && hour < 22)) return 20;
    return 12;
}

function getPeriodLabel(hour: number): string {
    if (hour < 6 || hour >= 22) return "Closed";
    if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20))
        return "Peak Hours";
    if ((hour >= 6 && hour < 7) || (hour >= 20 && hour < 22))
        return "Late Service";
    return "Regular Service";
}

function getNextTrains(now: Date, count: number = 4): string[] {
    const hour = now.getHours();
    const freq = getFrequencyMinutes(hour);
    if (freq === 0) return [];

    const minuteInHour = now.getMinutes();
    const nextOffset = freq - (minuteInHour % freq);
    const results: string[] = [];

    for (let i = 0; i < count; i++) {
        const totalMinutes =
            now.getHours() * 60 + now.getMinutes() + nextOffset + i * freq;
        if (totalMinutes >= 22 * 60) break;
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        const period = h >= 12 ? "PM" : "AM";
        const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
        results.push(`${displayH}:${m.toString().padStart(2, "0")} ${period}`);
    }
    return results;
}

// ========== RIDE HAILING DATA ==========
const rideHailing: ServiceDetail[] = [
    {
        name: "Ride",
        color: "bg-yellow-400",
        textColor: "text-gray-900",
        phone: "+251-116-672-894",
        shortCode: "8294",
        description:
            "Ethiopia's pioneer and most popular ride-hailing service. Available 24/7 across Addis Ababa.",
        website: "https://ride8294.com/",
        playStore:
            "https://play.google.com/store/apps/details?id=com.multibrains.taxi.passenger.ridepassengeret&hl=en&gl=US",
        appStore: "https://apps.apple.com/us/app/ride-ethiopia-djibouti/id1375514824",
        howToUse: [
            'Download the "RIDE" app from App Store or Google Play',
            "Register with your Ethiopian or international phone number",
            "Set your pickup and drop-off location on the map",
            "Choose vehicle type (Standard, Premium, or Ladies)",
            "Confirm ride and wait for driver assignment",
            "Pay via cash or mobile money (Telebirr / CBE Birr)",
        ],
        priceRange: "80 - 500 ETB",
        coverage: "Addis Ababa, Adama, Bahir Dar, Hawassa",
        rating: "4.2",
        tip: 'The "Ladies" option provides female drivers for female passengers â€” perfect for solo travellers.',
    },
    {
        name: "ZayRide",
        color: "bg-blue-500",
        textColor: "text-white",
        phone: "+251-116-321-000",
        shortCode: "6321",
        description:
            "Modern ride-hailing with on-demand taxi and delivery services. Known for fast response times.",
        website: "https://zayride.com",
        playStore:
            "https://play.google.com/store/apps/details?id=com.zayride.passenger",
        appStore: "https://apps.apple.com/us/app/zayride-passenger/id1139441921",
        howToUse: [
            'Download "ZayRide" from App Store or Google Play',
            "Register with your mobile number",
            "Allow location access for accurate pickup",
            "Choose between Ride, Delivery, or Errand services",
            "Confirm and track your driver live",
            "Pay cash or via linked mobile wallet",
        ],
        priceRange: "60 - 400 ETB",
        coverage: "Addis Ababa",
        rating: "4.1",
        tip: "ZayRide also offers package delivery â€” great for sending items across the city!",
    },
];

// ========== AIRPORT PICKUP COMPONENT ==========
function AirportPickupForm() {
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (success) {
        return (
            <div className="bg-green-50 p-8 rounded-[2rem] border border-green-100 text-center space-y-4">
                <div className="w-16 h-16 bg-ethiopia-green rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                    <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Pickup Confirmed!</h3>
                    <p className="text-sm text-gray-600 mt-2 font-medium">Your request has been securely processed. A verified driver will coordinate with you via WhatsApp within 15 minutes.</p>
                </div>
                <button onClick={() => setSuccess(false)} className="mt-4 text-[10px] font-black uppercase tracking-widest text-ethiopia-green hover:underline">
                    Book Another
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red" />
            
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Book Airport Pickup</h3>
                    <p className="text-xs text-gray-500 font-medium italic mt-1 pb-1">Safe, vetted drivers waiting with a sign at Bole (ADD).</p>
                </div>
                <div className="hidden sm:flex w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
                    <Car className="w-5 h-5 text-gray-400" />
                </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSubmitting(true); setTimeout(() => { setSubmitting(false); setSuccess(true); }, 1500); }}>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Arrival Date</label>
                        <input type="date" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 text-sm font-medium" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Est. Time</label>
                        <input type="time" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 text-sm font-medium" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Passengers</label>
                         <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 text-sm font-medium">
                             <option>1-2 People</option>
                             <option>3-4 People</option>
                             <option>5+ People (Van)</option>
                         </select>
                    </div>
                    <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Flight Number</label>
                         <input type="text" placeholder="e.g. ET 501" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 text-sm font-medium" />
                    </div>
                </div>
                
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">WhatsApp Number</label>
                    <input type="tel" required placeholder="+1 234 567 8900" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 text-sm font-medium" />
                </div>
                
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Destination (Hotel / Area)</label>
                    <input type="text" required placeholder="Where in Addis?" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 text-sm font-medium" />
                </div>

                <button disabled={submitting} type="submit" className="w-full bg-[#1A1612] text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center">
                    {submitting ? "Processing..." : "Secure Pickup"}
                </button>
            </form>
        </div>
    );
}

// ========== INTER-CITY BUS DATA ==========
const INTERCITY_BUSES = [
    {
         name: "Selam Bus",
         color: "bg-blue-600",
         route: "Addis â†’ Bahir Dar, Gondar, Hawassa, Dire Dawa",
         price: "800 - 1500 ETB",
         phone: "8032",
         features: ["A/C", "Snacks", "WiFi (Limited)"]
    },
    {
         name: "Sky Bus",
         color: "bg-red-600",
         route: "Addis â†’ Bahir Dar, Hawassa, Jimma",
         price: "750 - 1300 ETB",
         phone: "8033",
         features: ["A/C", "Reclining Seats"]
    },
    {
         name: "Abay Bus",
         color: "bg-green-600",
         route: "Addis â†’ Dessie, Mekelle, Bahir Dar",
         price: "700 - 1200 ETB",
         phone: "8034",
         features: ["Modern Fleet", "On-board Toilet"]
    }
];

export default function TransportPage() {
    const [selectedService, setSelectedService] =
        useState<ServiceDetail | null>(null);
    const [lrtLine, setLrtLine] = useState<"blue" | "green">("blue");
    const [selectedStation, setSelectedStation] = useState<string>("");
    const [now, setNow] = useState(new Date());
    const browser = useInAppBrowser();

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    const currentLine = LRT_LINES[lrtLine];
    const stationIndex = currentLine.stations.indexOf(selectedStation);

    const nextTrains = useMemo(() => getNextTrains(now, 4), [now]);
    const frequency = getFrequencyMinutes(now.getHours());
    const periodLabel = getPeriodLabel(now.getHours());

    const travelEstimates = useMemo(() => {
        if (stationIndex === -1) return [];
        const stations = currentLine.stations;
        const avg = currentLine.travelTimeMinutes;
        const keyStations =
            lrtLine === "blue"
                ? ["Merkato", "Mexico", "Stadium", "Meskel Square", "Kality"]
                : ["Ayat", "CMC", "Megenagna", "Merkato", "Meskel Square"];

        return keyStations
            .filter((s) => s !== selectedStation)
            .map((dest) => {
                const destIdx = stations.indexOf(dest);
                if (destIdx === -1) return null;
                const stopsAway = Math.abs(destIdx - stationIndex);
                const minutes = Math.round(stopsAway * avg);
                return { destination: dest, stops: stopsAway, minutes };
            })
            .filter(Boolean) as {
                destination: string;
                stops: number;
                minutes: number;
            }[];
    }, [selectedStation, stationIndex, currentLine, lrtLine]);

    return (
        <div className="space-y-8 pb-10 pt-4">
            <header className="space-y-2 px-1">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
                    Transport Hub
                </h1>
                <p className="text-brand-muted italic text-sm font-medium">
                    Getting around Addis & beyond
                </p>
            </header>

            {/* ========== AIRPORT PICKUP ========== */}
            <section className="px-1">
                 <AirportPickupForm />
            </section>

            {/* ========== RIDE HAILING ========== */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <Car className="w-6 h-6 text-ethiopia-red" />
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        Ride Hailing
                    </h2>
                </div>
                <div className="grid gap-4">
                    {rideHailing.map((app) => (
                        <div
                            key={app.name}
                            className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/30 border border-gray-100 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-16 h-16 ${app.color} rounded-[1.25rem] flex items-center justify-center font-black ${app.textColor} text-sm shadow-lg`}
                                    >
                                        {app.name}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-gray-900 text-lg tracking-tight">
                                            {app.name}
                                        </h3>
                                        <p className="text-gray-400 text-xs font-medium italic line-clamp-1">
                                            {app.description.substring(0, 50)}...
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-3 h-3 text-ethiopia-yellow fill-ethiopia-yellow" />
                                            <span className="text-[10px] font-black text-gray-500">
                                                {app.rating}
                                            </span>
                                            <span className="text-gray-200 mx-1">â€¢</span>
                                            <span className="text-[10px] font-black text-ethiopia-green uppercase tracking-widest">
                                                {app.priceRange.split("(")[0].trim()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                                <a
                                    href={`tel:${app.phone}`}
                                    className="flex flex-col items-center gap-2 bg-ethiopia-green/5 hover:bg-ethiopia-green/10 p-4 rounded-2xl text-center transition-colors group border border-ethiopia-green/10"
                                >
                                    <Phone className="w-5 h-5 text-ethiopia-green group-hover:scale-110 transition-transform" />
                                    <div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                                            Call
                                        </span>
                                        <span className="text-[10px] font-black text-ethiopia-green">
                                            {app.shortCode}
                                        </span>
                                    </div>
                                </a>
                                <button
                                    onClick={() => browser.open(app.website, app.name + " â€” Website")}
                                    className="flex flex-col items-center gap-2 bg-blue-50 hover:bg-blue-100 p-4 rounded-2xl text-center transition-colors group border border-blue-100"
                                >
                                    <Globe className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                                            Website
                                        </span>
                                        <span className="text-[10px] font-black text-blue-500">
                                            Visit
                                        </span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setSelectedService(app)}
                                    className="flex flex-col items-center gap-2 bg-gray-50 hover:bg-gray-100 p-4 rounded-2xl text-center transition-colors group border border-gray-100"
                                >
                                    <Info className="w-5 h-5 text-gray-500 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                                            Guide
                                        </span>
                                        <span className="text-[10px] font-black text-gray-600">
                                            How-to
                                        </span>
                                    </div>
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => browser.open(app.playStore, app.name + " â€” Google Play")}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-2xl transition-colors shadow-lg shadow-gray-200"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                        Google Play
                                    </span>
                                </button>
                                <button
                                    onClick={() => browser.open(app.appStore, app.name + " â€” App Store")}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-2xl transition-colors shadow-lg shadow-gray-200"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                        App Store
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ========== INTERACTIVE LRT SCHEDULE ========== */}
            <section className="space-y-5">
                <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1.5 bg-ethiopia-green rounded-xl text-[9px] font-black uppercase tracking-widest">
                                    Addis LRT
                                </div>
                                <h2 className="text-xl font-black tracking-tight">
                                    Light Rail
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-2 h-2 rounded-full ${frequency > 0
                                        ? "bg-ethiopia-green animate-pulse"
                                        : "bg-red-500"
                                        }`}
                                />
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    {periodLabel}
                                </span>
                            </div>
                        </div>

                        <p className="text-gray-400 text-sm leading-relaxed font-medium italic">
                            The first light rail in Sub-Saharan Africa. Select your line
                            and station to see estimated arrivals.
                        </p>

                        {/* Line Selector */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setLrtLine("blue");
                                    setSelectedStation("");
                                }}
                                className={`flex-1 p-4 rounded-2xl text-center transition-all border ${lrtLine === "blue"
                                    ? "bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/30"
                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                                    }`}
                            >
                                <Train className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-[9px] font-black uppercase tracking-widest block">
                                    Blue Line
                                </span>
                                <span className="text-[8px] font-medium text-current opacity-70 block mt-0.5">
                                    North-South
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setLrtLine("green");
                                    setSelectedStation("");
                                }}
                                className={`flex-1 p-4 rounded-2xl text-center transition-all border ${lrtLine === "green"
                                    ? "bg-ethiopia-green text-white border-ethiopia-green shadow-lg shadow-green-500/30"
                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                                    }`}
                            >
                                <Train className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-[9px] font-black uppercase tracking-widest block">
                                    Green Line
                                </span>
                                <span className="text-[8px] font-medium text-current opacity-70 block mt-0.5">
                                    East-West
                                </span>
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/5">
                                <span className="block text-[7px] font-black uppercase text-gray-500 tracking-widest mb-1">
                                    Price
                                </span>
                                <span className="font-black text-sm">2 - 10 ETB</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/5">
                                <span className="block text-[7px] font-black uppercase text-gray-500 tracking-widest mb-1">
                                    Frequency
                                </span>
                                <span className="font-black text-sm">
                                    {frequency > 0 ? `~${frequency} min` : "Closed"}
                                </span>
                            </div>
                            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/5">
                                <span className="block text-[7px] font-black uppercase text-gray-500 tracking-widest mb-1">
                                    Stations
                                </span>
                                <span className="font-black text-sm">
                                    {currentLine.stations.length}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Map className="w-40 h-40" />
                    </div>
                </div>

                {/* Station Picker */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                            Select Your Station
                        </h3>
                        <span
                            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${lrtLine === "blue"
                                ? "text-blue-500 bg-blue-50 border-blue-100"
                                : "text-ethiopia-green bg-green-50 border-green-100"
                                }`}
                        >
                            {currentLine.name}
                        </span>
                    </div>

                    {/* Station Route Visual */}
                    <div className="relative">
                        <div
                            className={`absolute left-[19px] top-4 bottom-4 w-0.5 ${lrtLine === "blue" ? "bg-blue-200" : "bg-green-200"
                                }`}
                        />
                        <div className="space-y-0 max-h-64 overflow-y-auto no-scrollbar pr-2">
                            {currentLine.stations.map((station, i) => (
                                <button
                                    key={station}
                                    onClick={() => setSelectedStation(station)}
                                    className={`w-full flex items-center gap-4 py-3 px-2 rounded-2xl transition-all text-left relative z-10 ${selectedStation === station
                                        ? lrtLine === "blue"
                                            ? "bg-blue-50 border border-blue-200"
                                            : "bg-green-50 border border-green-200"
                                        : "hover:bg-gray-50 border border-transparent"
                                        }`}
                                >
                                    <div
                                        className={`w-3.5 h-3.5 rounded-full border-[3px] flex-shrink-0 ${selectedStation === station
                                            ? lrtLine === "blue"
                                                ? "bg-blue-500 border-blue-500 ring-4 ring-blue-100"
                                                : "bg-ethiopia-green border-ethiopia-green ring-4 ring-green-100"
                                            : "bg-white border-gray-300"
                                            }`}
                                    />
                                    <div className="flex-1">
                                        <span
                                            className={`text-sm font-bold ${selectedStation === station
                                                ? "text-gray-900"
                                                : "text-gray-600"
                                                }`}
                                        >
                                            {station}
                                        </span>
                                        {(i === 0 ||
                                            i === currentLine.stations.length - 1) && (
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 ml-2">
                                                    {i === 0 ? "Start" : "End"}
                                                </span>
                                            )}
                                    </div>
                                    {selectedStation === station && (
                                        <span className="text-[8px] font-black uppercase tracking-widest text-ethiopia-green bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                            Selected
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Schedule Results */}
                {selectedStation && (
                    <div className="space-y-4">
                        {/* Next Trains */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    Estimated Next Trains at {selectedStation}
                                </h3>
                                <button
                                    onClick={() => setNow(new Date())}
                                    className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {nextTrains.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {nextTrains.map((time, i) => (
                                        <div
                                            key={i}
                                            className={`p-4 rounded-2xl text-center border ${i === 0
                                                ? lrtLine === "blue"
                                                    ? "bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-200"
                                                    : "bg-ethiopia-green text-white border-green-400 shadow-lg shadow-green-200"
                                                : "bg-gray-50 text-gray-600 border-gray-100"
                                                }`}
                                        >
                                            <span className="text-xs font-black block">
                                                {time}
                                            </span>
                                            {i === 0 && (
                                                <span className="text-[7px] font-black uppercase tracking-widest opacity-80 block mt-1">
                                                    Next
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                                    <span className="text-sm font-bold text-red-500">
                                        ðŸš« Service Closed
                                    </span>
                                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                                        LRT operates from 6:00 AM to 10:00 PM
                                    </p>
                                </div>
                            )}

                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                                    â± <strong>Note:</strong> These are estimated times based
                                    on the official{" "}
                                    {frequency > 0 ? `${frequency}-minute` : ""} schedule.
                                    Actual arrivals may vary by Â±2-3 minutes.
                                </p>
                            </div>
                        </div>

                        {/* Travel Time Estimates */}
                        {travelEstimates.length > 0 && (
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    Travel from {selectedStation}
                                </h3>
                                <div className="space-y-2">
                                    {travelEstimates.map((est, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100"
                                        >
                                            <div className="flex items-center gap-3">
                                                <ArrowRight
                                                    className={`w-4 h-4 ${lrtLine === "blue"
                                                        ? "text-blue-500"
                                                        : "text-ethiopia-green"
                                                        }`}
                                                />
                                                <div>
                                                    <span className="font-black text-gray-900 text-sm block">
                                                        {est.destination}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-bold">
                                                        {est.stops} stop
                                                        {est.stops !== 1 ? "s" : ""} away
                                                    </span>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-xs font-black px-3 py-1.5 rounded-xl border ${lrtLine === "blue"
                                                    ? "text-blue-600 bg-blue-50 border-blue-100"
                                                    : "text-ethiopia-green bg-green-50 border-green-100"
                                                    }`}
                                            >
                                                ~{est.minutes} min
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* ========== LOCAL TRANSPORT ========== */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <Info className="w-6 h-6 text-ethiopia-yellow" />
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        Local Transport
                    </h2>
                </div>
                <div className="space-y-4">
                    <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-200" />
                                <h4 className="font-black text-gray-900 tracking-tight">
                                    Blue & White Minibuses
                                </h4>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-ethiopia-green bg-green-50 px-3 py-1 rounded-full">
                                Cheapest
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed italic font-medium">
                            The heartbeat of the city. These are the most common form of
                            public transport. Listen for the &quot;Weyala&quot; (conductor)
                            shouting destinations.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest block mb-1">
                                    Fare Range
                                </span>
                                <span className="font-black text-gray-900 text-sm">
                                    3 - 15 ETB
                                </span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest block mb-1">
                                    Availability
                                </span>
                                <span className="font-black text-gray-900 text-sm">
                                    5AM - 9PM
                                </span>
                            </div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                                ðŸ’¡ <strong>Tip:</strong> Stand by the roadside and put your
                                hand out. Tell the Weyala your destination when they ask.
                                Keep small bills (5, 10 ETB) handy â€” they often don&apos;t
                                carry change.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-lg shadow-yellow-200" />
                                <h4 className="font-black text-gray-900 tracking-tight">
                                    Meter Taxis (Lada / Blue Cabs)
                                </h4>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                                Privacy
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed italic font-medium">
                            Private taxis found around hotels, malls, and major
                            intersections. Safer for night travel. Always negotiate or
                            insist on the meter.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest block mb-1">
                                    Base Fare
                                </span>
                                <span className="font-black text-gray-900 text-sm">
                                    ~50 ETB
                                </span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest block mb-1">
                                    Availability
                                </span>
                                <span className="font-black text-gray-900 text-sm">
                                    24 Hours
                                </span>
                            </div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                                ðŸ’¡ <strong>Tip:</strong> Always agree on the price BEFORE
                                getting in or ensure the meter is on. A typical cross-city
                                ride is 200-400 ETB. Ask your hotel to help negotiate fair
                                rates.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== INTER-CITY BUSES ========== */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <Globe className="w-6 h-6 text-purple-500" />
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        Inter-city Transport
                    </h2>
                </div>
                <div className="grid gap-3">
                    {INTERCITY_BUSES.map((bus) => (
                        <div key={bus.name} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-200/20">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 ${bus.color} rounded-[1rem] flex items-center justify-center font-black text-white text-[10px] shadow-md`}>
                                        {bus.name.split(" ")[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 text-sm tracking-tight">{bus.name}</h4>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {bus.features.map(f => (
                                                <span key={f} className="text-[8px] font-black uppercase text-gray-400 tracking-wider">
                                                    â€¢ {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <a href={`tel:${bus.phone}`} className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-100">
                                    <Phone className="w-4 h-4 text-gray-600" />
                                </a>
                            </div>
                            
                            <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Main Routes</span>
                                    <span className="text-[10px] font-black text-ethiopia-green bg-green-50 px-2 py-1 rounded-lg">
                                        {bus.price}
                                    </span>
                                </div>
                                <span className="font-bold text-gray-800 text-xs">
                                    {bus.route}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ========== AIRPORT TRANSFERS ========== */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <MapPin className="w-6 h-6 text-blue-500" />
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        Airport Transfers
                    </h2>
                </div>
                <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
                    <p className="text-sm text-gray-500 leading-relaxed italic font-medium">
                        Bole International Airport (ADD) is located just 6km from the
                        city center. Here are your options:
                    </p>
                    <div className="space-y-3">
                        {[
                            {
                                method: "Hotel Shuttle",
                                price: "Free - 500 ETB",
                                note: "Most hotels offer free airport pickup â€” call ahead!",
                            },
                            {
                                method: "Ride App (Ride/Feres)",
                                price: "150 - 300 ETB",
                                note: "Book when you land. Available outside arrivals.",
                            },
                            {
                                method: "Meter Taxi",
                                price: "300 - 500 ETB",
                                note: "Stand at the official taxi rank. Avoid touts inside.",
                            },
                            {
                                method: "Minibus",
                                price: "5 - 10 ETB",
                                note: "Budget option. Walk to the main road and flag one down.",
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-gray-200 transition-colors"
                            >
                                <div className="space-y-0.5">
                                    <h5 className="font-black text-gray-900 text-sm">
                                        {item.method}
                                    </h5>
                                    <p className="text-[10px] text-gray-400 font-medium italic">
                                        {item.note}
                                    </p>
                                </div>
                                <span className="text-[10px] font-black text-ethiopia-green bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 whitespace-nowrap">
                                    {item.price}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Arrival Tips */}
                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4 items-start shadow-inner">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-amber-200 shrink-0">
                        <Info className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="space-y-1.5">
                        <h4 className="font-black text-amber-900 tracking-tight text-sm">
                            Arrival Tips
                        </h4>
                        <ul className="text-xs text-amber-800/80 font-medium space-y-2 list-disc pl-4">
                            <li><strong>Safest exit:</strong> Use Ride apps or authorized Yellow Cabs (Metered).</li>
                            <li><strong>Avoid touts:</strong> Do not accept rides from aggressively waving individuals inside the terminal.</li>
                            <li><strong>Pickups:</strong> App drivers typically meet you in the parking lot area.</li>
                            <li><strong>Cash:</strong> Keep ~500 ETB handy in small denominations for immediate expenses.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* ========== EMERGENCY CONTACTS ========== */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <Phone className="w-6 h-6 text-ethiopia-red" />
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        Emergency Contacts
                    </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        {
                            label: "Police",
                            number: "991",
                            color: "bg-red-50 border-red-100",
                        },
                        {
                            label: "Ambulance",
                            number: "907",
                            color: "bg-blue-50 border-blue-100",
                        },
                        {
                            label: "Fire",
                            number: "939",
                            color: "bg-orange-50 border-orange-100",
                        },
                        {
                            label: "Traffic Police",
                            number: "945",
                            color: "bg-purple-50 border-purple-100",
                        },
                    ].map((item) => (
                        <a
                            key={item.label}
                            href={`tel:${item.number}`}
                            className={`${item.color} p-5 rounded-2xl border text-center space-y-2 active:scale-95 transition-transform`}
                        >
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 block">
                                {item.label}
                            </span>
                            <span className="text-2xl font-black text-gray-900 block">
                                {item.number}
                            </span>
                        </a>
                    ))}
                </div>
            </section>

            {/* Safety Tip */}
            <div className="p-7 bg-red-50 rounded-[2rem] border border-red-100 flex gap-5 items-start">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-red-100">
                    <Shield className="w-6 h-6 text-ethiopia-red" />
                </div>
                <div className="space-y-2">
                    <h4 className="font-black text-gray-900 tracking-tight">
                        Safety First
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                        For solo travel at night, we strongly recommend using
                        ride-hailing apps (Ride, Feres, or ZayRide) or hotel-arranged
                        transport. Avoid unmarked vehicles.
                    </p>
                </div>
            </div>

            {/* ========== SERVICE DETAIL MODAL ========== */}
            {selectedService && (
                <div
                    className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
                    onClick={() => setSelectedService(null)}
                >
                    <div
                        className="bg-white w-full max-w-md max-h-[90vh] rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`${selectedService.color} p-8 relative`}>
                            <button
                                onClick={() => setSelectedService(null)}
                                className="absolute top-6 right-6 p-2.5 bg-white/20 backdrop-blur-md rounded-2xl text-white border border-white/20 active:scale-90 transition-transform"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="space-y-3">
                                <h2
                                    className={`text-3xl font-black ${selectedService.textColor} tracking-tight`}
                                >
                                    {selectedService.name}
                                </h2>
                                <p
                                    className={`text-sm ${selectedService.textColor} opacity-80 font-medium italic`}
                                >
                                    {selectedService.description}
                                </p>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Quick Info */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest block mb-1">
                                        Price Range
                                    </span>
                                    <span className="font-black text-gray-900 text-sm">
                                        {selectedService.priceRange}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest block mb-1">
                                        Coverage
                                    </span>
                                    <span className="font-black text-gray-900 text-sm">
                                        {selectedService.coverage}
                                    </span>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="space-y-3">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    Contact
                                </h3>
                                <a
                                    href={`tel:${selectedService.phone}`}
                                    className="flex items-center gap-4 p-5 bg-ethiopia-green/5 rounded-2xl border border-ethiopia-green/10 active:scale-[0.98] transition-transform"
                                >
                                    <Phone className="w-6 h-6 text-ethiopia-green" />
                                    <div>
                                        <span className="font-black text-gray-900 block">
                                            {selectedService.phone}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold">
                                            Short code: {selectedService.shortCode}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 ml-auto" />
                                </a>
                            </div>

                            {/* How to Use */}
                            <div className="space-y-3">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    How to Use {selectedService.name}
                                </h3>
                                <div className="space-y-2">
                                    {selectedService.howToUse.map((step, i) => (
                                        <div
                                            key={i}
                                            className="flex gap-4 items-start p-4 bg-gray-50 rounded-2xl border border-gray-100"
                                        >
                                            <div className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <p className="text-sm text-gray-700 font-medium leading-relaxed pt-1">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pro Tip */}
                            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                                <p className="text-sm text-amber-800 font-bold leading-relaxed">
                                    â­ <strong>Pro Tip:</strong> {selectedService.tip}
                                </p>
                            </div>

                            {/* Download */}
                            <div className="space-y-3">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    Download the App
                                </h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => browser.open(selectedService.playStore, selectedService.name + " â€” Google Play")}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg"
                                    >
                                        <Download className="w-4 h-4" /> Android
                                    </button>
                                    <button
                                        onClick={() => browser.open(selectedService.appStore, selectedService.name + " â€” App Store")}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg"
                                    >
                                        <Download className="w-4 h-4" /> iOS
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

