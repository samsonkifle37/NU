"use client";

import Link from "next/link";
import { ArrowLeft, Phone, MapPin, ShieldAlert, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const EMERGENCY_NUMBERS = [
  { key: "police",        number: "991",           icon: "\ud83d\ude94", color: "bg-blue-50  border-blue-100",    text: "text-blue-600"   },
  { key: "ambulance",     number: "907",           icon: "\ud83d\ude91", color: "bg-red-50   border-red-100",     text: "text-red-600"    },
  { key: "fire",          number: "939",           icon: "\ud83d\ude92", color: "bg-orange-50 border-orange-100", text: "text-orange-600" },
  { key: "touristPolice", number: "+251116629987", icon: "\ud83d\udc6e", color: "bg-green-50 border-green-100",   text: "text-green-700"  },
];

const EMBASSIES = [
  { country: "\ud83c\uddfa\ud83c\uddf8 United States", phone: "+251 11 130 6000", address: "Entoto St, Addis Ababa" },
  { country: "\ud83c\uddec\ud83c\udde7 United Kingdom", phone: "+251 11 617 0100", address: "Comoros St, Addis Ababa" },
  { country: "\ud83c\udde8\ud83c\uddf3 China",          phone: "+251 11 371 1960", address: "Jimma Road, Addis Ababa" },
  { country: "\ud83c\udde9\ud83c\uddea Germany",        phone: "+251 11 123 5139", address: "Yeka Sub-City, Addis Ababa" },
  { country: "\ud83c\uddeb\ud83c\uddf7 France",         phone: "+251 11 123 1622", address: "Kebena, Addis Ababa" },
  { country: "\ud83c\uddf8\ud83c\udde6 Saudi Arabia",   phone: "+251 11 551 8844", address: "Woreda 18, Addis Ababa" },
];

export default function EmergencyPage() {
  const { tr } = useLanguage();

  const openHospitalMap = () =>
    window.open("https://maps.google.com?q=hospitals+near+me+Addis+Ababa", "_blank");
  const openWhatsApp = () =>
    window.open("https://wa.me/251900000000?text=Hi%2C%20I%20need%20help%20with%20my%20NU%20app%20trip", "_blank");

  return (
    <div className="space-y-6 pt-4 pb-24 px-1">
      {/* Header */}
      <header>
        <Link href="/profile" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition mb-3">
          <ArrowLeft className="w-3 h-3" /> {tr("emergency","back")}
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">{tr("emergency","title")}</h1>
            <p className="text-[10px] text-gray-400 font-medium">{tr("emergency","subtitle")}</p>
          </div>
        </div>
      </header>

      {/* Emergency Numbers */}
      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 px-1">{tr("emergency","numbersHeading")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {EMERGENCY_NUMBERS.map(({ key, number, icon, color, text }) => (
            <a key={key} href={`tel:${number}`}
              className={`${color} border rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform`}>
              <span className="text-3xl">{icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">{tr("emergency", key)}</span>
              <span className={`text-lg font-black ${text}`}>{number}</span>
              <div className="flex items-center gap-1 bg-white/80 rounded-lg px-2 py-1">
                <Phone className="w-3 h-3 text-gray-400" />
                <span className="text-[9px] font-bold text-gray-500">{tr("emergency","tapToCall")}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Hospital Finder */}
      <section>
        <button onClick={openHospitalMap}
          className="w-full bg-[#1A1612] text-white rounded-2xl p-5 flex items-center gap-4 hover:bg-gray-900 transition active:scale-95">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-[#C9973B]" />
          </div>
          <div className="text-left">
            <p className="font-black text-base">{tr("emergency","findHospital")}</p>
            <p className="text-white/50 text-xs">{tr("emergency","openMaps")}</p>
          </div>
        </button>
      </section>

      {/* Embassies */}
      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 px-1">{tr("emergency","embassiesHeading")}</h2>
        <div className="space-y-2">
          {EMBASSIES.map(({ country, phone, address }) => (
            <a key={country} href={`tel:${phone.replace(/\s/g,"")}`}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 hover:bg-gray-50 active:scale-[0.99] transition-all">
              <div>
                <p className="text-sm font-bold text-gray-900">{country}</p>
                <p className="text-[10px] text-gray-400 font-medium">{address}</p>
              </div>
              <div className="flex items-center gap-1 text-[#C9973B]">
                <Phone className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{phone}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* NU Support */}
      <section>
        <button onClick={openWhatsApp}
          className="w-full bg-[#25D366] text-white rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 active:scale-95 transition-all">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="font-black text-base">{tr("emergency","nuSupport")}</p>
            <p className="text-white/70 text-xs">{tr("emergency","nuSupportDesc")}</p>
          </div>
        </button>
      </section>
    </div>
  );
}
