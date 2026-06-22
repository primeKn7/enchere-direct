"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Eye,
} from "lucide-react";

type Alerte = {
  id: string;
  type: string;
  score: number;
  details: Record<string, unknown>;
  traite: boolean;
  createdAt: string;
};

const typeLabels: Record<string, { label: string; color: string }> = {
  COLLUSION: { label: "Collusion", color: "badge-danger" },
  MULTI_COMPTE: { label: "Multi-comptes", color: "badge-warning" },
  MANIPULATION_COURS: { label: "Manipulation de cours", color: "badge-danger" },
};

export default function FraudePage() {
  const { data: session, status } = useSession();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "nonTraitees">("nonTraitees");
  const [processing, setProcessing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (
      status === "authenticated" &&
      session?.user?.role !== "AGENT_AES" &&
      session?.user?.role !== "ADMINISTRATEUR"
    ) {
      redirect("/dashboard");
    }
    if (status === "authenticated") fetchAlertes();
  }, [status, filter]);

  async function fetchAlertes() {
    setLoading(true);
    try {
      const params = filter === "nonTraitees" ? "?nonTraitees=true" : "";
      const res = await fetch(`/api/fraude${params}`);
      if (res.ok) setAlertes(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function marquerTraitee(id: string) {
    setProcessing(id);
    try {
      const res = await fetch("/api/fraude", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setAlertes((prev) => prev.map((a) => (a.id === id ? { ...a, traite: true } : a)));
      }
    } finally {
      setProcessing(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-[var(--accent)]" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Détection de fraude</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter("nonTraitees")}
          className={`badge ${filter === "nonTraitees" ? "badge-brand" : "badge-subtle"} cursor-pointer`}
        >
          <AlertTriangle size={14} /> Non traitées
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`badge ${filter === "all" ? "badge-brand" : "badge-subtle"} cursor-pointer`}
        >
          Toutes
        </button>
      </div>

      {alertes.length === 0 ? (
        <div className="card py-12 px-6 flex flex-col items-center text-center">
          <CheckCircle2 size={32} className="text-[var(--success)] mb-4" />
          <p className="text-[16px] font-medium mb-1" style={{ color: "var(--ink)" }}>
            {filter === "nonTraitees" ? "Aucune alerte non traitée" : "Aucune alerte de fraude"}
          </p>
          <p className="text-[14px]" style={{ color: "var(--ink-muted)" }}>
            {filter === "nonTraitees"
              ? "Toutes les alertes ont été traitées. Le système continue de surveiller les activités suspectes."
              : "Aucune activité suspecte détectée. Le système de détection est actif et surveille les transactions."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alertes.map((a) => {
            const typeInfo = typeLabels[a.type] ?? { label: a.type, color: "badge-subtle" };
            return (
              <div key={a.id} className="glass-surface p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${typeInfo.color}`}>{typeInfo.label}</span>
                    <span className="text-sm text-[var(--ink-muted)]">
                      Score : <span className="font-semibold text-[var(--ink)]">{(a.score * 100).toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm text-[var(--ink-muted)]">
                      <Calendar size={14} />
                      {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    {a.traite ? (
                      <span className="badge badge-success">Traitée</span>
                    ) : (
                      <button
                        onClick={() => marquerTraitee(a.id)}
                        disabled={processing === a.id}
                        className="btn-primary text-sm py-1 px-3"
                      >
                        {processing === a.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Marquer traitée
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                  className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
                >
                  <Eye size={14} />
                  {expanded === a.id ? "Masquer" : "Voir"} les détails
                </button>
                {expanded === a.id && (
                  <pre className="mt-3 p-4 rounded-[var(--radius-md)] text-xs overflow-x-auto" style={{ background: "var(--surface-raised)" }}>
                    {JSON.stringify(a.details, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
