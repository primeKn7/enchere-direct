"use client";

import { useState } from "react";
import { UserPlus, AlertCircle, X } from "lucide-react";

const ROLES: { value: string; label: string }[] = [
  { value: "CITOYEN", label: "Citoyen" },
  { value: "ENTREPRISE", label: "Entreprise" },
  { value: "COMMISSAIRE_PRISEUR", label: "Commissaire-Priseur" },
  { value: "AGENT_AES", label: "Agent AES" },
  { value: "MAGISTRAT", label: "Magistrat" },
  { value: "DOUANIER", label: "Douanier" },
  { value: "TRESOR_PUBLIC", label: "Trésor Public" },
  { value: "EXPERT", label: "Expert" },
  { value: "ADMINISTRATEUR", label: "Administrateur" },
];

const EMPTY = {
  email: "",
  prenom: "",
  nom: "",
  telephone: "",
  password: "",
  role: "EXPERT",
  numeroCNI: "",
  numeroRCCM: "",
  raisonSociale: "",
  numeroAgrement: "",
  jurisdiction: "",
  posteAffectation: "",
  compteVerifie: true,
};

export default function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          prenom: form.prenom.trim(),
          nom: form.nom.trim(),
          telephone: form.telephone || undefined,
          password: form.password,
          role: form.role,
          numeroCNI: form.numeroCNI || undefined,
          numeroRCCM: form.numeroRCCM || undefined,
          raisonSociale: form.raisonSociale || undefined,
          numeroAgrement: form.numeroAgrement || undefined,
          jurisdiction: form.jurisdiction || undefined,
          posteAffectation: form.posteAffectation || undefined,
          compteVerifie: form.compteVerifie,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const flat = json.error?.fieldErrors;
        const first = flat ? Object.values(flat).flat()[0] : null;
        setError(
          typeof json.error === "string"
            ? json.error
            : (first as string) ?? "Création impossible."
        );
        setLoading(false);
        return;
      }
      setForm({ ...EMPTY });
      setOpen(false);
      setLoading(false);
      onCreated();
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-gold mb-6">
        <UserPlus size={16} /> Nouvel utilisateur
      </button>
    );
  }

  return (
    <div className="glass-surface p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserPlus size={20} className="text-[var(--accent)]" />
          <h3 className="text-[var(--ink)] font-semibold">Créer un utilisateur</h3>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="btn-ghost text-xs py-1 px-2"
          title="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-4 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Prénom">
          <input className="input" value={form.prenom} onChange={(e) => set("prenom", e.target.value)} required />
        </Field>
        <Field label="Nom">
          <input className="input" value={form.nom} onChange={(e) => set("nom", e.target.value)} required />
        </Field>
        <Field label="Email">
          <input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </Field>
        <Field label="Téléphone (optionnel)">
          <input className="input" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} />
        </Field>
        <Field label="Rôle">
          <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Mot de passe provisoire">
          <input
            type="text"
            className="input"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="12+ car., maj/min/chiffre/spécial"
            required
          />
        </Field>

        {/* Champs conditionnels selon le rôle */}
        {form.role === "CITOYEN" && (
          <Field label="Numéro CNI (optionnel)">
            <input className="input" value={form.numeroCNI} onChange={(e) => set("numeroCNI", e.target.value)} />
          </Field>
        )}
        {form.role === "ENTREPRISE" && (
          <>
            <Field label="Raison sociale">
              <input className="input" value={form.raisonSociale} onChange={(e) => set("raisonSociale", e.target.value)} />
            </Field>
            <Field label="Numéro RCCM (optionnel)">
              <input className="input" value={form.numeroRCCM} onChange={(e) => set("numeroRCCM", e.target.value)} />
            </Field>
          </>
        )}
        {(form.role === "COMMISSAIRE_PRISEUR" || form.role === "EXPERT") && (
          <Field label="Numéro d'agrément">
            <input className="input" value={form.numeroAgrement} onChange={(e) => set("numeroAgrement", e.target.value)} />
          </Field>
        )}
        {form.role === "MAGISTRAT" && (
          <Field label="Juridiction compétente">
            <input className="input" value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} />
          </Field>
        )}
        {form.role === "DOUANIER" && (
          <Field label="Poste d'affectation">
            <input className="input" value={form.posteAffectation} onChange={(e) => set("posteAffectation", e.target.value)} />
          </Field>
        )}

        <label className="flex items-center gap-2 text-sm text-[var(--ink)] sm:col-span-2">
          <input
            type="checkbox"
            checked={form.compteVerifie}
            onChange={(e) => set("compteVerifie", e.target.checked)}
          />
          Marquer le compte comme vérifié immédiatement
        </label>

        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" disabled={loading} className="btn btn-gold">
            <UserPlus size={16} /> {loading ? "Création…" : "Créer l'utilisateur"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">{label}</label>
      {children}
    </div>
  );
}
