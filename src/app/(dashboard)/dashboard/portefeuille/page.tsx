"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  RefreshCw,
  CreditCard,
  Smartphone,
  Building2,
} from "lucide-react";

type Transaction = {
  id: string;
  reference: string;
  montant: string;
  type: string;
  statut: string;
  canal: string;
  createdAt: string;
};

type Garantie = {
  id: string;
  montantCaution: string;
  statut: string;
  offre: { enchereId: string; montant: string };
};

type Portefeuille = {
  id: string;
  soldeDisponible: string;
  soldeBloque: string;
  transactions: Transaction[];
  garanties: Garantie[];
};

const typeIcons: Record<string, React.ElementType> = {
  CREDIT: ArrowDownCircle,
  DEBIT: ArrowUpCircle,
  BLOCAGE: Lock,
  DEBLOCAGE: RefreshCw,
};

const canalLabels: Record<string, { label: string; icon: React.ElementType }> = {
  SPI_BCEAO: { label: "SPI BCEAO", icon: Building2 },
  MOBILE_MONEY: { label: "Mobile Money", icon: Smartphone },
  VIREMENT: { label: "Virement bancaire", icon: CreditCard },
};

export default function PortefeuillePage() {
  const { data: session, status } = useSession();
  const [portefeuille, setPortefeuille] = useState<Portefeuille | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecharge, setShowRecharge] = useState(false);
  const [montant, setMontant] = useState("");
  const [canal, setCanal] = useState("SPI_BCEAO");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchPortefeuille();
  }, [status]);

  async function fetchPortefeuille() {
    setLoading(true);
    try {
      const res = await fetch("/api/portefeuille");
      if (res.ok) setPortefeuille(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleRecharge(e: React.FormEvent) {
    e.preventDefault();
    const m = parseFloat(montant);
    if (!m || m <= 0) {
      setMessage({ type: "error", text: "Montant invalide." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/portefeuille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant: m, canal }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Rechargement effectué." });
        setMontant("");
        setShowRecharge(false);
        fetchPortefeuille();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error ?? "Erreur." });
      }
    } finally {
      setSubmitting(false);
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
      <h1 className="mb-8">Mon portefeuille</h1>

      {message && (
        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"} mb-6`}>
          {message.text}
        </div>
      )}

      {!portefeuille ? (
        <EmptyState
          title="Portefeuille non initialisé"
          description="Votre portefeuille sera créé automatiquement lors de votre première transaction. Rechargez-le pour commencer à participer aux enchères."
          illustration="wallet"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-surface p-6">
              <p className="text-sm text-[var(--ink-muted)] mb-1">Solde disponible</p>
              <p className="text-3xl font-bold text-[var(--ink)]">
                {Number(portefeuille.soldeDisponible).toLocaleString("fr-FR")} <span className="text-base font-normal">FCFA</span>
              </p>
            </div>
            <div className="glass-surface p-6">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={14} className="text-[var(--warning)]" />
                <p className="text-sm text-[var(--ink-muted)]">Fonds bloqués (garanties)</p>
              </div>
              <p className="text-3xl font-bold text-[var(--ink)]">
                {Number(portefeuille.soldeBloque).toLocaleString("fr-FR")} <span className="text-base font-normal">FCFA</span>
              </p>
            </div>
            <div className="glass-surface p-6 flex items-center justify-center">
              <button
                onClick={() => setShowRecharge(!showRecharge)}
                className="btn-primary w-full"
              >
                <CreditCard size={18} />
                Recharger
              </button>
            </div>
          </div>

          {showRecharge && (
            <div className="glass-surface p-6 mb-8">
              <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Recharger mon portefeuille</h2>
              <form onSubmit={handleRecharge} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink-secondary)] mb-1">Montant (FCFA)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    className="input"
                    placeholder="Ex: 500000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ink-secondary)] mb-1">Canal de paiement</label>
                  <select
                    value={canal}
                    onChange={(e) => setCanal(e.target.value)}
                    className="input"
                  >
                    {Object.entries(canalLabels).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? "Traitement..." : "Confirmer"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {portefeuille.garanties.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">
                <Lock size={18} className="inline mr-2" />
                Garanties actives
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portefeuille.garanties.map((g) => (
                  <div key={g.id} className="glass-surface p-4">
                    <p className="text-sm text-[var(--ink-secondary)]">
                      Caution : <span className="font-semibold text-[var(--ink)]">{Number(g.montantCaution).toLocaleString("fr-FR")} FCFA</span>
                    </p>
                    <p className="text-sm text-[var(--ink-muted)]">
                      Offre : {Number(g.offre.montant).toLocaleString("fr-FR")} FCFA
                    </p>
                    <span className="badge badge-warning mt-2">{g.statut}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Historique des transactions</h2>
            {portefeuille.transactions.length === 0 ? (
              <EmptyState
                title="Aucune transaction"
                description="Votre historique de transactions est vide. Rechargez votre portefeuille pour participer aux enchères."
                illustration="wallet"
                action={{ label: "Recharger", href: "#" }}
              />
            ) : (
              <div className="table-wrapper overflow-hidden">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Montant</th>
                      <th>Canal</th>
                      <th>Statut</th>
                      <th>Référence</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portefeuille.transactions.map((t) => {
                      const Icon = typeIcons[t.type] ?? ArrowDownCircle;
                      const canalInfo = canalLabels[t.canal];
                      return (
                        <tr key={t.id}>
                          <td>
                            <span className="flex items-center gap-2">
                              <Icon size={16} className={t.type === "CREDIT" ? "text-[var(--success)]" : t.type === "DEBIT" ? "text-[var(--danger)]" : "text-[var(--ink-muted)]"} />
                              {t.type}
                            </span>
                          </td>
                          <td className={`font-medium ${t.type === "CREDIT" ? "text-[var(--success)]" : t.type === "DEBIT" ? "text-[var(--danger)]" : "text-[var(--ink)]"}`}>
                            {t.type === "CREDIT" ? "+" : t.type === "DEBIT" ? "-" : ""}{Number(t.montant).toLocaleString("fr-FR")} FCFA
                          </td>
                          <td>{canalInfo?.label ?? t.canal}</td>
                          <td><span className={`badge ${t.statut === "CONFIRME" ? "badge-success" : t.statut === "EN_ATTENTE" ? "badge-warning" : "badge-subtle"}`}>{t.statut}</span></td>
                          <td className="text-xs text-[var(--ink-muted)]">{t.reference}</td>
                          <td>{new Date(t.createdAt).toLocaleDateString("fr-FR")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>

  );
}
