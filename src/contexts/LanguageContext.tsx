"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, tr } from "@/lib/i18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  tr: (section: keyof typeof translations["en"], key: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  tr: (_s, key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nu_language") as Language | null;
      if (saved === "en" || saved === "am") setLang(saved);
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLang(lang);
    try { localStorage.setItem("nu_language", lang); } catch {}
  };

  const translate = (section: keyof typeof translations["en"], key: string) =>
    tr(language, section, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, tr: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
