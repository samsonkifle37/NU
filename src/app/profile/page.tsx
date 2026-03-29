"use client";







import { useState } from "react";



import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";



import { useAuth } from "@/lib/auth-context";



import Image from "next/image";



import Link from "next/link";



import {



    ShieldAlert,



    User,



    Heart,



    Settings,



    LogIn,



    LogOut,



    Sparkles,



    ArrowRight,



    MapPin,



    X,



    Mail,



    Lock,



    UserPlus,



    Loader2,



    Trash2,



    Send,



} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";







// ── Auth Modal ──────────────────────────────



function AuthModal({ onClose }: { onClose: () => void }) {



    const { login, register } = useAuth();



    const [mode, setMode] = useState<"login" | "register">("login");



    const [name, setName] = useState("");



    const [email, setEmail] = useState("");



    const [password, setPassword] = useState("");



    const [error, setError] = useState("");



    const [loading, setLoading] = useState(false);







    const handleSubmit = async (e: React.FormEvent) => {



        e.preventDefault();



        setError("");



        setLoading(true);







        const result =



            mode === "login"



                ? await login(email, password)



                : await register(name, email, password);







        setLoading(false);







        if (result.error) {



            setError(result.error);



        } else {



            onClose();



        }



    };







    return (



        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">



            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />







            <div className="relative bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md p-6 pb-10 animate-in slide-in-from-bottom duration-300">



                {/* Close */}



                <button



                    onClick={onClose}



                    className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"



                >



                    <X className="w-4 h-4 text-gray-500" />



                </button>







                {/* Header */}



                <div className="text-center mb-6">



                    <div className="w-14 h-14 mx-auto bg-gradient-to-br from-ethiopia-green to-emerald-400 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-ethiopia-green/20">



                        {mode === "login" ? (



                            <LogIn className="w-7 h-7 text-white" />



                        ) : (



                            <UserPlus className="w-7 h-7 text-white" />



                        )}



                    </div>



                    <h2 className="text-xl font-black tracking-tight">



                        {mode === "login" ? "Welcome Back" : "Create Account"}



                    </h2>



                    <p className="text-gray-400 text-xs mt-1 font-medium">



                        {mode === "login"



                            ? tr("profile","signInSaved")



                            : "Join AddisView to save your favorites"}



                    </p>



                </div>







                {/* Form */}



                <form onSubmit={handleSubmit} className="space-y-3">



                    {mode === "register" && (



                        <div className="relative">



                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />



                            <input



                                type="text"



                                placeholder="Full name"



                                value={name}



                                onChange={(e) => setName(e.target.value)}



                                required



                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 text-sm font-medium"



                            />



                        </div>



                    )}







                    <div className="relative">



                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />



                        <input



                            type="email"



                            placeholder="Email address"



                            value={email}



                            onChange={(e) => setEmail(e.target.value)}



                            required



                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 text-sm font-medium"



                        />



                    </div>







                    <div className="relative">



                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />



                        <input



                            type="password"



                            placeholder="Password"



                            value={password}



                            onChange={(e) => setPassword(e.target.value)}



                            required



                            minLength={6}



                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-ethiopia-green/20 focus:border-ethiopia-green/30 text-sm font-medium"



                        />



                    </div>







                    {error && (



                        <p className="text-ethiopia-red text-xs font-bold bg-red-50 px-4 py-2.5 rounded-xl">



                            {error}



                        </p>



                    )}







                    <button



                        type="submit"



                        disabled={loading}



                        className="w-full bg-brand-dark text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50"



                    >



                        {loading ? (



                            <Loader2 className="w-4 h-4 animate-spin" />



                        ) : mode === "login" ? (



                            <>



                                <LogIn className="w-4 h-4" /> Sign In



                            </>



                        ) : (



                            <>



                                <UserPlus className="w-4 h-4" /> Create Account



                            </>



                        )}



                    </button>



                </form>







                {/* Toggle */}



                <p className="text-center text-xs text-gray-400 mt-5 font-medium">



                    {mode === "login" ? (



                        <>



                            Don&apos;t have an account?{" "}



                            <button



                                onClick={() => { setMode("register"); setError(""); }}



                                className="text-ethiopia-green font-bold"



                            >



                                Sign Up



                            </button>



                        </>



                    ) : (



                        <>



                            Already have an account?{" "}



                            <button



                                onClick={() => { setMode("login"); setError(""); }}



                                className="text-ethiopia-green font-bold"



                            >



                                Sign In



                            </button>



                        </>



                    )}



                </p>



            </div>



        </div>



    );



}







// ── {tr("profile","savedPlaces")} ────────────────────────────



interface FavoritePlace {



    id: string;



    placeId: string;



    place: {



        id: string;



        name: string;



        slug: string;



        type: string;



        city: string;



        area: string;



        shortDescription: string | null;



        images: { imageUrl: string }[];



    };



}







function SavedPlaces() {



    const queryClient = useQueryClient();







    const { data, isLoading } = useQuery({



        queryKey: ["favorites"],



        queryFn: async () => {



            const res = await fetch("/api/user/favorites");



            if (!res.ok) throw new Error("Failed");



            return res.json();



        },



    });







    const removeMutation = useMutation({



        mutationFn: async (placeId: string) => {



            await fetch("/api/user/favorites", {



                method: "DELETE",



                headers: { "Content-Type": "application/json" },



                body: JSON.stringify({ placeId }),



            });



        },



        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),



    });







    if (isLoading) {



        return (



            <div className="space-y-3">



                {[1, 2].map((i) => (



                    <div key={i} className="bg-gray-100 animate-pulse h-20 rounded-2xl" />



                ))}



            </div>



        );



    }







    const favorites: FavoritePlace[] = data?.favorites || [];







    if (favorites.length === 0) {



        return (



            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">



                <div className="text-4xl mb-3">💝</div>



                <h3 className="text-sm font-bold text-gray-900">{tr("profile","noSavedYet")}</h3>



                <p className="text-gray-400 text-[11px] mt-1 font-medium">



                    Tap the heart icon on any place to save it here



                </p>



                <Link



                    href="/stays"



                    className="inline-flex items-center gap-1 mt-4 text-ethiopia-green text-[10px] font-black uppercase tracking-widest"



                >



                    Explore Places <ArrowRight className="w-3.5 h-3.5" />



                </Link>



            </div>



        );



    }







    return (



        <div className="space-y-3">



            {favorites.map((fav) => (



                <div



                    key={fav.id}



                    className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-50"



                >



                    <Link href={`/place/${fav.place.slug}`} className="flex-shrink-0">



                        <div className="relative w-16 h-16 rounded-xl overflow-hidden">



                            {fav.place.images[0] ? (



                                <Image



                                    src={fav.place.images[0].imageUrl}



                                    alt={fav.place.name}



                                    fill



                                    className="object-cover"



                                    sizes="64px"



                                />



                            ) : (



                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-lg">



                                    🏛️



                                </div>



                            )}



                        </div>



                    </Link>







                    <Link href={`/place/${fav.place.slug}`} className="flex-1 min-w-0">



                        <h4 className="text-sm font-bold text-gray-900 truncate">



                            {fav.place.name}



                        </h4>



                        <div className="flex items-center gap-1 text-gray-400 mt-0.5">



                            <MapPin className="w-3 h-3" />



                            <span className="text-[9px] font-bold uppercase tracking-wider truncate">



                                {fav.place.area ? `${fav.place.area}, ${fav.place.city}` : fav.place.city}



                            </span>



                        </div>



                    </Link>







                    <button



                        onClick={() => removeMutation.mutate(fav.placeId)}



                        className="flex-shrink-0 w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"



                    >



                        <Trash2 className="w-3.5 h-3.5 text-ethiopia-red" />



                    </button>



                </div>



            ))}



        </div>



    );



}







// ── {tr("profile","tripPlanner")} ─────────────────────────



function AiTripPlanner() {



    const [city, setCity] = useState("Addis Ababa");



    const [nights, setNights] = useState("3");



    const [budget, setBudget] = useState("mid-range");



    const [interests, setInterests] = useState<string[]>([]);







    const interestOptions = [



        "food", "history", "nature", "nightlife", "culture", "adventure", "spa", "wildlife",



    ];







    const toggleInterest = (i: string) => {



        setInterests((prev) =>



            prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]



        );



    };







    const mutation = useMutation({



        mutationFn: async () => {



            const res = await fetch("/api/ai/recommend", {



                method: "POST",



                headers: { "Content-Type": "application/json" },



                body: JSON.stringify({



                    city,



                    nights: parseInt(nights),



                    budget,



                    interests,



                }),



            });



            if (!res.ok) throw new Error("Failed");



            return res.json();



        },



    });







    return (



        <div className="space-y-5">



            {/* City */}



            <div>



                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">



                    City



                </label>



                <input



                    type="text"



                    value={city}



                    onChange={(e) => setCity(e.target.value)}



                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm font-medium"



                />



            </div>







            {/* Nights + Budget */}



            <div className="flex gap-3">



                <div className="flex-1">



                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">



                        Nights



                    </label>



                    <input



                        type="number"



                        min="1"



                        max="30"



                        value={nights}



                        onChange={(e) => setNights(e.target.value)}



                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm font-medium"



                    />



                </div>



                <div className="flex-1">



                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">



                        Budget



                    </label>



                    <select



                        value={budget}



                        onChange={(e) => setBudget(e.target.value)}



                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm font-medium"



                    >



                        <option value="budget">Budget</option>



                        <option value="mid-range">Mid-range</option>



                        <option value="luxury">Luxury</option>



                    </select>



                </div>



            </div>







            {/* Interests */}



            <div>



                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">



                    Interests



                </label>



                <div className="flex flex-wrap gap-2">



                    {interestOptions.map((i) => (



                        <button



                            key={i}



                            onClick={() => toggleInterest(i)}



                            className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${interests.includes(i)



                                    ? "bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-200/50"



                                    : "bg-white text-gray-400 border-gray-100"



                                }`}



                        >



                            {i}



                        </button>



                    ))}



                </div>



            </div>







            {/* Submit */}



            <button



                onClick={() => mutation.mutate()}



                disabled={mutation.isPending}



                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all disabled:opacity-50"



            >



                {mutation.isPending ? (



                    <Loader2 className="w-4 h-4 animate-spin" />



                ) : (



                    <>



                        <Sparkles className="w-4 h-4" /> Get Recommendations



                    </>



                )}



            </button>







            {/* Results */}



            {mutation.data && (



                <div className="space-y-3 pt-2">



                    <div className="bg-gradient-to-br from-brand-dark to-gray-800 rounded-2xl p-4 shadow-xl">



                        <p className="text-gray-300 text-xs leading-relaxed font-medium whitespace-pre-line">



                            {mutation.data.explanation}



                        </p>



                    </div>







                    {mutation.data.recommendations?.map(



                        (rec: {



                            id: string;



                            name: string;



                            slug: string;



                            type: string;



                            city: string;



                            area: string;



                            shortDescription: string | null;



                            heroImage: string | null;



                        }) => (



                            <Link



                                key={rec.id}



                                href={`/place/${rec.slug}`}



                                className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-50 group"



                            >



                                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">



                                    {rec.heroImage ? (



                                        <Image



                                            src={rec.heroImage}



                                            alt={rec.name}



                                            fill



                                            className="object-cover"



                                            sizes="56px"



                                        />



                                    ) : (



                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-lg">



                                            🏛️



                                        </div>



                                    )}



                                </div>



                                <div className="flex-1 min-w-0">



                                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-ethiopia-green transition-colors">



                                        {rec.name}



                                    </h4>



                                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">



                                        {rec.type} · {rec.area || rec.city}



                                    </span>



                                </div>



                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-ethiopia-green transition-colors flex-shrink-0" />



                            </Link>



                        )



                    )}



                </div>



            )}



        </div>



    );



}







// ── Main Profile Page ───────────────────────



export default function ProfilePage() {



    const { user, loading, logout } = useAuth();



    const [showAuth, setShowAuth] = useState(false);


    const { language, setLanguage, tr } = useLanguage();



    const [activeSection, setActiveSection] = useState<



        "saved" | "ai" | "settings" | null



    >(null);







    if (loading) {



        return (



            <div className="space-y-4 pt-6">



                <div className="bg-gray-100 animate-pulse h-32 rounded-[2rem]" />



                <div className="bg-gray-100 animate-pulse h-16 rounded-2xl" />



                <div className="bg-gray-100 animate-pulse h-16 rounded-2xl" />



            </div>



        );



    }







    return (



        <div className="space-y-4 pt-6">



            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}







            {/* Profile Header */}



            <div className="bg-white rounded-[2rem] p-6 shadow-lg shadow-gray-200/30 border border-gray-50">



                <div className="flex items-center gap-4">



                    <div className="w-16 h-16 bg-gradient-to-br from-ethiopia-green to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-ethiopia-green/20">



                        <User className="w-8 h-8 text-white" />



                    </div>



                    <div className="flex-1">



                        <h2 className="text-xl font-black tracking-tight text-gray-900">



                            {user ? user.name : tr("profile","guestName")}



                        </h2>



                        <p className="text-gray-400 text-xs font-medium mt-0.5">



                            {user ? user.email : tr("profile","guestSub")}



                        </p>



                    </div>



                </div>







                {user ? (



                    <button



                        onClick={logout}



                        className="w-full mt-5 bg-gray-100 text-gray-600 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"



                    >



                        <LogOut className="w-4 h-4" />



                        {tr("profile","signOut")}



                    </button>



                ) : (



                    <button



                        onClick={() => setShowAuth(true)}



                        className="w-full mt-5 bg-brand-dark text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200/50"



                    >



                        <LogIn className="w-4 h-4" />



                        Sign In



                    </button>



                )}



            </div>







            {/* Guest benefit rows */}


            {!user && (


                <div className="space-y-2 mb-2">


                    <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3">


                        <Heart className="w-5 h-5 text-[#C9973B] shrink-0" />


                        <div>


                            <p className="text-white text-sm font-medium">{tr("profile","saveFavs")}</p>


                            <p className="text-gray-400 text-xs">{tr("profile","saveFavsDesc")}</p>


                        </div>


                    </div>


                    <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3">


                        <Sparkles className="w-5 h-5 text-[#C9973B] shrink-0" />


                        <div>


                            <p className="text-white text-sm font-medium">{tr("profile","personalRec")}</p>


                            <p className="text-gray-400 text-xs">{tr("profile","personalRecDesc")}</p>


                        </div>


                    </div>


                    <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3">


                        <MapPin className="w-5 h-5 text-[#C9973B] shrink-0" />


                        <div>


                            <p className="text-white text-sm font-medium">{tr("profile","tripHistory")}</p>


                            <p className="text-gray-400 text-xs">{tr("profile","tripHistoryDesc")}</p>


                        </div>


                    </div>


                </div>


            )}





            {/* Quick Actions */}



            <div className="space-y-3">



                {/* Saved Places */}



                <button



                    onClick={() =>



                        setActiveSection(activeSection === "saved" ? null : "saved")



                    }



                    className={`w-full flex items-center gap-4 rounded-2xl p-4 shadow-sm border transition-all ${activeSection === "saved"



                            ? "bg-rose-50 border-rose-200"



                            : "bg-white border-gray-50"



                        }`}



                >



                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">



                        <Heart className="w-5 h-5 text-rose-500" />



                    </div>



                    <div className="flex-1 text-left">



                        <h3 className="text-sm font-bold text-gray-900">{tr("profile","savedPlaces")}</h3>



                        <p className="text-[10px] text-gray-400 font-medium">



                            {tr("profile","savedPlacesDesc")}



                        </p>



                    </div>



                    <ArrowRight



                        className={`w-4 h-4 text-gray-300 transition-transform ${activeSection === "saved" ? "rotate-90" : ""



                            }`}



                    />



                </button>







                {activeSection === "saved" && (



                    <div className="px-1 pb-2">



                        {user ? (



                            <SavedPlaces />



                        ) : (



                            <div className="text-center py-8 bg-gray-50 rounded-2xl">



                                <p className="text-gray-400 text-xs font-medium">



                                    {tr("profile","signInToSee")}



                                </p>



                                <button



                                    onClick={() => setShowAuth(true)}



                                    className="mt-3 text-ethiopia-green text-[10px] font-black uppercase tracking-widest"



                                >



                                    Sign In →



                                </button>



                            </div>



                        )}



                    </div>



                )}







                {/* AI Trip Ideas */}



                <button



                    onClick={() =>



                        setActiveSection(activeSection === "ai" ? null : "ai")



                    }



                    className={`w-full flex items-center gap-4 rounded-2xl p-4 shadow-sm border transition-all ${activeSection === "ai"



                            ? "bg-purple-50 border-purple-200"



                            : "bg-white border-gray-50"



                        }`}



                >



                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">



                        <Sparkles className="w-5 h-5 text-purple-500" />



                    </div>



                    <div className="flex-1 text-left">



                        <h3 className="text-sm font-bold text-gray-900">{tr("profile","tripPlanner")}</h3>



                        <p className="text-[10px] text-gray-400 font-medium">



                            {tr("profile","tripPlannerDesc")}



                        </p>



                    </div>



                    <ArrowRight



                        className={`w-4 h-4 text-gray-300 transition-transform ${activeSection === "ai" ? "rotate-90" : ""



                            }`}



                    />



                </button>







                {activeSection === "ai" && (



                    <div className="px-1 pb-2">



                        <AiTripPlanner />



                    </div>



                )}







                {/* Settings */}



                <button



                    onClick={() =>



                        setActiveSection(activeSection === "settings" ? null : "settings")



                    }



                    className={`w-full flex items-center gap-4 rounded-2xl p-4 shadow-sm border transition-all ${activeSection === "settings"



                            ? "bg-gray-100 border-gray-300"



                            : "bg-white border-gray-50"



                        }`}



                >



                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">



                        <Settings className="w-5 h-5 text-gray-500" />



                    </div>



                    <div className="flex-1 text-left">



                        <h3 className="text-sm font-bold text-gray-900">{tr("profile","settings")}</h3>



                        <p className="text-[10px] text-gray-400 font-medium">



                            {tr("profile","settingsDesc")}



                        </p>



                    </div>



                    <ArrowRight



                        className={`w-4 h-4 text-gray-300 transition-transform ${activeSection === "settings" ? "rotate-90" : ""



                            }`}



                    />



                </button>







                {activeSection === "settings" && (



                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-4">



                        <button


                            className="flex justify-between items-center w-full"


                            onClick={() => {


                                const next = language === "en" ? "am" : "en";


                                setLanguage(next);


                            }}


                        >


                            <span className="text-sm font-medium text-gray-700">{tr("profile","language")}</span>


                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg flex items-center gap-1">


                                {language === "en" ? "English" : "አማርኛ"}


                                <span className="text-[9px] text-gray-400 ml-1">⇅</span>


                            </span>


                        </button>



                        <div className="flex justify-between items-center">



                            <span className="text-sm font-medium text-gray-700">



                                {tr("profile","notifications")}



                            </span>



                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-lg">



                                On



                            </span>



                        </div>



                        <div className="flex justify-between items-center">



                            <span className="text-sm font-medium text-gray-700">{tr("profile","version")}</span>



                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-lg">



                                V2.0



                            </span>



                        </div>



                    </div>



                )}



            </div>







            {/* Emergency & Safety */}


            <Link


                href="/emergency"


                className="flex items-center justify-between bg-red-950/40 border border-red-900/40 rounded-2xl p-4"


            >


                <div className="flex items-center gap-3">


                    <ShieldAlert className="w-5 h-5 text-red-500" />


                    <div>


                        <p className="text-white font-semibold text-sm">{tr("profile","emergency")}</p>


                        <p className="text-gray-400 text-xs">{tr("profile","emergencyDesc")}</p>


                    </div>


                </div>


                <ArrowRight className="w-4 h-4 text-red-300" />


            </Link>





            {/* Footer */}



            <div className="text-center pt-4 pb-8">



                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">



                    AddisView V2 — Discover Ethiopia



                </p>



            </div>



        </div>



    );



}



