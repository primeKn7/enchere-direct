"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Immobilier",
  "Véhicule",
  "Mobilier",
  "Équipement industriel",
  "Matériel informatique",
  "Bijoux & Métaux précieux",
  "Œuvre d'art",
  "Matériel agricole",
  "Autre",
];

const ETATS = [
  "Neuf",
  "Très bon état",
  "Bon état",
  "État moyen",
  "Mauvais état",
  "Hors service",
];

interface Dossier {
  id: string;
  referenceJudiciaire: string;
}

export default function NouveauBienPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);

  useEffect(() => {
    fetch("/api/saisies")
      .then((r) => r.json())
      .then((res) => setDossiers(res.data ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const sousCategorie = (fd.get("sousCategorie") as string)?.trim();
    const rfid = (fd.get("rfid") as string)?.trim();

    const body: Record<string, unknown> = {
      dossierId: fd.get("dossierId"),
      categorie: fd.get("categorie"),
      description: fd.get("description"),
      valeurEstimee: fd.get("valeurEstimee"),
      localisation: fd.get("localisation"),
      etatGeneral: fd.get("etatGeneral"),
    };
    if (sousCategorie) body.sousCategorie = sousCategorie;
    if (rfid) body.rfid = rfid;

    try {
      const res = await fetch("/api/biens", {
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
          setError("Erreur lors de la création.");
        }
        setLoading(false);
        return;
      }

      const { data } = await res.json();
      router.push(`/dashboard/inventaire/${data.id}`);
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Package size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Enregistrer un bien saisi</h1>
      </div>

      <Link
        href="/dashboard/inventaire"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] mb-6"
      >
        <ArrowLeft size={14} /> Retour à l&apos;inventaire
      </Link>

      {error && <div className="alert alert-danger mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="glass-surface p-6 space-y-6 max-w-2xl">
        {/* Dossier */}
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">
            Dossier de saisie *
          </label>
          <select name="dossierId" required className="input">
            <option value="">Sélectionner un dossier</option>
            {dossiers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.referenceJudiciaire}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-[var(--border)]" />
        <h3 className="text-[var(--ink)] font-semibold">Fiche du bien</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Catégorie *
            </label>
            <select name="categorie" required className="input">
              <option value="">Sélectionner</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Sous-catégorie
            </label>
            <input
              name="sousCategorie"
              maxLength={100}
              className="input"
              placeholder="Ex: Berline, Appartement T3..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">
            Description complète *
          </label>
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={5000}
            rows={5}
            className="input"
            style={{ height: "auto" }}
            placeholder="Description détaillée du bien (marque, modèle, dimensions, particularités...)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Valeur estimée (FCFA) *
            </label>
            <input
              name="valeurEstimee"
              type="number"
              min="0"
              step="0.01"
              required
              className="input"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              État général *
            </label>
            <select name="etatGeneral" required className="input">
              <option value="">Sélectionner</option>
              {ETATS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">
            Localisation physique *
          </label>
          <input
            name="localisation"
            required
            minLength={2}
            maxLength={500}
            className="input"
            placeholder="Adresse ou lieu de stockage du bien"
          />
        </div>

        <hr className="border-[var(--border)]" />
        <h3 className="text-[var(--ink)] font-semibold">Identification physique</h3>
        <p className="text-sm text-[var(--ink-muted)] -mt-4">
          Un QR Code et un code-barres seront générés automatiquement.
        </p>

        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">
            Puce RFID (optionnel)
          </label>
          <input
            name="rfid"
            maxLength={100}
            className="input"
            placeholder="Identifiant RFID si disponible"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            <Save size={16} />
            {loading ? "Enregistrement..." : "Enregistrer le bien"}
          </button>
        </div>
      </form>
    </div>
  );
}
