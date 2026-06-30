"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Send } from "lucide-react";

type BienOption = {
  id: string;
  categorie: string;
  sousCategorie: string | null;
  reference: string;
};
type ExpertOption = {
  id: string;
  nom: string;
  prenom: string;
  noteMoyenne: number | null;
  nbAffectations: number;
};

export default function AffectationForm({
  biens,
  experts,
}: {
  biens: BienOption[];
  experts: ExpertOption[];
}) {
  const router = useRouter();
  const [bienId, setBienId] = useState("");
  const [expertId, setExpertId] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const [consigne, setConsigne] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!bienId || !expertId) {
      setError("Sélectionnez un bien et un expert.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/expertises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bienId,
          expertId,
          dateLimite: dateLimite ? new Date(dateLimite).toISOString() : undefined,
          consigne: consigne || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Échec de l'affectation.");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/expertises/${json.data.id}`);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-surface p-6 space-y-5 max-w-2xl">
      {error && (
        <div className="alert alert-danger flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">Bien à expertiser</label>
        <select className="input" value={bienId} onChange={(e) => setBienId(e.target.value)} required>
          <option value="">— Sélectionner un bien —</option>
          {biens.map((b) => (
            <option key={b.id} value={b.id}>
              {b.categorie}
              {b.sousCategorie ? ` / ${b.sousCategorie}` : ""} — {b.reference}
            </option>
          ))}
        </select>
        {biens.length === 0 && (
          <p className="text-xs text-[var(--ink-muted)] mt-1">Aucun bien disponible dans l&apos;inventaire.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">Expert agréé</label>
        <select className="input" value={expertId} onChange={(e) => setExpertId(e.target.value)} required>
          <option value="">— Sélectionner un expert —</option>
          {experts.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.prenom} {ex.nom}
              {ex.noteMoyenne !== null ? ` (note ${ex.noteMoyenne}/5)` : " (non noté)"} —{" "}
              {ex.nbAffectations} dossier(s)
            </option>
          ))}
        </select>
        {experts.length === 0 && (
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Aucun expert agréé enregistré. Créez un utilisateur avec le rôle Expert.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">
          Date limite <span className="text-[var(--ink-muted)] font-normal">(optionnelle)</span>
        </label>
        <input type="date" className="input" value={dateLimite} onChange={(e) => setDateLimite(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">
          Consigne <span className="text-[var(--ink-muted)] font-normal">(optionnelle)</span>
        </label>
        <textarea
          className="input"
          rows={3}
          value={consigne}
          onChange={(e) => setConsigne(e.target.value)}
          placeholder="Instructions particulières pour l'expert…"
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-gold btn-lg w-full justify-center">
        <Send size={16} /> {loading ? "Affectation…" : "Affecter l'expert"}
      </button>
    </form>
  );
}
