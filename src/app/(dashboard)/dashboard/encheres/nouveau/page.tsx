"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const TYPES_ENCHERE = [
  { value: "ASCENDANTE", label: "Ascendante (prix croissant)" },
  { value: "DESCENDANTE", label: "Descendante (prix décroissant)" },
  { value: "SCELLEE", label: "Scellée (offre unique secrète)" },
  { value: "VENTE_DIRECTE", label: "Vente directe" },
];

interface Lot {
  id: string;
  numeroLot: string;
  prixDepart: string;
  enchere: { id: string } | null;
  bien: {
    description: string;
    categorie: string;
    localisation: string;
  };
}

export default function NouvelleEncherePage() {
  const router = useRouter();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lots")
      .then((r) => r.json())
      .then((data) => {
        const disponibles = (Array.isArray(data) ? data : []).filter(
          (l: Lot) => !l.enchere
        );
        setLots(disponibles);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const dateDebutRaw = fd.get("dateDebut") as string;
    const dateFinRaw = fd.get("dateFin") as string;

    const body = {
      lotId: fd.get("lotId"),
      type: fd.get("type"),
      dateDebut: new Date(dateDebutRaw).toISOString(),
      dateFin: new Date(dateFinRaw).toISOString(),
      montantReserve: fd.get("montantReserve"),
      pourcentageGarantie: Number(fd.get("pourcentageGarantie")),
      antiSnipingDelai: Number(fd.get("antiSnipingDelai")),
    };

    try {
      const res = await fetch("/api/encheres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        if (typeof data.error === "string") {
          setError(data.error);
        } else if (data.error?.fieldErrors) {
          const msgs = Object.entries(data.error.fieldErrors)
            .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
            .join(" | ");
          setError(msgs || "Erreur de validation.");
        } else {
          setError("Erreur lors de la création.");
        }
        setLoading(false);
        return;
      }

      const { data } = await res.json();
      router.push(`/dashboard/encheres/${data.id}`);
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Gavel size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Créer une enchère</h1>
      </div>

      <Link
        href="/dashboard/encheres"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] mb-6"
      >
        <ArrowLeft size={14} /> Retour aux enchères
      </Link>

      {error && <div className="alert alert-danger mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="glass-surface p-6 space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">
            Lot à mettre en vente *
          </label>
          {lots.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)] py-2">
              Aucun lot disponible sans enchère. Créez d&apos;abord un lot depuis l&apos;inventaire.
            </p>
          ) : (
            <select name="lotId" required className="input">
              <option value="">Sélectionner un lot</option>
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.numeroLot} — {l.bien.description.slice(0, 55)} ({l.bien.categorie})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">
            Type d&apos;enchère *
          </label>
          <select name="type" required className="input">
            <option value="">Sélectionner</option>
            {TYPES_ENCHERE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Date de début *
            </label>
            <input
              name="dateDebut"
              type="datetime-local"
              required
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Date de clôture *
            </label>
            <input
              name="dateFin"
              type="datetime-local"
              required
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">
            Montant de réserve (FCFA) *
          </label>
          <input
            name="montantReserve"
            type="number"
            min="1"
            step="1"
            required
            className="input"
            placeholder="Ex: 500000"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Caution requise (%)
            </label>
            <input
              name="pourcentageGarantie"
              type="number"
              min="0"
              max="100"
              defaultValue="10"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Anti-sniping (secondes)
            </label>
            <input
              name="antiSnipingDelai"
              type="number"
              min="0"
              defaultValue="120"
              className="input"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || lots.length === 0}
            className="btn btn-primary"
          >
            <Save size={16} />
            {loading ? "Création en cours..." : "Créer l'enchère"}
          </button>
        </div>
      </form>
    </div>
  );
}
