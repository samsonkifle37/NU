import { ArrowLeft, Smartphone, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "SIM Cards & Data — NU",
    description: "Guide to getting connected with EthioTelecom and Safaricom in Ethiopia.",
};

export default function SimPage() {
    return (
        <div className="space-y-6 pt-4 pb-12 px-1">
            <header className="space-y-2">
                <Link href="/" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-2">
                    <ArrowLeft className="w-3 h-3" /> Back Home
                </Link>
                <div className="flex items-center gap-3">
                    <Smartphone className="w-8 h-8 text-blue-500" />
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Get Connected</h1>
                </div>
            </header>

            <div className="grid gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#C9973B] rounded-[1rem] flex items-center justify-center font-black text-white text-[10px]">ET</div>
                            <h3 className="font-black text-gray-900 text-lg tracking-tight">Ethio Telecom</h3>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-ethiopia-green bg-green-50 px-3 py-1 rounded-full border border-green-100">Widest Coverage</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">The state-owned provider offering the most extensive coverage outside major cities. Best choice if you plan to travel deep into rural areas.</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-[1rem] flex items-center justify-center font-black text-white text-[10px]">SF</div>
                            <h3 className="font-black text-gray-900 text-lg tracking-tight">Safaricom Ethiopia</h3>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Fast 4G/5G</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">The new private operator. Offers highly competitive data packages, very fast 4G/5G in Addis Ababa and major cities, but less rural coverage.</p>
                </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-200 flex gap-4 items-start">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-200 shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-blue-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="font-black text-blue-900 text-lg">How to Buy</h3>
                    <ul className="text-sm text-blue-800/80 font-medium space-y-2 list-disc pl-4">
                        <li><strong>Where:</strong> Official shops at Bole International Airport (baggage claim or arrivals hall).</li>
                        <li><strong>Requirements:</strong> You must bring your physical Passport.</li>
                        <li><strong>Process:</strong> Registration takes 5-10 minutes. They will take a photo of your passport and you.</li>
                    </ul>
                </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-200 flex gap-4 items-start shadow-inner">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-amber-200 shrink-0">
                    <ShieldAlert className="w-6 h-6 text-amber-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="font-black text-amber-900 text-lg">Device Registration</h3>
                    <p className="text-sm text-amber-800/80 font-medium leading-relaxed">
                        Phones brought into Ethiopia are subject to network blockages after 15 to 30 days unless registered at customs. If you are staying longer than a month, ensure you declare and register your phone's IMEI.
                    </p>
                </div>
            </div>
            
            <Link href="/transport" className="w-full bg-[#1A1612] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-colors shadow-lg flex justify-center items-center gap-2">
                Explore Transport <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
        </div>
    );
}
