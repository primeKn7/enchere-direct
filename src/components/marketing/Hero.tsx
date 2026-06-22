"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Car, Home, Gem, Palette, Smartphone, Sofa, Cog, Package, Search } from "lucide-react";

const COUNTRIES = [
  { key: "benin", name: "Bénin" },
  { key: "togo", name: "Togo" },
  { key: "ghana", name: "Ghana" },
  { key: "nigeria", name: "Nigeria" },
  { key: "cote_ivoire", name: "Côte d'Ivoire" },
  { key: "senegal", name: "Sénégal" },
  { key: "burkina_faso", name: "Burkina Faso" },
];

const CATEGORIES = [
  { key: "vehicules", name: "Véhicules", icon: Car },
  { key: "immobilier", name: "Immobilier", icon: Home },
  { key: "bijoux", name: "Bijoux / Or", icon: Gem },
  { key: "art", name: "Art / Antiquités", icon: Palette },
  { key: "electronique", name: "Électronique", icon: Smartphone },
  { key: "meubles", name: "Meubles", icon: Sofa },
  { key: "machines", name: "Machines", icon: Cog },
  { key: "autres", name: "Autres", icon: Package },
];

export function Hero() {
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (category) params.set("category", category);
    if (maxPrice) params.set("maxPrice", maxPrice);
    return `/catalogue?${params.toString()}`;
  };

  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      style={{ background: "var(--accent-subtle)" }}
    >
      <div className="container-app py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-[var(--ink)] mb-6">
              Saisie-vente CEDEAO
            </h1>
            <h2 className="text-xl md:text-2xl text-[var(--ink-secondary)] mb-8">
              Plateforme officielle de vente sur saisie dans l&apos;espace communautaire
            </h2>

            <div
              className="p-6 max-w-xl"
              style={{
                background: "var(--surface-primary)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">
                Recherche rapide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                    Pays
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
                    />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="input pl-9"
                    >
                      <option value="">Tous les pays</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input"
                  >
                    <option value="">Toutes</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                    Prix max
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Ex: 10000000"
                    className="input"
                  />
                </div>
              </div>

              <Link
                href={buildSearchUrl()}
                className="btn btn-primary mt-5"
              >
                <Search size={18} />
                Rechercher
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex justify-center items-center">
            <div className="relative w-full max-w-lg h-[480px]">
              <Image
                src="/images/hero-illustration.png"
                alt="Vente aux enchères en ligne"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
