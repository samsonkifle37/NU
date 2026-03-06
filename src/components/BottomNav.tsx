"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    BedDouble,
    Map,
    Car,
    User,
    Compass,
} from "lucide-react";

const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/stays", icon: BedDouble, label: "Stays" },
    { href: "/tours", icon: Map, label: "Tours" },
    { href: "/transport", icon: Car, label: "Trans" },
    { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
            <div className="max-w-lg mx-auto flex justify-around items-center py-2">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive =
                        href === "/" ? pathname === "/" : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-2xl transition-all duration-300 ${isActive
                                ? "text-ethiopia-green"
                                : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            <Icon
                                className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : ""
                                    }`}
                                strokeWidth={isActive ? 2.5 : 1.5}
                            />
                            <span
                                className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? "text-ethiopia-green" : ""
                                    }`}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
