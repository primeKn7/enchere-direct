"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role, StatutDossier } from "@prisma/client";
import { AlertCircle, Check, X, ShieldCheck } from "lucide-react";
import {
  STATUT_DOSSIER_LABELS,
  transitionsAutorisees,
} from "@/lib/dossier-statuts";

// Apparence du bouton selon le statut cible.
const TARGET_STYLE: Record<StatutDossier, string> = {
  VALIDE: "btn btn-gold",
  CONFORME: "btn btn-ghost",
  NON_CONFORME: "btn",
  CLOTURE: "btn btn-ghost",
  EN_ATTENTE: "btn btn-ghost",
};

const DANGER_TARGETS: StatutDossier[] = ["NON_CONFORME"];

export default function StatutActions({
  dossierId,
  role,
  current,
}: {
  dossierId: string;
  role: Role;
  current: StatutDossier;
}) {
  const router = useRouter();
  // Statut courant suivi localement pour une mise à jour optimiste instantanée
  // (on ne dépend pas du refresh serveur, plus lent, pour rafraîchir l'UI).
  const [statut, setStatut] = useState<StatutDossier>(current);
  const [pending, setPending] = useState<StatutDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<StatutDossier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targets = transitionsAutorisees(role, statut);

  async function submit(cible: StatutDossier) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/saisies/${dossierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: cible }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Échec de l'opération.");
        setLoading(false);
        return;
      }
      // Mise à jour optimiste : l'UI reflète le nouveau statut tout de suite.
      setStatut(cible);
      setDone(cible);
      setPending(null);
      setLoading(false);
      // Resynchronise le badge parent + le journal d'audit en arrière-plan.
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  if (targets.length === 0) {
    // Plus aucune transition possible : on confirme juste la dernière opération.
    return done ? (
      <div className="glass-surface p-6 mb-8 flex items-center gap-2">
        <Check size={18} className="text-[var(--accent)]" />
        <span className="text-sm text-[var(--ink)]">
          Statut mis à jour :{" "}
          <span className="font-semibold">{STATUT_DOSSIER_LABELS[done]}</span>
        </span>
      </div>
    ) : null;
  }

  return (
    <div className="glass-surface p-6 space-y-4 mb-8">
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-[var(--accent)]" />
        <h3 className="text-[var(--ink)] font-semibold">Changer le statut du dossier</h3>
      </div>

      {error && (
        <div className="alert alert-danger flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {done && !error && pending === null && (
        <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
          <Check size={15} className="text-[var(--accent)]" />
          Statut passé à{" "}
          <span className="font-semibold text-[var(--ink)]">{STATUT_DOSSIER_LABELS[done]}</span>.
        </div>
      )}

      {pending === null ? (
        <div className="flex flex-wrap gap-3">
          {targets.map((cible) => {
            const danger = DANGER_TARGETS.includes(cible);
            return (
              <button
                key={cible}
                type="button"
                onClick={() => setPending(cible)}
                className={TARGET_STYLE[cible]}
                style={danger ? { background: "var(--danger)", color: "#fff" } : undefined}
              >
                {STATUT_DOSSIER_LABELS[cible]}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ink-muted)]">
            Confirmer le passage du dossier à{" "}
            <span className="font-semibold text-[var(--ink)]">
              « {STATUT_DOSSIER_LABELS[pending]} »
            </span>{" "}
            ? Cette action est tracée dans le journal d&apos;audit.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => submit(pending)}
              disabled={loading}
              className={TARGET_STYLE[pending]}
              style={
                DANGER_TARGETS.includes(pending)
                  ? { background: "var(--danger)", color: "#fff" }
                  : undefined
              }
            >
              <Check size={16} /> {loading ? "…" : "Confirmer"}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              disabled={loading}
              className="btn btn-ghost"
            >
              <X size={16} /> Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
