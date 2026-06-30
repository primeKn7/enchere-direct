"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Gavel,
  MapPin,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  History,
  Zap,
  TrendingDown,
  Lock,
  Tag,
} from "lucide-react";

interface Enchere {
  id: string;
  montantActuel: string;
  montantReserve: string;
  statut: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  pourcentageGarantie: number;
  antiSnipingDelai: number;
  lot: {
    prixDepart: string;
    bien: { description: string; localisation: string };
  };
}

interface OffreAudit {
  id: string;
  encherisseur: string;
  montant: string | null;
  statut: string;
  adresseIP: string | null;
  auto: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  ASCENDANTE: "Ascendante",
  DESCENDANTE: "Descendante (au cadran)",
  SCELLEE: "Scellée (offres cachées)",
  VENTE_DIRECTE: "Vente directe (prix fixe)",
};

function fcfa(v: number | string) {
  return Number(v).toLocaleString("fr-FR");
}

export default function EnchereDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [enchere, setEnchere] = useState<Enchere | null>(null);
  const [offres, setOffres] = useState<OffreAudit[]>([]);
  const [supervision, setSupervision] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [montant, setMontant] = useState("");
  const [autoActif, setAutoActif] = useState(false);
  const [plafond, setPlafond] = useState("");
  const [increment, setIncrement] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const loadEnchere = useCallback(() => {
    fetch(`/api/encheres/${id}`)
      .then((r) => r.json())
      .then((json) => setEnchere(json.data ?? null))
      .catch(() => setEnchere(null))
      .finally(() => setLoaded(true));
  }, [id]);

  const loadOffres = useCallback(() => {
    fetch(`/api/encheres/${id}/offres`)
      .then((r) => r.json())
      .then((json) => {
        setOffres(json.data ?? []);
        setSupervision(Boolean(json.supervision));
      })
      .catch(() => setOffres([]));
  }, [id]);

  useEffect(() => {
    loadEnchere();
    loadOffres();
  }, [loadEnchere, loadOffres]);

  // Horloge pour le prix descendant (cadran).
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Prix courant au cadran pour une enchère descendante.
  const prixCadran = useMemo(() => {
    if (!enchere || enchere.type !== "DESCENDANTE") return null;
    const haut = Number(enchere.lot.prixDepart);
    const bas = Number(enchere.montantReserve);
    const debut = new Date(enchere.dateDebut).getTime();
    const fin = new Date(enchere.dateFin).getTime();
    const total = fin - debut;
    if (total <= 0) return bas;
    const ecoule = Math.min(Math.max(now - debut, 0), total);
    return Math.round(haut - (haut - bas) * (ecoule / total));
  }, [enchere, now]);

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    let montantEnvoye = montant;
    if (enchere?.type === "DESCENDANTE" && prixCadran != null) montantEnvoye = String(prixCadran);
    if (enchere?.type === "VENTE_DIRECTE") montantEnvoye = enchere.lot.prixDepart;

    const payload: Record<string, unknown> = { montant: parseFloat(montantEnvoye) };
    if (autoActif && enchere?.type === "ASCENDANTE" && plafond && increment) {
      payload.surenchereAuto = { plafondMaximal: parseFloat(plafond), increment: parseFloat(increment) };
    }

    const res = await fetch(`/api/encheres/${id}/offres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Erreur lors du dépôt.");
      return;
    }
    setMessage(json.message ?? "Offre déposée avec succès.");
    setMontant("");
    setPlafond("");
    setIncrement("");
    setAutoActif(false);
    loadEnchere();
    loadOffres();
  }

  if (!loaded) return <p className="text-[var(--ink-secondary)]">Chargement...</p>;
  if (!enchere) return <p className="text-[var(--ink-secondary)]">Enchère introuvable.</p>;

  const active = enchere.statut === "EN_COURS" || enchere.statut === "PROLONGEE";
  const isSealed = enchere.type === "SCELLEE";
  const isDescending = enchere.type === "DESCENDANTE";
  const isDirect = enchere.type === "VENTE_DIRECTE";
  const isAscending = enchere.type === "ASCENDANTE";

  return (
    <div>
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <Gavel size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Détail de l&apos;enchère</h1>
        <span className="badge badge-subtle flex items-center gap-1">
          <Tag size={12} /> {TYPE_LABELS[enchere.type] ?? enchere.type}
        </span>
        <span className="badge badge-subtle">{enchere.statut}</span>
      </div>

      {/* Infos lot */}
      <div className="glass-surface p-6 space-y-3 mb-6">
        <p className="text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink)]">Description :</span>{" "}
          {enchere.lot.bien.description}
        </p>
        <p className="flex items-center gap-2 text-[var(--ink-secondary)]">
          <MapPin size={16} className="text-[var(--ink-muted)]" />
          {enchere.lot.bien.localisation}
        </p>
        <div className="flex items-center gap-2 text-[var(--ink-secondary)]">
          <Clock size={16} className="text-[var(--ink-muted)]" />
          <span className="font-medium text-[var(--ink)]">Clôture :</span>{" "}
          {new Date(enchere.dateFin).toLocaleString("fr-FR")}
        </div>
        <p className="flex items-center gap-2 text-[12px]" style={{ color: "var(--ink-muted)" }}>
          <ShieldCheck size={13} /> Garantie exigée : {enchere.pourcentageGarantie}% · Anti-sniping :
          prolongation de {enchere.antiSnipingDelai}s
        </p>
      </div>

      {/* Bloc prix selon le type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {isDescending ? (
          <PriceCard
            icon={<TrendingDown size={18} />}
            label="Prix courant au cadran"
            value={prixCadran != null ? `${fcfa(prixCadran)} FCFA` : "—"}
            highlight
          />
        ) : isDirect ? (
          <PriceCard
            icon={<Tag size={18} />}
            label="Prix d'achat fixe"
            value={`${fcfa(enchere.lot.prixDepart)} FCFA`}
            highlight
          />
        ) : isSealed ? (
          <PriceCard icon={<Lock size={18} />} label="Offres" value="Cachées" />
        ) : (
          <PriceCard
            icon={<Gavel size={18} />}
            label="Montant actuel"
            value={`${fcfa(enchere.montantActuel)} FCFA`}
            highlight
          />
        )}
        <PriceCard label="Prix de réserve" value={`${fcfa(enchere.montantReserve)} FCFA`} />
        <PriceCard label="Mise à prix" value={`${fcfa(enchere.lot.prixDepart)} FCFA`} />
      </div>

      {/* Formulaire d'offre */}
      <div className="glass-surface p-6 mb-8">
        <h2 className="text-xl font-semibold text-[var(--ink)] mb-4">
          {isDirect ? "Acheter ce lot" : isDescending ? "Accepter le prix au cadran" : "Déposer une offre"}
        </h2>

        {isSealed && (
          <div className="alert mb-4 flex items-start gap-2" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
            <Lock size={16} className="mt-0.5 shrink-0" />
            <span>Enchère scellée : votre offre reste cachée jusqu&apos;à la clôture. Montant minimum = prix de réserve.</span>
          </div>
        )}
        {message && <div className="alert alert-success mb-4">{message}</div>}
        {error && (
          <div className="alert alert-danger mb-4 flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {!active ? (
          <p className="text-[var(--ink-muted)]">Cette enchère n&apos;est pas ouverte aux offres.</p>
        ) : (
          <form onSubmit={submitOffer} className="space-y-4">
            {isDirect || isDescending ? (
              <p className="text-[var(--ink-secondary)]">
                Montant engagé :{" "}
                <span className="text-price">
                  {isDirect
                    ? fcfa(enchere.lot.prixDepart)
                    : prixCadran != null
                    ? fcfa(prixCadran)
                    : "—"}{" "}
                  FCFA
                </span>
              </p>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  min={isSealed ? Number(enchere.montantReserve) : Number(enchere.montantActuel) + 1}
                  required
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="input"
                  placeholder="Ex: 1000000"
                />
              </div>
            )}

            {/* Surenchère automatique (ascendante uniquement) */}
            {isAscending && (
              <div className="rounded-[var(--radius-md)] p-4" style={{ background: "var(--surface-sunken)" }}>
                <label className="flex items-center gap-2 cursor-pointer mb-1">
                  <input
                    type="checkbox"
                    checked={autoActif}
                    onChange={(e) => setAutoActif(e.target.checked)}
                    style={{ accentColor: "var(--accent-gold)" }}
                  />
                  <span className="text-sm font-semibold text-[var(--ink)] flex items-center gap-1.5">
                    <Zap size={14} /> Surenchère automatique
                  </span>
                </label>
                <p className="text-[12px] mb-3" style={{ color: "var(--ink-muted)" }}>
                  Le système enchérit pour vous, par incréments, jusqu&apos;à votre plafond.
                </p>
                {autoActif && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[var(--ink)] mb-1">
                        Plafond maximal (FCFA)
                      </label>
                      <input
                        type="number"
                        value={plafond}
                        onChange={(e) => setPlafond(e.target.value)}
                        className="input"
                        placeholder="Ex: 5000000"
                        required={autoActif}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[var(--ink)] mb-1">
                        Incrément (FCFA)
                      </label>
                      <input
                        type="number"
                        value={increment}
                        onChange={(e) => setIncrement(e.target.value)}
                        className="input"
                        placeholder="Ex: 100000"
                        required={autoActif}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-gold">
              {isDirect ? "Acheter maintenant" : isDescending ? "Accepter le prix" : "Déposer"}
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>

      {/* Historique d'audit */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <History size={22} className="text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--ink)]">Historique d&apos;audit des offres</h2>
          {supervision && <span className="badge badge-subtle">Vue superviseur</span>}
        </div>

        {offres.length === 0 ? (
          <div className="glass-surface p-8 text-center">
            <History size={40} className="mx-auto mb-3 text-[var(--ink-disabled)]" />
            <p className="text-[var(--ink-muted)]">Aucune offre enregistrée.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Enchérisseur</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  {supervision && <th>Adresse IP</th>}
                  <th>Date & heure</th>
                </tr>
              </thead>
              <tbody>
                {offres.map((o) => (
                  <tr key={o.id}>
                    <td className="font-medium text-[var(--ink)]">
                      {o.encherisseur}
                      {o.auto && (
                        <span className="badge badge-subtle ml-2 inline-flex items-center gap-1">
                          <Zap size={10} /> auto
                        </span>
                      )}
                    </td>
                    <td className="text-price">{o.montant ? `${fcfa(o.montant)} FCFA` : "•••"}</td>
                    <td>
                      <span className="badge badge-subtle">{o.statut}</span>
                    </td>
                    {supervision && <td className="text-mono text-[12px]">{o.adresseIP ?? "—"}</td>}
                    <td className="text-[12px]">{new Date(o.createdAt).toLocaleString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="glass-surface p-4">
      <span className="text-[11px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
        {icon} {label}
      </span>
      <p
        className="font-bold mt-1"
        style={{ fontSize: highlight ? "20px" : "16px", color: highlight ? "var(--accent)" : "var(--ink)" }}
      >
        {value}
      </p>
    </div>
  );
}
