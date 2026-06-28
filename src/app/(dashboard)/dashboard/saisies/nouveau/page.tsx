"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Magistrat {
  id: string;
  nom: string;
  prenom: string;
  jurisdiction: string | null;
}

export default function NouveauDossierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magistrats, setMagistrats] = useState<Magistrat[]>([]);
  const [jurisdiction, setJurisdiction] = useState("");

  useEffect(() => {
    fetch("/api/magistrats")
      .then((r) => r.json())
      .then((res) => setMagistrats(res.data ?? []))
      .catch(() => {});
  }, []);

  function handleMagistratChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = magistrats.find((m) => m.id === e.target.value);
    if (selected?.jurisdiction) setJurisdiction(selected.jurisdiction);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const magistratRaw = (fd.get("magistratId") as string)?.trim();

    const body: Record<string, unknown> = {
      referenceJudiciaire: fd.get("referenceJudiciaire"),
      jurisdictionCompetente: fd.get("jurisdictionCompetente"),
      dateSaisie: new Date(fd.get("dateSaisie") as string).toISOString(),
      identiteProprietaire: fd.get("identiteProprietaire"),
      creancier: fd.get("creancier"),
      huissierInstrumentaire: fd.get("huissierInstrumentaire"),
    };
    if (magistratRaw) {
      body.magistratId = magistratRaw;
    }

    try {
      const res = await fetch("/api/saisies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        if (typeof data.error === "string") {
          setError(data.error);
        } else if (data.error?.fieldErrors) {
          const msgs = Object.entries(data.error.fieldErrors)
            .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
            .join(" | ");
          setError(msgs || "Erreur de validation.");
        } else {
          setError("Erreur lors de la création du dossier.");
        }
        setLoading(false);
        return;
      }

      const { data } = await res.json();
      router.push(`/dashboard/saisies/${data.id}`);
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <FolderOpen size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Nouveau dossier de saisie</h1>
      </div>

      <Link
        href="/dashboard/saisies"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] mb-6"
      >
        <ArrowLeft size={14} /> Retour aux dossiers
      </Link>

      {error && <div className="alert alert-danger mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="glass-surface p-6 space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Référence judiciaire *
            </label>
            <input
              name="referenceJudiciaire"
              required
              minLength={3}
              maxLength={100}
              className="input"
              placeholder="Ex: TGI-ABJ-2026-0042"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Juridiction compétente *
            </label>
            <input
              name="jurisdictionCompetente"
              required
              minLength={2}
              maxLength={200}
              className="input"
              placeholder="Ex: TGI de Cotonou"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Date de saisie *
            </label>
            <input
              name="dateSaisie"
              type="date"
              required
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Magistrat en charge
            </label>
            <select name="magistratId" className="input" onChange={handleMagistratChange}>
              <option value="">— Aucun (optionnel)</option>
              {magistrats.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.prenom} {m.nom}{m.jurisdiction ? ` — ${m.jurisdiction}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <hr className="border-[var(--border)]" />

        <h3 className="text-[var(--ink)] font-semibold">Parties concernées</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Identité du propriétaire *
            </label>
            <input
              name="identiteProprietaire"
              required
              minLength={2}
              maxLength={300}
              className="input"
              placeholder="Nom complet du propriétaire des biens saisis"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Créancier *
            </label>
            <input
              name="creancier"
              required
              minLength={2}
              maxLength={300}
              className="input"
              placeholder="Nom ou raison sociale du créancier"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Huissier instrumentaire *
            </label>
            <input
              name="huissierInstrumentaire"
              required
              minLength={2}
              maxLength={300}
              className="input"
              placeholder="Nom de l'huissier instrumentaire"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            <Save size={16} />
            {loading ? "Création en cours..." : "Créer le dossier"}
          </button>
        </div>
      </form>
    </div>
  );
}
