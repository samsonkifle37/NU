"use client"

import { useState, useEffect } from 'react'
import { getPendingCandidates, getCandidatePlaces, resolveDuplicate, getVerificationData, getQualityQueue } from './actions'
import { Check, X, Eye, AlertTriangle, Search, Activity, Link as LinkIcon, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function CandidateReview({ candidates }: { candidates: any[] }) {
    const [activePair, setActivePair] = useState<any>(null);

    async function loadPair(cand: any) {
        const { master, duplicate } = await getCandidatePlaces(cand.masterPlaceId, cand.duplicateId);
        setActivePair({ cand, master, duplicate });
    }

    async function handleAction(action: 'MERGE' | 'REJECT' | 'IGNORE') {
        if (!activePair) return;
        await resolveDuplicate(activePair.cand.id, activePair.master.id, activePair.duplicate.id, action);
        setActivePair(null);
        window.location.reload(); // Quick refresh
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 border-r border-[#D4AF37]/20 pr-4">
                <h3 className="text-sm font-black uppercase text-[#D4AF37] mb-4">Pending Merges ({candidates.length})</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {candidates.map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => loadPair(c)}
                            className={`p-3 rounded-xl border cursor-pointer hover:bg-white/5 transition-colors ${activePair?.cand.id === c.id ? 'border-[#D4AF37] bg-white/5' : 'border-white/10'}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-white">Score: {c.similarityScore}</span>
                                <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded">PENDING</span>
                            </div>
                            <div className="mt-2 text-[10px] text-gray-400 font-mono break-all">{c.masterPlaceId.split('-')[0]} vs {c.duplicateId.split('-')[0]}</div>
                        </div>
                    ))}
                    {candidates.length === 0 && <p className="text-sm text-gray-500">No pending candidates!</p>}
                </div>
            </div>
            
            <div className="md:col-span-2">
                {activePair ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-white">Compare Models</h3>
                            <div className="space-x-2">
                                <button onClick={() => handleAction('MERGE')} className="bg-[#D4AF37] text-[#1A1A2E] px-4 py-2 rounded-lg text-xs font-black uppercase">Merge → Master</button>
                                <button onClick={() => handleAction('REJECT')} className="bg-red-500/20 text-red-500 hover:bg-red-500/30 px-4 py-2 rounded-lg text-xs font-black uppercase">False Positive</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* MASTER */}
                            <div className="bg-white/5 border border-[#D4AF37]/30 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-[#D4AF37] text-[#1A1A2E] text-[10px] font-black px-3 py-1 rounded-bl-lg">MASTER</div>
                                <h4 className="text-xl font-bold text-white mb-1 mt-2">{activePair.master?.name || 'Deleted'}</h4>
                                <p className="text-xs text-gray-400 mb-4">{activePair.master?.id}</p>
                                
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-500 text-xs">Category</span>
                                        <span className="text-white font-medium">{activePair.master?.type}</span>
                                    </div>
                                    <div className="flex items-start justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-500 text-xs text-left">Address</span>
                                        <span className="text-white font-medium text-right max-w-[150px]">{activePair.master?.fullAddress || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-start justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-500 text-xs">Coordinates</span>
                                        <span className="text-white font-medium">{activePair.master?.latitude?.toFixed(4)}, {activePair.master?.longitude?.toFixed(4)}</span>
                                    </div>
                                    <div className="flex items-start justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-500 text-xs">Phone</span>
                                        <span className="text-white font-medium">{activePair.master?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-start justify-between pb-2">
                                        <span className="text-gray-500 text-xs">Sources</span>
                                        <span className="text-[#D4AF37] font-medium">{activePair.master?.placeSources?.map((s:any)=>s.sourceName).join(', ') || 'Manual'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* DUPLICATE */}
                            <div className="bg-white/5 border border-white/10 opacity-70 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-gray-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg">INCOMING</div>
                                <h4 className="text-xl font-bold text-white mb-1 mt-2">{activePair.duplicate?.name || 'Deleted'}</h4>
                                <p className="text-xs text-gray-400 mb-4">{activePair.duplicate?.id}</p>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-500 text-xs">Category</span>
                                        <span className={`${activePair.master?.type === activePair.duplicate?.type ? 'text-green-400' : 'text-yellow-400'} font-medium`}>{activePair.duplicate?.type}</span>
                                    </div>
                                    <div className="flex items-start justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-500 text-xs text-left">Address</span>
                                        <span className={`font-medium text-right max-w-[150px] ${activePair.master?.fullAddress === activePair.duplicate?.fullAddress ? 'text-green-400' : 'text-white'}`}>{activePair.duplicate?.fullAddress || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-start justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-500 text-xs">Coordinates</span>
                                        <span className="text-white font-medium">{activePair.duplicate?.latitude?.toFixed(4)}, {activePair.duplicate?.longitude?.toFixed(4)}</span>
                                    </div>
                                    <div className="flex items-start justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-500 text-xs">Phone</span>
                                        <span className={`${activePair.master?.phone === activePair.duplicate?.phone ? 'text-green-400' : 'text-white'} font-medium`}>{activePair.duplicate?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-start justify-between pb-2">
                                        <span className="text-gray-500 text-xs">Sources</span>
                                        <span className="text-gray-300 font-medium">{activePair.duplicate?.placeSources?.map((s:any)=>s.sourceName).join(', ') || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-2xl min-h-[400px]">
                        <Search className="w-10 h-10 mb-4 opacity-50" />
                        <p className="text-sm font-medium">Select a duplicate candidate from the queue to review</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function VerificationInspector({ data }: { data: any[] }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-[#D4AF37] mb-4">Verification State (Last 50)</h3>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                <table className="w-full text-left text-sm text-white">
                    <thead className="text-[10px] uppercase bg-black/40 text-gray-400">
                        <tr>
                            <th className="px-4 py-3">Place Name</th>
                            <th className="px-4 py-3">Score</th>
                            <th className="px-4 py-3">Sources</th>
                            <th className="px-4 py-3">Logs</th>
                            <th className="px-4 py-3">Missing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(place => (
                            <tr key={place.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-4 py-3 font-medium flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${place.verificationScore >= 70 ? 'bg-green-500' : place.verificationScore >= 40 ? 'bg-[#D4AF37]' : 'bg-red-500'}`}></div>
                                    <span className="line-clamp-1 max-w-[200px]">{place.name}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="font-mono bg-black/50 px-2 py-1 rounded text-xs">{place.verificationScore}/100</span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400">
                                    {place.placeSources.map((s:any)=>s.sourceType).join(', ') || 'None'}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400 line-clamp-1 max-w-[250px]">
                                    {place.verificationLogs[0]?.reason || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-xs text-[#D4AF37]">
                                    {!place.phone && "📞 "}
                                    {!place.websiteUrl && "🌐 "}
                                    {(!place.latitude || !place.longitude) && "📍 "}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function QualityQueue({ data }: { data: any[] }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-[#D4AF37] mb-4">Low Quality Queue</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map(place => (
                    <div key={place.id} className="bg-white/5 border border-red-500/20 rounded-xl p-4 hover:border-red-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white text-sm line-clamp-1">{place.name}</h4>
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        </div>
                        <div className="space-y-1 mt-3">
                            {place.images.length === 0 && <span className="block text-[10px] text-red-300 bg-red-500/10 px-2 py-1 rounded w-fit uppercase">0 Images</span>}
                            {place.verificationScore < 50 && <span className="block text-[10px] text-yellow-300 bg-yellow-500/10 px-2 py-1 rounded w-fit uppercase">Low Score ({place.verificationScore})</span>}
                            {place.placeSources.length <= 1 && <span className="block text-[10px] text-orange-300 bg-orange-500/10 px-2 py-1 rounded w-fit uppercase">Single Source</span>}
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                            <Link href={`/place/${place.slug}`} target="_blank" className="text-[10px] text-[#D4AF37] font-bold uppercase hover:underline flex items-center gap-1">
                                View Live <LinkIcon className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function PipelineDashboard() {
    const [tab, setTab] = useState<'DUPLICATES' | 'VERIFICATION' | 'QUALITY'>('DUPLICATES');
    
    const [candidates, setCandidates] = useState<any[]>([]);
    const [verificationData, setVerificationData] = useState<any[]>([]);
    const [qualityData, setQualityData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            setLoading(true);
            const [cands, veri, qual] = await Promise.all([
                getPendingCandidates(),
                getVerificationData(),
                getQualityQueue()
            ]);
            setCandidates(cands);
            setVerificationData(veri);
            setQualityData(qual);
            setLoading(false);
        }
        fetchAll();
    }, []);

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white p-6 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                            <Activity className="w-8 h-8 text-[#D4AF37]" />
                            Pipeline Engine V1
                        </h1>
                        <p className="text-sm text-gray-400 mt-1 font-medium">10,000 Places Moderation Dashboard</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setTab('DUPLICATES')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'DUPLICATES' ? 'bg-[#D4AF37] text-[#1A1A2E]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        Review Duplicates {candidates.length > 0 && `(${candidates.length})`}
                    </button>
                    <button 
                        onClick={() => setTab('VERIFICATION')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'VERIFICATION' ? 'bg-[#D4AF37] text-[#1A1A2E]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        Verification Inspector
                    </button>
                    <button 
                        onClick={() => setTab('QUALITY')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'QUALITY' ? 'bg-[#D4AF37] text-[#1A1A2E]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        Quality Queue {qualityData.length > 0 && `(${qualityData.length})`}
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-[#1A1A2E]/50 border border-white/5 rounded-[2rem] p-6 shadow-2xl">
                    {loading ? (
                        <div className="py-20 flex justify-center text-[#D4AF37]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                        </div>
                    ) : (
                        <>
                            {tab === 'DUPLICATES' && <CandidateReview candidates={candidates} />}
                            {tab === 'VERIFICATION' && <VerificationInspector data={verificationData} />}
                            {tab === 'QUALITY' && <QualityQueue data={qualityData} />}
                        </>
                    )}
                </div>

            </div>
        </div>
    )
}
