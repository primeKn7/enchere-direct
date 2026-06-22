"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, MapPin, Tag } from "lucide-react";
import { AuctionCard } from "@/components/marketing/AuctionCard";
import EmptyState from "@/components/ui/EmptyState";
import { demoAuctions } from "@/lib/demo-data";

const COUNTRIES = [
  { key: "", name: "Tous les pays" },
  { key: "benin", name: "Bénin" },
  { key: "togo", name: "Togo" },
  { key: "ghana", name: "Ghana" },
  { key: "nigeria", name: "Nigeria" },
  { key: "cote_ivoire", name: "Côte d'Ivoire" },
  { key: "senegal", name: "Sénégal" },
  { key: "burkina_faso", name: "Burkina Faso" },
];

const CATEGORIES = [
  { key: "", name: "Toutes les catégories" },
  { key: "vehicules", name: "Véhicules" },
  { key: "immobilier", name: "Immobilier" },
  { key: "bijoux", name: "Bijoux / Or" },
  { key: "art", name: "Art / Antiquités" },
  { key: "electronique", name: "Électronique" },
  { key: "meubles", name: "Meubles" },
  { key: "machines", name: "Machines" },
  { key: "autres", name: "Autres" },
];

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function CatalogueContent({ basePath = "/catalogue" }: { basePath?: string }) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [type, setType] = useState<"" | "judiciaire" | "volontaire">("");

  const filteredAuctions = useMemo(() => {
    return demoAuctions.filter((a) => {
      if (search && !normalize(a.title).includes(normalize(search))) return false;
      if (country && a.countryKey !== country) return false;
      if (category && a.categoryKey !== category) return false;
      if (maxPrice && a.currentPrice > Number(maxPrice)) return false;
      if (type && a.type !== type) return false;
      return true;
    });
  }, [search, country, category, maxPrice, type]);

  return (
    <div>
      <h1 className="mb-2">Catalogue des ventes</h1>
      <p className="text-[14px] mb-8" style={{ color: "var(--ink-muted)" }}>
        Découvrez les biens disponibles aux enchères
      </p>

      <div className="card p-6 mb-8">
        <div className="flex items-center gap-2 mb-5" style={{ color: "var(--ink)" }}>
          <SlidersHorizontal size={16} />
          <h4>Filtres</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--ink-secondary)" }}>
              Recherche
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--ink-muted)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom du lot..."
                className="input pl-9"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--ink-secondary)" }}>
              Pays
            </label>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--ink-muted)" }}
              />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input pl-9"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--ink-secondary)" }}>
              Catégorie
            </label>
            <div className="relative">
              <Tag
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--ink-muted)" }}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input pl-9"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--ink-secondary)" }}>
              Prix max (XOF)
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Ex: 10000000"
              className="input"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--ink-secondary)" }}>
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "" | "judiciaire" | "volontaire")}
              className="input"
            >
              <option value="">Tous</option>
              <option value="judiciaire">Judiciaire</option>
              <option value="volontaire">Volontaire</option>
            </select>
          </div>
        </div>
      </div>

      {filteredAuctions.length === 0 ? (
        <EmptyState
          title="Aucun résultat"
          description="Aucune enchère ne correspond à vos critères de recherche. Essayez d'élargir vos filtres ou de modifier votre recherche."
          illustration="search"
        />
      ) : (
        <>
          <p className="text-[12px] mb-4" style={{ color: "var(--ink-muted)" }}>
            {filteredAuctions.length} résultat(s)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} basePath={basePath} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
