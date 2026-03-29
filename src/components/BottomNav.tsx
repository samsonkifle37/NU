"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BedDouble, Map, Car, User, UtensilsCrossed } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const NAV_KEYS = [
  { href: "/",          icon: Home,            key: "home"      },
  { href: "/stays",     icon: BedDouble,       key: "stays"     },
  { href: "/tours",     icon: Map,             key: "tours"     },
  { href: "/dining",    icon: UtensilsCrossed, key: "dining"    },
  { href: "/transport", icon: Car,             key: "transport" },
  { href: "/profile",   icon: User,            key: "profile"   },
];

export function BottomNav() {
  const pathname = usePathname();
  const { tr } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="max-w-lg mx-auto flex justify-around items-center py-2">
        {NAV_KEYS.map(({ href, icon: Icon, key }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-2xl transition-all duration-300 ${
                isActive ? "text-[#D4AF37]" : "text-[#1A1A2E]/50 hover:text-[#1A1A2E]/80"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-[#D4AF37]" : ""}`}>
                {tr("nav", key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
