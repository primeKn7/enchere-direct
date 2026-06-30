"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ShieldCheck, RefreshCw, Check, X, AlertCircle } from "lucide-react";

type Demande = {
  id: string;
  typeDocument: string;
  numeroDocument: string;
  rectoUrl: string;
  versoUrl: string | null;
  selfieUrl: string;
  statut: string;
  motifRejet: string | null;
  createdAt: string;
  utilisateur: { id: string; nom: string; prenom: string; email: string; role: string };
};

const roleLabels: Record<string, string> = {
  CITOYEN: "Citoyen",
  ENTREPRISE: "Entreprise",
  COMMISSAIRE_PRISEUR: "Commissaire-Priseur",
  AGENT_AES: "Agent AES",
  MAGISTRAT: "Magistrat",
  DOUANIER: "Douanier",
  TRESOR_PUBLIC: "Trésor Public",
  EXPERT: "Expert",
  ADMINISTRATEUR: "Administrateur",
};

export default function KycValidationPage() {
  const { data: session, status } = useSession();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filtre, setFiltre] = useState("EN_ATTENTE");

  const role = session?.user?.role;
  const canReview = role === "ADMINISTRATEUR"; // COMPTE_VALIDER = admin pour l'instant

  const fetchDemandes = useCallback(() => {
    setLoading(true);
    fetch(`/api/kyc?statut=${filtre}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDemandes(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [filtre]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated" && !canReview) redirect("/dashboard");
    if (status === "authenticated") fetchDemandes();
  }, [status, canReview, fetchDemandes]);

  async function traiter(id: string, action: "valider" | "rejeter") {
    let motifRejet: string | undefined;
    if (action === "rejeter") {
      motifRejet = window.prompt("Motif du rejet :") ?? undefined;
      if (!motifRejet || !motifRejet.trim()) return;
    }
    setProcessing(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/kyc/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, motifRejet }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: action === "valider" ? "Compte vérifié." : "Demande rejetée." });
        fetchDemandes();
      } else {
        setMessage({ type: "error", text: typeof json.error === "string" ? json.error : "Erreur." });
      }
    } finally {
      setProcessing(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-[var(--accent)]" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Validation KYC</h1>
      </div>

      {message && (
        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"} mb-6`}>
          {message.text}
        </div>
      )}

      <div className="seg w-full sm:w-auto mb-6" role="tablist">
        {[
          { key: "EN_ATTENTE", label: "En attente" },
          { key: "VALIDE", label: "Validées" },
          { key: "REJETE", label: "Rejetées" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltre(f.key)}
            className={`seg-btn px-4 sm:px-6 ${filtre === f.key ? "active" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-[var(--accent)]" size={24} />
        </div>
      ) : demandes.length === 0 ? (
        <div className="glass-surface p-8 text-center flex flex-col items-center gap-2">
          <AlertCircle size={32} className="text-[var(--ink-disabled)]" />
          <p className="text-[var(--ink-muted)]">Aucune demande dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {demandes.map((d) => (
            <div key={d.id} className="glass-surface p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <p className="font-semibold text-[var(--ink)]">
                    {d.utilisateur.prenom} {d.utilisateur.nom}
                  </p>
                  <p className="text-sm text-[var(--ink-muted)]">{d.utilisateur.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge badge-subtle">{roleLabels[d.utilisateur.role] ?? d.utilisateur.role}</span>
                    <span className="text-xs text-[var(--ink-muted)]">
                      {d.typeDocument} · n° {d.numeroDocument}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[var(--ink-muted)]">
                  Soumis le {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <DocThumb label="Recto" url={d.rectoUrl} />
                {d.versoUrl && <DocThumb label="Verso" url={d.versoUrl} />}
                <DocThumb label="Selfie" url={d.selfieUrl} />
              </div>

              {d.statut === "REJETE" && d.motifRejet && (
                <p className="text-sm text-[var(--danger)] mb-3">Motif : {d.motifRejet}</p>
              )}

              {d.statut === "EN_ATTENTE" && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => traiter(d.id, "valider")}
                    disabled={processing === d.id}
                    className="btn btn-gold"
                  >
                    <Check size={16} /> Valider
                  </button>
                  <button
                    type="button"
                    onClick={() => traiter(d.id, "rejeter")}
                    disabled={processing === d.id}
                    className="btn btn-ghost"
                  >
                    <X size={16} /> Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocThumb({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="glass-surface overflow-hidden block group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
      <div className="p-2">
        <span className="badge badge-subtle text-xs">{label}</span>
      </div>
    </a>
  );
}
