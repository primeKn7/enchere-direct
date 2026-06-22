"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

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
  const [encheres, setEncheres] = useState<Enchere[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/encheres")
      .then((r) => r.json())
      .then((json) => {
        setEncheres(json.data ?? []);
        setLoaded(true);
      });
  }, []);

  return (
    <div>
      <h1 className="mb-8">Enchères</h1>

      {loaded && encheres.length === 0 ? (
        <EmptyState
          title="Aucune enchère pour le moment"
          description="Les enchères publiées par les commissaires-priseurs apparaîtront ici. Consultez le catalogue pour suivre les prochaines ventes."
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
