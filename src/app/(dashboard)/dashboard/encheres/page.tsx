"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Clock, Gavel, Plus } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { useSession } from "next-auth/react";

interface Enchere {
  id: string;
  montantActuel: string;
  statut: string;
  dateFin: string;
  lot: {
    bien: {
      description: string;
      localisation: string;
    };
  };
}

export default function EncheresPage() {
  const { data: session } = useSession();
  const [encheres, setEncheres] = useState<Enchere[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [scope, setScope] = useState<"all" | "mine">("all");

  const role = session?.user?.role;
  const canCreate = role === "COMMISSAIRE_PRISEUR" || role === "ADMINISTRATEUR";
  // L'onglet « Mes enchères » (participation) ne concerne que les enchérisseurs.
  const canFilterMine = role === "CITOYEN" || role === "ENTREPRISE";

  useEffect(() => {
    setLoaded(false);
    const url = scope === "mine" && canFilterMine ? "/api/encheres?mine=true" : "/api/encheres";
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        setEncheres(json.data ?? []);
        setLoaded(true);
      });
  }, [scope, canFilterMine]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Gavel size={28} className="text-[var(--accent)]" />
          <h1 className="text-[var(--ink)]">Enchères</h1>
        </div>
        {canCreate && (
          <Link href="/dashboard/encheres/nouveau" className="btn btn-primary">
            <Plus size={16} /> Nouvelle enchère
          </Link>
        )}
      </div>

      {canFilterMine && (
        <div className="seg w-full sm:w-auto mb-6" role="tablist" aria-label="Filtre des enchères">
          <button
            type="button"
            role="tab"
            aria-selected={scope === "all"}
            onClick={() => setScope("all")}
            className={`seg-btn px-4 sm:px-7 ${scope === "all" ? "active" : ""}`}
          >
            Toutes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "mine"}
            onClick={() => setScope("mine")}
            className={`seg-btn px-4 sm:px-7 ${scope === "mine" ? "active" : ""}`}
          >
            Mes enchères
          </button>
        </div>
      )}

      {loaded && encheres.length === 0 ? (
        <EmptyState
          title={scope === "mine" ? "Vous ne participez à aucune enchère" : "Aucune enchère pour le moment"}
          description={
            scope === "mine"
              ? "Les enchères sur lesquelles vous avez déposé une offre apparaîtront ici."
              : "Les enchères publiées par les commissaires-priseurs apparaîtront ici. Consultez le catalogue pour suivre les prochaines ventes."
          }
          illustration="auction"
          action={{ label: "Voir le catalogue", href: "/dashboard/catalogue" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Bien</th>
                <th>Localisation</th>
                <th>Montant actuel</th>
                <th>Clôture</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {encheres.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link
                      href={`/dashboard/encheres/${e.id}`}
                      className="text-[14px] font-medium hover:underline"
                      style={{ color: "var(--ink)" }}
                    >
                      {e.lot.bien.description.slice(0, 60)}
                    </Link>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-[14px]" style={{ color: "var(--ink-secondary)" }}>
                      <MapPin size={12} />
                      {e.lot.bien.localisation}
                    </span>
                  </td>
                  <td className="text-price">{e.montantActuel} FCFA</td>
                  <td>
                    <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--ink-muted)" }}>
                      <Clock size={12} />
                      {new Date(e.dateFin).toLocaleDateString("fr-FR")}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      e.statut === "EN_COURS" || e.statut === "PROLONGEE" ? "badge-success" : "badge-subtle"
                    }`}>
                      {e.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
