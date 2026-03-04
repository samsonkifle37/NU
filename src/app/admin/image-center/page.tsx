"use client";

import { useState, useEffect } from "react";
import {
    RefreshCcw,
    Search,
    CheckCircle,
    XCircle,
    Image as ImageIcon,
    ExternalLink,
    AlertTriangle,
    ArrowRight
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

interface AuditItem {
    id: string;
    entityType: string;
    name: string;
    imageUrl: string | null;
    status: string;
    httpCode: number | null;
    notes: string | null;
}

export default function ImageRepairCenter() {
    const [items, setItems] = useState<AuditItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchAudit();
    }, []);

    const fetchAudit = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/images/audit");
            const data = await res.json();
            setItems(data.items);
            setStats(data.stats);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateImage = async (id: string, newUrl: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/admin/images/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, imageUrl: newUrl })
            });
            if (res.ok) {
                fetchAudit();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Image Repair Center</h1>
                            <p className="text-gray-500 text-sm mt-1 font-medium">Identify and fix broken/missing images.</p>
                        </div>
                        <button
                            onClick={fetchAudit}
                            disabled={loading}
                            className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50 active:scale-95"
                        >
                            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {stats && (
                        <div className="flex gap-4 mt-8">
                            <div className="flex-1 bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50">
                                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 block mb-1">Healthy</span>
                                <span className="text-2xl font-black text-emerald-700">{stats.find((s: any) => s.status === 'ok')?._count.id || 0}</span>
                            </div>
                            <div className="flex-1 bg-amber-50 rounded-2xl p-4 border border-amber-100/50">
                                <span className="text-[10px] uppercase font-black tracking-widest text-amber-600 block mb-1">Missing</span>
                                <span className="text-2xl font-black text-amber-700">{stats.find((s: any) => s.status === 'missing')?._count.id || 0}</span>
                            </div>
                            <div className="flex-1 bg-rose-50 rounded-2xl p-4 border border-rose-100/50">
                                <span className="text-[10px] uppercase font-black tracking-widest text-rose-600 block mb-1">Broken</span>
                                <span className="text-2xl font-black text-rose-700">{stats.find((s: any) => s.status === 'broken')?._count.id || 0}</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Scanning Gallery...</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500 group">
                                <div className="w-full md:w-32 h-32 rounded-2xl bg-gray-50 flex-shrink-0 relative overflow-hidden flex items-center justify-center border border-gray-100">
                                    {item.imageUrl && item.status !== 'missing' ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-gray-200" />
                                    )}
                                    <div className={`absolute top-2 right-2 p-1 rounded-full ${item.status === 'ok' ? 'bg-emerald-500' :
                                            item.status === 'broken' ? 'bg-rose-500' : 'bg-amber-500'
                                        }`}>
                                        {item.status === 'ok' ? <CheckCircle className="w-3 h-3 text-white" /> : <AlertTriangle className="w-3 h-3 text-white" />}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-2 py-1 rounded-md">{item.entityType}</span>
                                        <h3 className="text-xl font-black text-gray-900 truncate">{item.name}</h3>
                                    </div>
                                    <p className="text-gray-400 text-xs mt-1 truncate">Current URL: {item.imageUrl || "None"}</p>

                                    {item.notes && (
                                        <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-2">
                                            <XCircle className="w-4 h-4 text-rose-500 mt-0.5" />
                                            <p className="text-xs text-rose-700 font-medium leading-normal">{item.notes}</p>
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Paste new image URL..."
                                            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleUpdateImage(item.id, (e.target as HTMLInputElement).value);
                                                    (e.target as HTMLInputElement).value = "";
                                                }
                                            }}
                                        />
                                        <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-colors">
                                            <Search className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}
