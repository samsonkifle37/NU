"use client";

import { useState } from "react";
import {
    Home,
    CheckCircle,
    Send,
    Loader2,
    Upload,
    Users,
    BedDouble,
    Bath,
    DollarSign,
    User,
    Mail,
    Phone,
    MapPin,
    Wifi,
    Car,
    ChefHat,
    Tv,
    Droplets,
    Wind,
    Shield,
    Sparkles,
    ArrowRight,
    X,
} from "lucide-react";

const PLACE_TYPES = [
    { value: "APARTMENT", label: "Apartment", icon: "🏢" },
    { value: "GUESTHOUSE", label: "Guest House", icon: "🏠" },
    { value: "ENTIRE_HOME", label: "Entire Home", icon: "🏡" },
    { value: "PRIVATE_ROOM", label: "Private Room", icon: "🛏️" },
    { value: "SHARED_ROOM", label: "Shared Room", icon: "🛋️" },
];

const AMENITIES = [
    { value: "wifi", label: "Wi-Fi", icon: Wifi },
    { value: "parking", label: "Parking", icon: Car },
    { value: "kitchen", label: "Kitchen", icon: ChefHat },
    { value: "tv", label: "TV", icon: Tv },
    { value: "washing-machine", label: "Washing Machine", icon: Droplets },
    { value: "air-conditioning", label: "A/C", icon: Wind },
    { value: "security", label: "Security", icon: Shield },
    { value: "balcony", label: "Balcony", icon: Wind },
];

export default function BecomeAHostPage() {
    const [step, setStep] = useState<"info" | "form" | "success">("info");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [placeType, setPlaceType] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [city, setCity] = useState("Addis Ababa");
    const [area, setArea] = useState("");
    const [maxGuests, setMaxGuests] = useState(2);
    const [bedrooms, setBedrooms] = useState(1);
    const [beds, setBeds] = useState(1);
    const [bathrooms, setBathrooms] = useState(1);
    const [pricePerNight, setPricePerNight] = useState(50);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [hostName, setHostName] = useState("");
    const [hostEmail, setHostEmail] = useState("");
    const [hostPhone, setHostPhone] = useState("");
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState("");

    const toggleAmenity = (value: string) => {
        setAmenities((prev) =>
            prev.includes(value)
                ? prev.filter((a) => a !== value)
                : [...prev, value]
        );
    };

    const addImageUrl = () => {
        if (newImageUrl.trim() && !imageUrls.includes(newImageUrl.trim())) {
            setImageUrls((prev) => [...prev, newImageUrl.trim()]);
            setNewImageUrl("");
        }
    };

    const removeImage = (url: string) => {
        setImageUrls((prev) => prev.filter((u) => u !== url));
    };

    const handleSubmit = async () => {
        setError("");

        // Validate
        if (!placeType) return setError("Please select a property type.");
        if (!title.trim()) return setError("Please enter a title.");
        if (!description.trim()) return setError("Please enter a description.");
        if (!hostName.trim()) return setError("Please enter your name.");
        if (!hostEmail.trim()) return setError("Please enter your email.");
        if (!hostPhone.trim()) return setError("Please enter your phone number.");

        setSubmitting(true);

        try {
            const res = await fetch("/api/host-listings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    placeType,
                    title,
                    description,
                    city,
                    area,
                    country: "Ethiopia",
                    maxGuests,
                    bedrooms,
                    beds,
                    bathrooms,
                    pricePerNight,
                    amenities,
                    hostName,
                    hostEmail,
                    hostPhone,
                    imageUrls,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Submission failed");
            }

            setStep("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Hero / Info Screen ──
    if (step === "info") {
        return (
            <div className="space-y-8 pt-6 pb-10">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-ethiopia-green via-emerald-600 to-teal-700 p-8 shadow-2xl text-white">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-ethiopia-yellow/10 rounded-full blur-3xl" />

                    <div className="relative z-10 space-y-5">
                        <div className="w-16 h-16 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center border border-white/20">
                            <Home className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight leading-tight">
                            Have a home in Ethiopia?
                        </h1>
                        <p className="text-white/80 text-sm leading-relaxed font-medium">
                            Share it with travelers from around the world and earn income with NU.
                        </p>
                    </div>
                </div>

                {/* How it works */}
                <div className="space-y-4">
                    <h2 className="text-lg font-black tracking-tight uppercase px-1">
                        How it works
                    </h2>
                    {[
                        {
                            num: "1",
                            title: "Submit your place",
                            desc: "Fill in property details, upload photos, and tell us about yourself.",
                        },
                        {
                            num: "2",
                            title: "We review it",
                            desc: "Our team reviews your listing to ensure quality and safety for guests.",
                        },
                        {
                            num: "3",
                            title: "Go live on NU",
                            desc: "Once approved, your listing appears on the Stays page with a 'Hosted Home' badge.",
                        },
                    ].map((item) => (
                        <div
                            key={item.num}
                            className="flex gap-5 items-start bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-200/20"
                        >
                            <div className="w-12 h-12 bg-ethiopia-green text-white rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 shadow-lg shadow-ethiopia-green/20">
                                {item.num}
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 tracking-tight">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-500 font-medium mt-1 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Benefits */}
                <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-5">
                    <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-ethiopia-yellow" />
                        Why host with NU?
                    </h2>
                    {[
                        "Reach international travelers visiting Ethiopia",
                        "Flexible — you set your own price and availability",
                        "Zero upfront costs to list",
                        "Dedicated support for hosts",
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-ethiopia-green flex-shrink-0" />
                            <span className="text-sm font-medium text-white/90">
                                {item}
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={() => setStep("form")}
                    className="w-full bg-ethiopia-green text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-ethiopia-green/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    List Your Place <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    // ── Success Screen ──
    if (step === "success") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 pt-8">
                <div className="w-24 h-24 bg-ethiopia-green/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-ethiopia-green" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    Listing Submitted! 🎉
                </h1>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed font-medium">
                    Thank you! Your listing has been submitted and is waiting for
                    approval. We&apos;ll email you once it&apos;s live on NU.
                </p>
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 max-w-xs">
                    <p className="text-xs text-amber-700 font-bold leading-relaxed">
                        ⏱ Review typically takes 1–2 business days. We&apos;ll contact you at{" "}
                        <strong>{hostEmail}</strong> with the result.
                    </p>
                </div>
                <button
                    onClick={() => (window.location.href = "/")}
                    className="text-ethiopia-green text-xs font-black uppercase tracking-widest mt-4"
                >
                    ← Back to Home
                </button>
            </div>
        );
    }

    // ── Form ──
    return (
        <div className="space-y-6 pt-4 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">
                        List Your Place
                    </h1>
                    <p className="text-brand-muted text-sm font-medium italic mt-1">
                        Fill in the details below
                    </p>
                </div>
                <button
                    onClick={() => setStep("info")}
                    className="text-gray-400 text-xs font-bold uppercase tracking-widest"
                >
                    ← Back
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold p-4 rounded-2xl">
                    {error}
                </div>
            )}

            {/* Property Type */}
            <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">
                    Property Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {PLACE_TYPES.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setPlaceType(t.value)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${placeType === t.value
                                ? "border-ethiopia-green bg-ethiopia-green/5 shadow-lg shadow-ethiopia-green/10"
                                : "border-gray-100 bg-white hover:border-gray-200"
                                }`}
                        >
                            <span className="text-xl block mb-1">{t.icon}</span>
                            <span className="text-xs font-black text-gray-900">
                                {t.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">
                    Title *
                </label>
                <input
                    type="text"
                    placeholder='e.g. "Sunny 2-bedroom apartment near Bole"'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 bg-white rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 outline-none transition-all"
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">
                    Description *
                </label>
                <textarea
                    placeholder="Describe your place — what makes it special, the neighborhood, nearby attractions..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full p-4 bg-white rounded-2xl border border-gray-200 text-sm font-medium resize-none focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 outline-none transition-all"
                />
            </div>

            {/* Location */}
            <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location *
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="p-4 bg-white rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-ethiopia-green/20 outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Area (Bole, Piassa...)"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="p-4 bg-white rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-ethiopia-green/20 outline-none"
                    />
                </div>
            </div>

            {/* Property Details */}
            <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">
                    Property Details
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: Users, label: "Max Guests", val: maxGuests, set: setMaxGuests },
                        { icon: Home, label: "Bedrooms", val: bedrooms, set: setBedrooms },
                        { icon: BedDouble, label: "Beds", val: beds, set: setBeds },
                        { icon: Bath, label: "Bathrooms", val: bathrooms, set: setBathrooms },
                    ].map(({ icon: Icon, label, val, set }) => (
                        <div
                            key={label}
                            className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3"
                        >
                            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">
                                    {label}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <button
                                        onClick={() => set(Math.max(1, val - 1))}
                                        className="w-7 h-7 bg-gray-100 rounded-lg text-gray-500 font-bold flex items-center justify-center hover:bg-gray-200"
                                    >
                                        −
                                    </button>
                                    <span className="text-sm font-black text-gray-900 w-6 text-center">
                                        {val}
                                    </span>
                                    <button
                                        onClick={() => set(val + 1)}
                                        className="w-7 h-7 bg-gray-100 rounded-lg text-gray-500 font-bold flex items-center justify-center hover:bg-gray-200"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Price Per Night (USD)
                </label>
                <input
                    type="number"
                    min={5}
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(Number(e.target.value))}
                    className="w-full p-4 bg-white rounded-2xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-ethiopia-green/20 outline-none"
                />
            </div>

            {/* Amenities */}
            <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">
                    Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => toggleAmenity(value)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${amenities.includes(value)
                                ? "bg-ethiopia-green text-white border-ethiopia-green shadow-lg shadow-ethiopia-green/20"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Photos */}
            <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Photos (paste image URLs)
                </label>
                <div className="flex gap-2">
                    <input
                        type="url"
                        placeholder="https://example.com/photo.jpg"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addImageUrl()}
                        className="flex-1 p-4 bg-white rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-ethiopia-green/20 outline-none"
                    />
                    <button
                        onClick={addImageUrl}
                        className="px-5 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest"
                    >
                        Add
                    </button>
                </div>
                {imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {imageUrls.map((url, i) => (
                            <div
                                key={i}
                                className="relative group bg-gray-100 rounded-xl overflow-hidden w-20 h-20"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={url}
                                    alt={`Photo ${i + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => removeImage(url)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Host Details */}
            <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">
                    Your Details *
                </label>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200">
                        <User className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Full name"
                            value={hostName}
                            onChange={(e) => setHostName(e.target.value)}
                            className="flex-1 text-sm font-medium outline-none bg-transparent"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={hostEmail}
                            onChange={(e) => setHostEmail(e.target.value)}
                            className="flex-1 text-sm font-medium outline-none bg-transparent"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <input
                            type="tel"
                            placeholder="Phone / WhatsApp"
                            value={hostPhone}
                            onChange={(e) => setHostPhone(e.target.value)}
                            className="flex-1 text-sm font-medium outline-none bg-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-ethiopia-green text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-ethiopia-green/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
                {submitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                ) : (
                    <>
                        <Send className="w-4 h-4" /> Submit Listing
                    </>
                )}
            </button>

            <p className="text-[10px] text-gray-400 text-center font-medium leading-relaxed">
                By submitting, you agree that your listing information will be
                reviewed by the NU team. Approved listings will be
                publicly visible on the Stays page.
            </p>
        </div>
    );
}
