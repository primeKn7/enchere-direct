"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Tag, SlidersHorizontal, X, Calendar, LayoutGrid, List, Map as MapIcon } from "lucide-react";
import { AuctionCard, type DemoAuction } from "@/components/marketing/AuctionCard";
import EmptyState from "@/components/ui/EmptyState";
import { demoAuctions } from "@/lib/demo-data";
import { useT } from "@/components/providers/LanguageProvider";

// La carte Leaflet manipule `window` : chargement client uniquement.
const LotsMap = dynamic(() => import("./LotsMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-[var(--radius-lg)] flex items-center justify-center"
      style={{ height: "520px", background: "var(--surface-sunken)", border: "1px solid var(--border)" }}
    >
      <span className="text-[13px]" style={{ color: "var(--ink-muted)" }}>Chargement de la carte…</span>
    </div>
  ),
});

const COUNTRY_KEYS = ["benin", "togo", "ghana", "nigeria", "cote_ivoire", "senegal", "burkina_faso"];
const CATEGORY_KEYS = ["vehicules", "immobilier", "bijoux", "art", "electronique", "meubles", "machines", "autres"];

type ViewMode = "gallery" | "list" | "map";

function normalize(str: string) {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function CatalogueContent({
  basePath = "/catalogue",
  auctions,
}: {
  basePath?: string;
  /** Lots réels publiés. Si non fourni ou vide, on retombe sur les données démo. */
  auctions?: DemoAuction[];
}) {
  const t = useT();
  const sourceAuctions = auctions && auctions.length > 0 ? auctions : demoAuctions;
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [type, setType] = useState<"" | "judiciaire" | "volontaire">("");
  const [dateFrom, setDateFrom] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("gallery");

  const filteredAuctions = useMemo(() => {
    return sourceAuctions.filter((a) => {
      if (search) {
        const q = normalize(search);
        const haystack = `${a.title} ${a.description} ${a.location} ${a.country} ${a.category}`;
        if (!normalize(haystack).includes(q)) return false;
      }
      if (country && a.countryKey !== country) return false;
      if (category && a.categoryKey !== category) return false;
      if (maxPrice && a.currentPrice > Number(maxPrice)) return false;
      if (type && a.type !== type) return false;
      if (dateFrom && a.scheduleDate < dateFrom) return false;
      return true;
    });
  }, [sourceAuctions, search, country, category, maxPrice, type, dateFrom]);

  const hasFilters = Boolean(search || country || category || maxPrice || type || dateFrom);
  const count = filteredAuctions.length;

  function clearFilters() {
    setSearch(""); setCountry(""); setCategory(""); setMaxPrice(""); setType(""); setDateFrom("");
  }

  const views: { key: ViewMode; label: string; icon: React.ElementType }[] = [
    { key: "gallery", label: t("cat.viewGallery"), icon: LayoutGrid },
    { key: "list", label: t("cat.viewList"), icon: List },
    { key: "map", label: t("cat.viewMap"), icon: MapIcon },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="mb-3">
          <span className="eyebrow-pill">{t("cat.eyebrow")}</span>
        </div>
        <h1 className="text-[28px] font-bold mb-1" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
          {t("cat.title")}
        </h1>
        <p className="text-[14px]" style={{ color: "var(--ink-muted)" }}>
          {t("cat.subtitle")}
        </p>
      </div>

      {/* Filters */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <SlidersHorizontal size={15} />
            <span className="text-[13px] font-semibold">{t("cat.filters")}</span>
            {hasFilters && (
              <span className="badge badge-actif">{count} {count !== 1 ? t("cat.results") : t("cat.result")}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[12px] font-medium"
                style={{ color: "var(--danger)" }}
              >
                <X size={13} />
                {t("cat.reset")}
              </button>
            )}
            <button
              className="md:hidden text-[12px] font-medium"
              onClick={() => setFiltersOpen(!filtersOpen)}
              style={{ color: "var(--accent)" }}
            >
              {filtersOpen ? t("cat.hide") : t("cat.show")}
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${filtersOpen || "hidden md:grid"}`}>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("cat.searchPlaceholder")}
              className="input pl-9"
            />
          </div>

          {/* Country */}
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 z-10" style={{ color: "var(--ink-muted)" }} />
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="input pl-9">
              <option value="">{t("filter.allCountries")}</option>
              {COUNTRY_KEYS.map((k) => (
                <option key={k} value={k}>{t(`country.${k}`)}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="relative">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 z-10" style={{ color: "var(--ink-muted)" }} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input pl-9">
              <option value="">{t("filter.allCategories")}</option>
              {CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>{t(`category.${k}`)}</option>
              ))}
            </select>
          </div>

          {/* Max price */}
          <div>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t("hero.maxPrice")}
              className="input"
            />
          </div>

          {/* Type */}
          <div>
            <select value={type} onChange={(e) => setType(e.target.value as "" | "judiciaire" | "volontaire")} className="input">
              <option value="">{t("filter.allTypes")}</option>
              <option value="judiciaire">{t("cat.judiciaire")}</option>
              <option value="volontaire">{t("cat.volontaire")}</option>
            </select>
          </div>

          {/* Date d'enchère */}
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 z-10" style={{ color: "var(--ink-muted)" }} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input pl-9"
              aria-label={t("cat.dateFrom")}
            />
          </div>
        </div>
      </div>

      {/* Barre : compteur + sélecteur de vue */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-[13px] font-medium" style={{ color: "var(--ink-muted)" }}>
          {count} {count !== 1 ? t("cat.lotsAvailable") : t("cat.lotAvailable")}
        </p>
        <div
          className="seg w-full sm:w-auto"
          role="tablist"
          aria-label="Mode d'affichage"
        >
          {views.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={view === v.key}
                onClick={() => setView(v.key)}
                className={`seg-btn flex items-center justify-center gap-1.5 px-4 sm:px-7 ${view === v.key ? "active" : ""}`}
              >
                <Icon size={15} />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Résultats selon la vue */}
      {view === "map" ? (
        count === 0 ? (
          <EmptyState title={t("cat.emptyTitle")} description={t("cat.mapEmpty")} illustration="search" />
        ) : (
          <div>
            <p className="text-[12px] mb-3 flex items-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
              <MapIcon size={13} /> {t("cat.mapHint")}
            </p>
            <LotsMap auctions={filteredAuctions} basePath={basePath} />
          </div>
        )
      ) : count === 0 ? (
        <EmptyState title={t("cat.emptyTitle")} description={t("cat.emptyDesc")} illustration="search" />
      ) : view === "list" ? (
        <div className="flex flex-col gap-4">
          {filteredAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} basePath={basePath} layout="horizontal" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} basePath={basePath} layout="vertical" />
          ))}
        </div>
      )}
    </div>
  );
}
