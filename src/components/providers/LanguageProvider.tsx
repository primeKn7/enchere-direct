"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { translations, type Lang } from "@/lib/i18n/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  // Restaure la langue choisie depuis localStorage au montage
  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem("lang")) as Lang | null;
    if (saved === "fr" || saved === "en") {
      setLangState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lang", l);
      document.documentElement.lang = l;
    }
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "fr" ? "en" : "fr";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lang", next);
        document.documentElement.lang = next;
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string) => translations[lang][key] ?? translations.fr[key] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback hors provider : renvoie le français par défaut
    return {
      lang: "fr",
      setLang: () => {},
      toggle: () => {},
      t: (key: string) => translations.fr[key] ?? key,
    };
  }
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
