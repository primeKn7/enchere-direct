"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { registerSchema, RegisterInput } from "@/lib/validators";
import { useT } from "@/components/providers/LanguageProvider";
import {
  AlertCircle, ArrowRight, ArrowLeft, Check, CheckCircle2,
} from "lucide-react";

const STEPS = ["Identité", "Coordonnées", "Compte", "Vérification"];

interface FormData {
  nom: string;
  prenom: string;
  numeroCNI: string;
  email: string;
  telephone: string;
  password: string;
  confirmPassword: string;
}

const INITIAL: FormData = {
  nom: "",
  prenom: "",
  numeroCNI: "",
  email: "",
  telephone: "",
  password: "",
  confirmPassword: "",
};

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-7">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : "none" }}>
          <div className="flex flex-col items-center gap-1">
            <div className={`stepper-dot ${i < current ? "done" : i === current ? "active" : ""}`}>
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span
              className="text-[10px] font-semibold hidden sm:block"
              style={{ color: i === current ? "var(--accent)" : "var(--ink-muted)" }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`stepper-line ${i < current ? "done" : ""}`} style={{ margin: "0 6px", marginBottom: "18px" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>{msg}</p>;
}

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validateStep(): boolean {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.nom.trim()) errs.nom = "Nom requis";
      if (!form.prenom.trim()) errs.prenom = "Prénom requis";
      if (!form.numeroCNI.trim()) errs.numeroCNI = "Numéro CNI requis";
    }
    if (step === 1) {
      if (!form.email.trim() || !form.email.includes("@")) errs.email = "Email valide requis";
    }
    if (step === 2) {
      if (form.password.length < 8) errs.password = "Minimum 8 caractères";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function prev() { setStep((s) => Math.max(s - 1, 0)); }

  async function handleSubmit() {
    setServerError("");
    const data: Partial<RegisterInput> = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      telephone: form.telephone || undefined,
      role: Role.CITOYEN,
      numeroCNI: form.numeroCNI || undefined,
    };

    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ""])));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof json.error === "string" ? json.error : json.error?.formErrors?.[0] ?? "L'inscription a échoué.";
        setServerError(msg);
        return;
      }
      setDone(true);
    } catch {
      setServerError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-full"
          style={{ width: 64, height: 64, background: "var(--success-subtle)" }}
        >
          <CheckCircle2 size={34} style={{ color: "var(--success)" }} />
        </div>
        <h2 className="text-[18px] font-bold mb-1" style={{ color: "var(--ink)", textTransform: "none" }}>
          Compte créé
        </h2>
        <p className="text-[13px] mb-6" style={{ color: "var(--ink-muted)" }}>
          Votre compte a bien été créé. Vous pouvez maintenant vous connecter.
        </p>
        <button type="button" onClick={onSuccess} className="btn btn-gold btn-lg w-full">
          Se connecter
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[18px] font-bold mb-1" style={{ color: "var(--ink)", textTransform: "none", letterSpacing: "-0.01em" }}>
          {t("auth.registerTitle")}
        </h2>
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          {t("auth.registerSubtitle")}
        </p>
      </div>

      <Stepper current={step} />

      {serverError && step !== 3 && (
        <div className="alert alert-danger mb-5 flex items-center gap-2">
          <AlertCircle size={16} />
          {serverError}
        </div>
      )}

      {/* Step 0 — Identité */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>Nom</label>
              <input value={form.nom} onChange={set("nom")} className="input" placeholder="Ex : Dupont" />
              <FieldError msg={errors.nom} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>Prénom</label>
              <input value={form.prenom} onChange={set("prenom")} className="input" placeholder="Ex : Jean" />
              <FieldError msg={errors.prenom} />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>Numéro CNI</label>
            <input value={form.numeroCNI} onChange={set("numeroCNI")} className="input" placeholder="Numéro de carte d'identité" />
            <FieldError msg={errors.numeroCNI} />
          </div>
        </div>
      )}

      {/* Step 1 — Coordonnées */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>Adresse email</label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              className="input"
              placeholder="votre@email.com"
              autoComplete="email"
            />
            <FieldError msg={errors.email} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>Téléphone <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}>(optionnel)</span></label>
            <input
              type="tel"
              value={form.telephone}
              onChange={set("telephone")}
              className="input"
              placeholder="+229 XX XX XX XX"
            />
          </div>
        </div>
      )}

      {/* Step 2 — Compte */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              className="input"
              placeholder="Minimum 8 caractères"
              autoComplete="new-password"
            />
            <FieldError msg={errors.password} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>Confirmer le mot de passe</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              className="input"
              placeholder="Répétez le mot de passe"
              autoComplete="new-password"
            />
            <FieldError msg={errors.confirmPassword} />
          </div>
          <div
            className="p-3 rounded-[var(--radius-md)] text-[12px]"
            style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
          >
            Le mot de passe doit contenir au moins 8 caractères.
          </div>
        </div>
      )}

      {/* Step 3 — Vérification */}
      {step === 3 && (
        <div>
          <div className="card p-5 mb-4 space-y-3">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--ink-muted)" }}>
              Récapitulatif
            </p>
            {[
              { label: "Nom complet", value: `${form.prenom} ${form.nom}` },
              { label: "Numéro CNI", value: form.numeroCNI },
              { label: "Email", value: form.email },
              { label: "Téléphone", value: form.telephone || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-[13px]">
                <span style={{ color: "var(--ink-muted)" }}>{label}</span>
                <span className="font-semibold" style={{ color: "var(--ink)" }}>{value}</span>
              </div>
            ))}
          </div>

          {serverError && (
            <div className="alert alert-danger mb-4 flex items-center gap-2">
              <AlertCircle size={16} />
              {serverError}
            </div>
          )}

          <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
              style={{ accentColor: "var(--accent-gold)" }}
            />
            <span className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
              {t("auth.acceptTerms")}
            </span>
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !acceptedTerms}
            className="btn btn-gold w-full btn-lg"
          >
            {loading ? "Création en cours…" : "Créer mon compte"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
        {step > 0 ? (
          <button type="button" onClick={prev} className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} />
            Retour
          </button>
        ) : (
          <span />
        )}

        {step < STEPS.length - 1 && (
          <button type="button" onClick={next} className="btn btn-gold">
            Continuer
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
