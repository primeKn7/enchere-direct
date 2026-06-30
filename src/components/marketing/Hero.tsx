"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Tag, Search } from "lucide-react";
import TrustStats from "@/components/ui/TrustStats";
import { useT } from "@/components/providers/LanguageProvider";

const COUNTRY_KEYS = ["benin", "togo", "ghana", "nigeria", "cote_ivoire", "senegal", "burkina_faso"];
const CATEGORY_KEYS = ["vehicules", "immobilier", "bijoux", "art", "electronique", "meubles", "machines", "autres"];

export function Hero() {
  const t = useT();
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (category) params.set("category", category);
    if (maxPrice) params.set("maxPrice", maxPrice);
    const q = params.toString();
    return `/catalogue${q ? `?${q}` : ""}`;
  };

  return (
    <section
      className="relative overflow-hidden lg:min-h-[88vh]"
      style={{
        background:
          "radial-gradient(120% 130% at 0% 0%, rgba(10,42,56,0.95) 0%, rgba(10,42,56,0) 52%), linear-gradient(to left, #1A5A7A 0%, #0F3C4D 55%, #0A2A38 100%)",
      }}
    >
      {/* Texture plein écran — desktop uniquement (comportement d'origine) */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none hidden lg:block"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div
        className="container-app relative pt-20 pb-[45px] lg:py-28"
        style={{ paddingInline: "clamp(1.5rem, 4vw, 2.25rem)" }}
      >
        {/* Texture bornée au conteneur — mobile uniquement (finit où le conteneur finit) */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none lg:hidden"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: text + search */}
          <div className="marketing">
            <div className="eyebrow-pill mb-6">
              <span className="dot" />
              {t("hero.badge")}
            </div>

            <h1 className="mb-4">
              {t("hero.title1")}<br />
              {t("hero.title2")} <span style={{ color: "var(--accent-gold)" }}>{t("hero.titleGold")}</span>
            </h1>

            <p className="text-[16px] mb-8" style={{ color: "rgba(255,255,255,0.70)", maxWidth: "460px" }}>
              {t("hero.subtitle")}
            </p>

            {/* Search bar — carte blanche */}
            <div
              className="p-5 w-full mt-6 sm:mt-0"
              style={{
                background: "#ffffff",
                borderRadius: "var(--radius-xl)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <p
                className="text-[12px] font-semibold mb-4"
                style={{ color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                {t("hero.quickSearch")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {/* Pays */}
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--ink-muted)" }}>
                    {t("hero.fieldCountry")}
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 z-10" style={{ color: "var(--ink-muted)" }} />
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className="input pl-9 w-full">
                      <option value="">{t("filter.allCountries")}</option>
                      {COUNTRY_KEYS.map((k) => (
                        <option key={k} value={k}>{t(`country.${k}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--ink-muted)" }}>
                    {t("hero.fieldCategory")}
                  </label>
                  <div className="relative">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 z-10" style={{ color: "var(--ink-muted)" }} />
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="input pl-9 w-full">
                      <option value="">{t("filter.allCategories")}</option>
                      {CATEGORY_KEYS.map((k) => (
                        <option key={k} value={k}>{t(`category.${k}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Prix max */}
                <div className="col-span-2 order-first sm:col-span-1 sm:order-none">
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--ink-muted)" }}>
                    {t("hero.fieldPrice")}
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="10 000 000"
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Bouton en bas — aligné à droite (extrémité de Catégorie) sur mobile, pleine largeur sur desktop */}
              <div className="flex justify-end sm:block">
                <Link href={buildSearchUrl()} className="btn btn-gold btn-lg w-[60%] sm:w-full justify-center">
                  <Search size={16} />
                  {t("hero.searchLot")}
                </Link>
              </div>
            </div>

            {/* Trust stats */}
            <TrustStats />
          </div>

          {/* Right: illustration (desktop only) */}
          <div className="hidden lg:flex justify-center items-center">
            <div
              className="relative rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                width: "100%",
                maxWidth: "440px",
                height: "420px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div className="text-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(253,193,52,0.15)" }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                    <path d="M13 19l6-6" />
                    <path d="M3 21h18" />
                    <path d="M9.5 9.5L12 7" />
                    <path d="M12 7l3-3" />
                  </svg>
                </div>
                <p className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.80)" }}>
                  {t("home.latestSales")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
