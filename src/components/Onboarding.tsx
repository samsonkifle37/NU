"use client";

import { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "nu_onboarding_seen_v1";

const SLIDE_KEYS = [
  { emojiFont: "noto-ethiopic", emoji: "\u1291", bg: "from-[#1A1612] to-[#2C1F10]", accent: "#C9973B",
    tKey: "s1title", sKey: "s1sub", bKey: "s1body" },
  { emoji: "\u2728", bg: "from-[#1A1A2E] to-[#0F1020]", accent: "#A78BFA",
    tKey: "s2title", sKey: "s2sub", bKey: "s2body" },
  { emoji: "\ud83c\udfe8", bg: "from-[#0D2818] to-[#071510]", accent: "#34D399",
    tKey: "s3title", sKey: "s3sub", bKey: "s3body" },
  { emoji: "\u2708\ufe0f", bg: "from-[#1A1612] to-[#2C1F10]", accent: "#C9973B",
    tKey: "s4title", sKey: "s4sub", bKey: "s4body" },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide]     = useState(0);
  const [exiting, setExiting] = useState(false);
  const { tr } = useLanguage();

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {}
  }, []);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    }, 350);
  };

  const next = () => slide < SLIDE_KEYS.length - 1 ? setSlide(s => s + 1) : dismiss();

  if (!visible) return null;
  const s = SLIDE_KEYS[slide];
  const isLast = slide === SLIDE_KEYS.length - 1;

  return (
    <div className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center transition-opacity duration-350 ${exiting ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
      <div className={`relative w-full max-w-md mx-auto bg-gradient-to-br ${s.bg} rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl`} style={{ maxHeight: "85vh" }}>
        {/* Skip */}
        <button onClick={dismiss} className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
          <X className="w-4 h-4 text-white/60" />
        </button>

        {/* Content */}
        <div className="p-8 pt-12 flex flex-col items-center text-center">
          <div className={`text-6xl mb-4 ${s.emojiFont === "noto-ethiopic" ? "" : ""}`}
            style={s.emojiFont === "noto-ethiopic" ? { fontFamily: "'Noto Sans Ethiopic', serif", fontSize: "4rem", lineHeight: 1 } : {}}>
            {s.emoji}
          </div>
          <h2 className="text-2xl font-black text-white mb-1">{tr("onboarding", s.tKey)}</h2>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: s.accent }}>
            {tr("onboarding", s.sKey)}
          </p>
          <p className="text-sm text-white/70 leading-relaxed">{tr("onboarding", s.bKey)}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 pb-2">
          {SLIDE_KEYS.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={`rounded-full transition-all duration-300 ${i === slide ? "w-6 h-2" : "w-2 h-2 bg-white/30"}`}
              style={i === slide ? { backgroundColor: s.accent } : {}} />
          ))}
        </div>

        {/* CTA */}
        <div className="px-8 pb-8 pt-2">
          <button
            onClick={next}
            className="w-full py-4 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 text-[#1A1612]"
            style={{ backgroundColor: s.accent }}
          >
            {isLast ? tr("onboarding", "start") : tr("onboarding", "next")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
