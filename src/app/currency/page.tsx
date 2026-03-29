"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Banknote, RefreshCw, ArrowLeftRight,
    Landmark, CreditCard, AlertTriangle, Wifi, WifiOff,
} from "lucide-react";

const CURRENCIES = [
    { code: "USD", symbol: "$",  flag: "🇺🇸", name: "US Dollar"       },
    { code: "EUR", symbol: "€",  flag: "🇪🇺", name: "Euro"             },
    { code: "GBP", symbol: "£",  flag: "🇬🇧", name: "British Pound"    },
    { code: "AED", symbol: "د.إ",flag: "🇦🇪", name: "UAE Dirham"       },
    { code: "CNY", symbol: "¥",  flag: "🇨🇳", name: "Chinese Yuan"     },
    { code: "SAR", symbol: "﷼",  flag: "🇸🇦", name: "Saudi Riyal"      },
    { code: "CAD", symbol: "C$", flag: "🇨🇦", name: "Canadian Dollar"  },
    { code: "AUD", symbol: "A$", flag: "🇦🇺", name: "Australian Dollar" },
];

// Fallback rates (ETB per 1 unit of foreign currency) — updated periodically
const FALLBACK_RATES: Record<string, number> = {
    USD: 128.5, EUR: 138.2, GBP: 161.4, AED: 34.99,
    CNY: 17.75, SAR: 34.27, CAD: 94.3, AUD: 82.1,
};

export default function CurrencyPage() {
    const [rates, setRates]           = useState<Record<string, number>>(FALLBACK_RATES);
    const [updatedAt, setUpdatedAt]   = useState<string>("");
    const [isLive, setIsLive]         = useState(false);
    const [loading, setLoading]       = useState(false);
    const [amount, setAmount]         = useState("1");
    const [fromCode, setFromCode]     = useState("USD");
    const [toETB, setToETB]           = useState(true); // true = foreign→ETB, false = ETB→foreign

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res  = await fetch("https://open.er-api.com/v6/latest/ETB");
            const data = await res.json();
            if (data?.rates) {
                const converted: Record<string, number> = {};
                for (const cur of CURRENCIES) {
                    // open.er-api gives ETB→X; we want X→ETB = 1 / rate
                    if (data.rates[cur.code]) {
                        converted[cur.code] = 1 / data.rates[cur.code];
                    }
                }
                setRates({ ...FALLBACK_RATES, ...converted });
                setIsLive(true);
                setUpdatedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
            }
        } catch {
            setIsLive(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRates(); }, []);

    const selectedCur = CURRENCIES.find(c => c.code === fromCode)!;
    const rate        = rates[fromCode] ?? FALLBACK_RATES[fromCode];
    const inputNum    = parseFloat(amount) || 0;

    const result = toETB
        ? inputNum * rate
        : inputNum / rate;

    const fromLabel = toETB ? `${selectedCur.flag} ${selectedCur.code}` : "🇪🇹 ETB";
    const toLabel   = toETB ? "🇪🇹 ETB" : `${selectedCur.flag} ${selectedCur.code}`;

    return (
        <div className="space-y-6 pt-4 pb-24 px-1">
            {/* Header */}
            <header className="space-y-2">
                <Link href="/" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-2">
                    <ArrowLeft className="w-3 h-3" /> Back Home
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Banknote className="w-8 h-8 text-[#C9973B]" />
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Currency</h1>
                    </div>
                    <button
                        onClick={fetchRates}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                    {isLive
                        ? <><Wifi className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">Live rates · Updated {updatedAt}</span></>
                        : <><WifiOff className="w-3 h-3 text-amber-500" /><span className="text-amber-600">Estimated rates · Tap Refresh for live</span></>
                    }
                </div>
            </header>

            {/* Converter Card */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-200/30 p-6 space-y-5">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Converter</h2>

                {/* Currency selector */}
                <div className="flex flex-wrap gap-2">
                    {CURRENCIES.map(c => (
                        <button
                            key={c.code}
                            onClick={() => setFromCode(c.code)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                fromCode === c.code
                                    ? "bg-[#1A1612] text-white border-[#1A1612]"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            {c.flag} {c.code}
                        </button>
                    ))}
                </div>

                {/* Input */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-2">
                        <span className="text-sm font-black text-gray-400">{fromLabel}</span>
                        <input
                            type="number"
                            min="0"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="flex-1 bg-transparent text-right text-lg font-black text-gray-900 focus:outline-none"
                        />
                    </div>

                    {/* Swap */}
                    <button
                        onClick={() => setToETB(!toETB)}
                        className="w-10 h-10 bg-[#C9973B]/10 rounded-xl flex items-center justify-center hover:bg-[#C9973B]/20 transition shrink-0"
                    >
                        <ArrowLeftRight className="w-4 h-4 text-[#C9973B]" />
                    </button>

                    <div className="flex-1 bg-[#C9973B]/5 rounded-2xl border border-[#C9973B]/20 px-4 py-3 flex items-center gap-2 justify-between">
                        <span className="text-sm font-black text-[#C9973B]">{toLabel}</span>
                        <span className="text-lg font-black text-gray-900">{result.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Rate hint */}
                <p className="text-[10px] text-gray-400 font-medium text-center">
                    1 {selectedCur.code} ≈ {rate.toFixed(2)} ETB &nbsp;·&nbsp; 1 ETB ≈ {(1 / rate).toFixed(4)} {selectedCur.code}
                </p>
            </div>

            {/* All rates quick-view */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 space-y-3">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">All Rates → ETB</h2>
                <div className="grid grid-cols-2 gap-2">
                    {CURRENCIES.map(c => (
                        <button
                            key={c.code}
                            onClick={() => { setFromCode(c.code); setToETB(true); setAmount("1"); }}
                            className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 hover:bg-gray-100 transition border border-transparent hover:border-gray-200"
                        >
                            <span className="text-xs font-black text-gray-700">{c.flag} {c.code}</span>
                            <span className="text-xs font-black text-[#C9973B]">{(rates[c.code] ?? FALLBACK_RATES[c.code]).toFixed(1)} ETB</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tips */}
            <div className="space-y-3">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 px-1">Money Tips</h2>

                <div className="bg-[#C9973B]/5 p-5 rounded-[2rem] border border-[#C9973B]/20 flex gap-4 items-start">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-[#C9973B]/20 shrink-0">
                        <Landmark className="w-5 h-5 text-[#C9973B]" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-black text-gray-900 text-sm">Best Exchange</h3>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            Use <strong>Commercial Bank of Ethiopia (CBE)</strong>, <strong>Dashen Bank</strong>, or <strong>Awash Bank</strong> for official rates. Keep receipts — needed to convert ETB back on departure.
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 p-5 rounded-[2rem] border border-blue-100 flex gap-4 items-start">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-blue-100 shrink-0">
                        <CreditCard className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-black text-gray-900 text-sm">Cards & ATMs</h3>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            Visa and Mastercard work at major hotels and upscale restaurants. ATMs available at Bole Airport, CBE, and Dashen branches in Addis. Always carry <strong>cash for street food, local taxis, and markets.</strong>
                        </p>
                    </div>
                </div>

                <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-100 flex gap-4 items-start">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-emerald-100 shrink-0">
                        <span className="text-lg">📱</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-black text-gray-900 text-sm">Telebirr</h3>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            Ethiopia's mobile money platform. Widely accepted for taxis, market vendors, and some hotels. Download Ethio Telecom's <strong>Telebirr</strong> app before you travel for seamless cashless payments.
                        </p>
                    </div>
                </div>

                <div className="bg-red-50 p-5 rounded-[2rem] border border-red-100 flex gap-4 items-start">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-red-100 shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-black text-gray-900 text-sm">Avoid Street Changers</h3>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            Never exchange money with informal street traders — it is illegal and you risk receiving counterfeit notes. Stick to licensed banks and official hotel desks.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
