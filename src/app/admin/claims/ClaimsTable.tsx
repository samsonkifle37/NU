"use client";

import { useState } from "react";
import { Check, X, Eye, ShieldAlert, BadgeCheck, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ClaimRecord {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    proofNote: string | null;
    status: string;
    relationship: string;
    submittedAt: Date;
    place: {
        name: string;
        slug: string;
        type: string;
    };
    user: {
        name: string;
        email: string;
    } | null;
}

export function ClaimsTable({ initialClaims }: { initialClaims: any[] }) {
    const [claims, setClaims] = useState<ClaimRecord[]>(initialClaims);

    const handleAction = async (id: string, action: "approve" | "reject") => {
        if (!confirm(`Are you sure you want to ${action} this claim?`)) return;

        try {
            const res = await fetch(`/api/admin/claims/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });

            if (!res.ok) throw new Error("Action failed");

            const data = await res.json();
            setClaims(claims.map(c => c.id === id ? { ...c, status: data.status } : c));
            alert(`Claim successfully ${action}d!`);
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        }
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto min-h-[500px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Place</th>
                            <th className="px-6 py-4">Claimant</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Proof Note</th>
                            <th className="px-6 py-4">Submitted</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/60">
                        {claims.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-20 text-gray-400 font-medium">No claims found.</td>
                            </tr>
                        ) : claims.map(claim => (
                            <tr key={claim.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        claim.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                                        claim.status === "REJECTED" ? "bg-red-100 text-red-700" :
                                        "bg-amber-100 text-amber-700"
                                    }`}>
                                        {claim.status === "APPROVED" && <BadgeCheck className="w-3.5 h-3.5" />}
                                        {claim.status === "REJECTED" && <X className="w-3.5 h-3.5" />}
                                        {claim.status === "PENDING" && <Clock className="w-3.5 h-3.5" />}
                                        {claim.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900">{claim.place.name}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-black uppercase tracking-widest">{claim.place.type}</span>
                                            <Link href={`/place/${claim.place.slug}`} target="_blank" className="text-[10px] text-blue-500 font-bold hover:underline inline-flex items-center gap-1">
                                                View Page <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800">{claim.fullName}</span>
                                        <span className="text-xs text-gray-500">{claim.relationship}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col text-xs text-gray-600 space-y-1">
                                        <span>{claim.email}</span>
                                        <span>{claim.phone}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="max-w-[200px] overflow-hidden">
                                        <p className="text-xs text-gray-500 truncate" title={claim.proofNote || ""}>
                                            {claim.proofNote || "None provided"}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-xs text-gray-400 font-medium">
                                    {new Date(claim.submittedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {claim.status === "PENDING" && (
                                            <>
                                                <button onClick={() => handleAction(claim.id, "approve")} title="Approve" className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shadow-sm">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleAction(claim.id, "reject")} title="Reject" className="w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shadow-sm">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {claim.status !== "PENDING" && (
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resolved</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
