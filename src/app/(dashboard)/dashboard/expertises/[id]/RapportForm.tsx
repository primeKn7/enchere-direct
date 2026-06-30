"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Send } from "lucide-react";

export default function RapportForm({
  affectationId,
  initial,
}: {
  affectationId: string;
  initial?: { valeurEstimee: string; methodologie: string; contenu: string };
}) {
  const router = useRouter();
  const [valeurEstimee, setValeurEstimee] = useState(initial?.valeurEstimee ?? "");
  const [methodologie, setMethodologie] = useState(initial?.methodologie ?? "");
  const [contenu, setContenu] = useState(initial?.contenu ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/expertises/${affectationId}/rapport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // On normalise la valeur : pas d'espaces ni de séparateurs de milliers,
          // virgule décimale convertie en point (sinon la validation échoue).
          valeurEstimee: valeurEstimee.trim().replace(/\s/g, "").replace(",", "."),
          methodologie: methodologie || undefined,
          contenu,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // L'erreur Zod est un objet { fieldErrors, formErrors } : on en extrait
        // le premier message lisible au lieu d'afficher un échec générique.
        let msg = "Échec de l'envoi du rapport.";
        if (typeof json.error === "string") {
          msg = json.error;
        } else if (json.error?.fieldErrors) {
          const first = Object.values(json.error.fieldErrors as Record<string, string[]>)
            .flat()
            .find(Boolean);
          if (first) msg = first;
        } else if (json.error?.formErrors?.length) {
          msg = json.error.formErrors[0];
        }
        setError(msg);
        setLoading(false);
        return;
      }
      // Succès : on réinitialise l'état du bouton et on confirme. Le rapport soumis
      // s'affiche au-dessus du formulaire après le rafraîchissement serveur.
      setLoading(false);
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-surface p-6 space-y-5">
      {error && (
        <div className="alert alert-danger flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {success && !error && (
        <div className="alert alert-success flex items-center gap-2">
          <Check size={16} /> Rapport soumis avec succès. Il est en attente de validation.
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">
          Valeur estimée (FCFA)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="input"
          value={valeurEstimee}
          onChange={(e) => setValeurEstimee(e.target.value)}
          placeholder="Ex : 4500000"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">
          Méthodologie <span className="text-[var(--ink-muted)] font-normal">(optionnelle)</span>
        </label>
        <input
          type="text"
          className="input"
          value={methodologie}
          onChange={(e) => setMethodologie(e.target.value)}
          placeholder="Ex : comparaison de marché, valeur à neuf décotée…"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">
          Rapport d&apos;expertise
        </label>
        <textarea
          className="input"
          rows={8}
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder="Description détaillée de l'état, des caractéristiques et de la justification de la valeur…"
          required
        />
        <p className="text-xs text-[var(--ink-muted)] mt-1">
          {contenu.trim().length < 20
            ? `Encore ${20 - contenu.trim().length} caractère(s) minimum.`
            : `${contenu.length} caractères.`}
        </p>
      </div>

      <button type="submit" disabled={loading} className="btn btn-gold btn-lg w-full justify-center">
        <Send size={16} /> {loading ? "Envoi…" : "Soumettre le rapport"}
      </button>
    </form>
  );
}
