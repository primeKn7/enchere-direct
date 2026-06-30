"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function LanguageToggle({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { lang, toggle } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}
      title={lang === "fr" ? "Switch to English" : "Passer en français"}
      className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-[var(--radius-md)] text-[13px] font-semibold transition-colors"
      style={
        variant === "dark"
          ? { color: "#fff", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)" }
          : { color: "var(--ink)", background: "transparent", border: "1.5px solid var(--border-strong)" }
      }
    >
      <Globe size={14} />
      {lang.toUpperCase()}
    </button>
  );
}
