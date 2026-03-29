"use client";

import { useState, useEffect } from "react";
import { getPipelineImages, getPipelineStats, updateImageState } from "./actions";
import {
    RefreshCcw,
    CheckCircle,
    XCircle,
    Image as ImageIcon,
    AlertTriangle,
    ShieldCheck,
    Star,
    UploadCloud,
    Search
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export default function ImageHardeningCenter() {
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'FAILED'>('FAILED');
    const [processingId, setProcessingId] = useState<string|null>(null);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        setLoading(true);
        const [imgs, st] = await Promise.all([getPipelineImages(filter), getPipelineStats()]);
        setImages(imgs);
        setStats(st);
        setLoading(false);
    };

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT' | 'SET_PRIMARY' | 'RETRY', newUrl?: string) => {
        setProcessingId(id);
        await updateImageState(id, action, newUrl);
        await fetchData();
        setProcessingId(null);
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] pb-24 text-white">
            <header className="bg-white/5 border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 py-6 border-l-4 border-[#D4AF37]">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                <ShieldCheck className="w-8 h-8 text-[#D4AF37]" strokeWidth={2.5} />
                                Image Quality Center
                            </h1>
                            <p className="text-gray-400 text-sm mt-1 font-medium">Phase 2: Source-Safe Mirroring and Primary Injection</p>
                        </div>
                        <div className="flex gap-2">
                             <select 
                                value={filter} 
                                onChange={(e)=>setFilter(e.target.value as any)}
                                className="bg-[#1A1A2E] text-white p-2.5 rounded-xl border border-white/20 text-xs font-black uppercase tracking-widest focus:border-[#D4AF37]"
                             >
                                 <option value="FAILED">Review FAILED</option>
                                 <option value="PENDING">Review PENDING</option>
                                 <option value="ALL">View ALL</option>
                             </select>
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="p-2.5 bg-[#D4AF37] text-[#1A1A2E] rounded-xl hover:opacity-80 transition-all disabled:opacity-50"
                            >
                                <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {stats && (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                                <div className="bg-gray-500/10 rounded-xl p-3 border border-gray-500/20">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block">Total Catalog</span>
                                    <span className="text-2xl font-black text-white">{stats.totalCount || 0}</span>
                                </div>
                                <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500 block">Approved</span>
                                    <span className="text-2xl font-black text-white">{stats.groups.find((s:any)=>s.status==='APPROVED')?._count.id || 0}</span>
                                </div>
                                <div className="bg-rose-500/10 rounded-xl p-3 border border-rose-500/20">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-rose-500 block">Failed / Blocked</span>
                                    <span className="text-2xl font-black text-white">{stats.groups.find((s:any)=>s.status==='FAILED')?._count.id || 0}</span>
                                </div>
                                <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-blue-500 block flex items-center gap-1">Pending Queue</span>
                                    <span className="text-2xl font-black text-white">{stats.groups.find((s:any)=>s.status==='PENDING')?._count.id || 0}</span>
                                </div>
                                <div className="bg-[#D4AF37]/10 rounded-xl p-3 border border-[#D4AF37]/30">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] block flex items-center gap-1"><UploadCloud className="w-3 h-3"/> Mirrored Safe</span>
                                    <span className="text-2xl font-black text-white">{stats.mirroredCount}</span>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-4 text-[10px] font-mono text-gray-500">
                                <span>LAST PIPELINE RUN: {stats.lastRunAt ? new Date(stats.lastRunAt).toLocaleString() : 'Never'}</span>
                                {stats.groups.find((s:any)=>s.status==='PENDING')?._count.id === 0 ? (
                                     <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> QUEUE EMPTY (COMPLETED)</span>
                                ) : (
                                     <span className="text-blue-400 flex items-center gap-1"><RefreshCcw className="w-3 h-3 animate-spin"/> PROCESSING BACKLOG...</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-bold text-[#D4AF37] uppercase tracking-widest text-xs">Scanning Database...</p>
                    </div>
                ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-white/10 rounded-[2rem]">
                        <CheckCircle className="w-12 h-12 text-emerald-500/50" />
                        <p className="font-bold text-gray-500 uppercase tracking-widest text-xs">No images found in this filter state.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {images.map((img) => (
                            <div key={img.id} className="bg-[#1A1A2E]/50 rounded-[2rem] p-6 border border-white/5 flex flex-col md:flex-row gap-6 hover:border-[#D4AF37]/30 transition-all duration-300">
                                
                                <div className="w-full md:w-48 h-32 rounded-2xl bg-black flex-shrink-0 relative overflow-hidden flex items-center justify-center border border-white/10 group">
                                    {img.mirroredUrl || img.imageUrl ? (
                                        <img src={img.mirroredUrl || img.imageUrl} alt="Asset" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-gray-700" />
                                    )}
                                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-black uppercase ${img.status === 'APPROVED' ? 'bg-emerald-500 text-black' : img.status === 'FAILED' ? 'bg-rose-500 text-white' : 'bg-gray-500 text-white'}`}>
                                        {img.status}
                                    </div>
                                    {img.priority === 0 && <div className="absolute top-2 left-2 bg-[#D4AF37] text-black px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1"><Star className="w-3 h-3 fill-black"/> Primary Hero</div>}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 text-gray-300 px-2 py-0.5 rounded">{img.place?.type || 'Place'}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 ${img.isMirrored ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-rose-500/20 text-rose-300'}`}>
                                           <UploadCloud className="w-3 h-3" /> {img.isMirrored ? 'Mirrored Safe' : 'External Only'}
                                        </span>
                                        <h3 className="text-lg font-black text-white truncate ml-2">{img.place?.name}</h3>
                                    </div>
                                    
                                    <p className="text-gray-400 text-xs truncate">Source URL: {img.imageUrl}</p>
                                    
                                    {img.rejectionReason && (
                                        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-500" />
                                            <div>
                                                <p className="text-xs font-bold text-rose-400">{img.rejectionReason}</p>
                                                {img.hash && <p className="text-[10px] text-rose-700/60 font-mono mt-1">Hash: {img.hash}</p>}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {img.status === 'APPROVED' && (
                                        <div className="mt-3 flex gap-4 text-[10px] uppercase font-bold text-gray-400">
                                            <span>Score: <span className="text-[#D4AF37]">{img.qualityScore}</span></span>
                                            <span>Dimensions: <span className="text-white">{img.width}x{img.height}</span></span>
                                            {img.labels?.length > 0 && <span>Labels: <span className="text-white">{img.labels.join(', ')}</span></span>}
                                        </div>
                                    )}

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <input
                                            type="text"
                                            placeholder="Paste new URL to override..."
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#D4AF37] w-48"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAction(img.id, 'RETRY', (e.target as HTMLInputElement).value);
                                                    (e.target as HTMLInputElement).value = "";
                                                }
                                            }}
                                        />
                                        
                                        {img.status !== 'APPROVED' && <button onClick={() => handleAction(img.id, 'APPROVE')} disabled={processingId===img.id} className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 font-bold uppercase px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-all">Force Approve</button>}
                                        {img.status !== 'FAILED' && <button onClick={() => handleAction(img.id, 'REJECT')} disabled={processingId===img.id} className="text-[10px] bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 font-bold uppercase px-3 py-1.5 rounded-lg border border-rose-500/30 transition-all">Reject Image</button>}
                                        {img.status === 'APPROVED' && img.priority !== 0 && <button onClick={() => handleAction(img.id, 'SET_PRIMARY')} disabled={processingId===img.id} className="text-[10px] bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 text-[#D4AF37] font-bold uppercase px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 transition-all">Set Primary Hero</button>}
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
