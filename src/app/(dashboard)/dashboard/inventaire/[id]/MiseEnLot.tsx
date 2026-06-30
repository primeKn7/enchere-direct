"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, AlertCircle, Check, Eye, EyeOff, Tag } from "lucide-react";

const TYPES_ENCHERE = [
  { value: "ASCENDANTE", label: "Ascendante (prix croissant)" },
  { value: "DESCENDANTE", label: "Descendante (prix décroissant)" },
  { value: "SCELLEE", label: "Scellée (offre unique secrète)" },
  { value: "VENTE_DIRECTE", label: "Vente directe" },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TYPES_ENCHERE.map((t) => [t.value, t.label])
);

type Lot = {
  id: string;
  numeroLot: string;
  prixDepart: number;
  typeEnchere: string;
  publie: boolean;
};

export default function MiseEnLot({
  bienId,
  canPublier,
  dossierValide,
  valeurEstimee,
  lot,
}: {
  bienId: string;
  canPublier: boolean;
  dossierValide: boolean;
  valeurEstimee: number;
  lot: Lot | null;
}) {
  const router = useRouter();
  const [prixDepart, setPrixDepart] = useState(
    valeurEstimee ? String(valeurEstimee) : ""
  );
  const [typeEnchere, setTypeEnchere] = useState("ASCENDANTE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function creerLot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bienId,
          prixDepart: prixDepart.trim().replace(/\s/g, "").replace(",", "."),
          typeEnchere,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Échec de la mise en lot.");
        setLoading(false);
        return;
      }
      setLoading(false);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  async function togglePublication(publie: boolean) {
    if (!lot) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/lots/${lot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publie }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Action impossible.");
        setLoading(false);
        return;
      }
      setLoading(false);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Gavel size={22} className="text-[var(--accent)]" />
        <h3 className="text-lg font-semibold text-[var(--ink)]">Mise en lot</h3>
      </div>

      {error && (
        <div className="alert alert-danger mb-4 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Cas 1 : un lot existe déjà */}
      {lot ? (
        <div className="glass-surface p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-[var(--accent)]" />
              <span className="font-mono font-semibold text-[var(--ink)]">{lot.numeroLot}</span>
              {lot.publie ? (
                <span className="badge badge-success">Publié au catalogue</span>
              ) : (
                <span className="badge badge-warning">Non publié</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
                Mise à prix
              </span>
              <p className="text-[var(--ink)] font-semibold mt-0.5">
                {lot.prixDepart.toLocaleString("fr-FR")} FCFA
              </p>
            </div>
            <div>
              <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
                Type d&apos;enchère
              </span>
              <p className="text-[var(--ink)] font-medium mt-0.5">
                {TYPE_LABELS[lot.typeEnchere] ?? lot.typeEnchere}
              </p>
            </div>
          </div>

          {canPublier ? (
            lot.publie ? (
              <button
                type="button"
                onClick={() => togglePublication(false)}
                disabled={loading}
                className="btn btn-ghost"
              >
                <EyeOff size={16} /> {loading ? "…" : "Retirer du catalogue"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => togglePublication(true)}
                disabled={loading}
                className="btn btn-gold"
              >
                <Eye size={16} /> {loading ? "…" : "Publier au catalogue (mise en vente)"}
              </button>
            )
          ) : (
            <p className="text-sm text-[var(--ink-muted)]">
              Seul un commissaire-priseur peut publier ce lot au catalogue.
            </p>
          )}
        </div>
      ) : !dossierValide ? (
        /* Cas 2 : pas de lot, mais le dossier n'est pas validé */
        <div className="glass-surface p-6 flex items-start gap-2">
          <AlertCircle size={18} className="text-[var(--warning)] mt-0.5 shrink-0" />
          <p className="text-sm text-[var(--ink-muted)]">
            Le dossier de saisie doit être <strong>validé</strong> par un magistrat avant de pouvoir
            créer un lot pour ce bien.
          </p>
        </div>
      ) : (
        /* Cas 3 : pas de lot, dossier validé → formulaire de création */
        <form onSubmit={creerLot} className="glass-surface p-6 space-y-4 max-w-xl">
          <p className="text-sm text-[var(--ink-muted)]">
            Créez le lot à partir de ce bien. Il sera enregistré <strong>non publié</strong> ; vous
            pourrez ensuite le publier au catalogue pour le mettre en vente.
          </p>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">
              Mise à prix (FCFA)
            </label>
            <input
              type="text"
              inputMode="numeric"
              className="input"
              value={prixDepart}
              onChange={(e) => setPrixDepart(e.target.value)}
              placeholder="Ex : 4500000"
              required
            />
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Valeur de référence du bien : {valeurEstimee.toLocaleString("fr-FR")} FCFA.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">
              Type d&apos;enchère
            </label>
            <select
              className="input"
              value={typeEnchere}
              onChange={(e) => setTypeEnchere(e.target.value)}
            >
              {TYPES_ENCHERE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn btn-gold">
            <Check size={16} /> {loading ? "Création…" : "Créer le lot"}
          </button>
        </form>
      )}
    </div>
  );
}
