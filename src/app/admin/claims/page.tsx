import prisma from "@/lib/prisma";
import { ClaimsTable } from "./ClaimsTable";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
    const claims = await prisma.ownerClaim.findMany({
        orderBy: { submittedAt: "desc" },
        include: {
            place: { select: { name: true, slug: true, type: true } },
            user: { select: { name: true, email: true } }
        }
    });

    const pending = claims.filter(c => c.status === "PENDING").length;

    return (
        <div className="min-h-screen bg-[#FAFAF8] p-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-200 pb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200 shadow-inner">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Claim Moderation</h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">Review and approve owner business claims for NU (ኑ).</p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100 flex flex-col items-center min-w-[120px]">
                        <span className="text-3xl font-black text-[#D4AF37]">{pending}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</span>
                    </div>
                    <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100 flex flex-col items-center min-w-[120px]">
                        <span className="text-3xl font-black text-gray-900">{claims.length}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Claims</span>
                    </div>
                </div>
            </div>

            <ClaimsTable initialClaims={claims} />
        </div>
    );
}
