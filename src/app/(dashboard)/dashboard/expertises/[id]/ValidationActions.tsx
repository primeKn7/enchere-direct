"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, X, Star } from "lucide-react";

export default function ValidationActions({ affectationId }: { affectationId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "valider" | "rejeter">("idle");
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [motifRejet, setMotifRejet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(decision: "VALIDE" | "REJETE") {
    setError(null);
    if (decision === "VALIDE" && note < 1) {
      setError("Attribuez une note de 1 à 5 à l'expert.");
      return;
    }
    if (decision === "REJETE" && !motifRejet.trim()) {
      setError("Indiquez le motif du rejet.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/expertises/${affectationId}/validation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          decision === "VALIDE"
            ? { decision, note, commentaire: commentaire || undefined }
            : { decision, motifRejet }
        ),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Échec de l'opération.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div className="glass-surface p-6 space-y-4">
      <h3 className="text-[var(--ink)] font-semibold">Validation du rapport</h3>

      {error && (
        <div className="alert alert-danger flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {mode === "idle" && (
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setMode("valider")} className="btn btn-gold" type="button">
            <Check size={16} /> Valider
          </button>
          <button onClick={() => setMode("rejeter")} className="btn btn-ghost" type="button">
            <X size={16} /> Rejeter
          </button>
        </div>
      )}

      {mode === "valider" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--ink)]">
              Note de l&apos;expert
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNote(n)}
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                  className="p-1"
                >
                  <Star
                    size={26}
                    fill={n <= note ? "var(--accent-gold)" : "none"}
                    color={n <= note ? "var(--accent-gold)" : "var(--border-strong)"}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">
              Commentaire <span className="text-[var(--ink-muted)] font-normal">(optionnel)</span>
            </label>
            <textarea
              className="input"
              rows={3}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => submit("VALIDE")} disabled={loading} className="btn btn-gold" type="button">
              <Check size={16} /> {loading ? "…" : "Confirmer la validation"}
            </button>
            <button onClick={() => setMode("idle")} className="btn btn-ghost" type="button">
              Annuler
            </button>
          </div>
        </div>
      )}

      {mode === "rejeter" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[var(--ink)]">
              Motif du rejet
            </label>
            <textarea
              className="input"
              rows={3}
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              placeholder="Expliquez pourquoi le rapport est renvoyé à l'expert…"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => submit("REJETE")}
              disabled={loading}
              className="btn"
              type="button"
              style={{ background: "var(--danger)", color: "#fff" }}
            >
              <X size={16} /> {loading ? "…" : "Confirmer le rejet"}
            </button>
            <button onClick={() => setMode("idle")} className="btn btn-ghost" type="button">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
