"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Gavel, MapPin, Clock, AlertCircle, ArrowRight } from "lucide-react";

interface Enchere {
  id: string;
  montantActuel: string;
  statut: string;
  dateFin: string;
  type: string;
  lot: {
    bien: {
      description: string;
      localisation: string;
    };
  };
}

export default function EnchereDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [enchere, setEnchere] = useState<Enchere | null>(null);
  const [montant, setMontant] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/encheres/${id}`)
      .then((r) => r.json())
      .then((json) => setEnchere(json.data ?? null));
  }, [id]);

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch(`/api/encheres/${id}/offres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: parseFloat(montant) }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Erreur lors du dépôt.");
      return;
    }
    setMessage("Offre déposée avec succès.");
    setMontant("");
  }

  if (!enchere) return <p className="text-[var(--ink-secondary)]">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Gavel size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Détail de l&apos;enchère</h1>
      </div>

      <div className="glass-surface p-6 space-y-4 mb-6">
        <p className="text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink)]">Description :</span>{" "}
          {enchere.lot.bien.description}
        </p>
        <p className="flex items-center gap-2 text-[var(--ink-secondary)]">
          <MapPin size={16} className="text-[var(--ink-muted)]" />
          <span className="font-medium text-[var(--ink)]">Localisation :</span>{" "}
          {enchere.lot.bien.localisation}
        </p>
        <p className="text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink)]">Type :</span> {enchere.type}
        </p>
        <p className="text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink)]">Montant actuel :</span>{" "}
          <span className="text-price">{enchere.montantActuel} FCFA</span>
        </p>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[var(--ink-muted)]" />
          <span className="font-medium text-[var(--ink)]">Clôture :</span>{" "}
          {new Date(enchere.dateFin).toLocaleString("fr-FR")}
        </div>
        <span className="badge badge-subtle">{enchere.statut}</span>
      </div>

      <div className="glass-surface p-6">
        <h2 className="text-xl font-semibold text-[var(--ink)] mb-4">
          Déposer une offre
        </h2>
        {message && (
          <div className="alert alert-success mb-4 flex items-center gap-2">
            {message}
          </div>
        )}
        {error && (
          <div className="alert alert-danger mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        <form onSubmit={submitOffer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
              Montant (FCFA)
            </label>
            <input
              type="number"
              min={Number(enchere.montantActuel) + 1}
              required
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="input"
              placeholder="Ex: 1000000"
            />
          </div>
          <button type="submit" className="btn btn-gold">
            Déposer
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
