"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useT } from "@/components/providers/LanguageProvider";

export default function LoginForm() {
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const disabled = attempts >= 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (!result) {
        setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
        return;
      }

      if (result.error || result.code) {
        setAttempts((a) => a + 1);
        const errorCode = result.code ?? result.error ?? "unknown";
        if (errorCode === "mfa_required") {
          sessionStorage.setItem("mfa_email", cleanEmail);
          router.push("/verify-otp");
          return;
        }
        const messages: Record<string, string> = {
          credentials_invalid: "Identifiants incorrects. Veuillez réessayer.",
          otp_expired: "Le code de vérification a expiré.",
          otp_invalid: "Code de vérification incorrect.",
          otp_max_attempts: "Trop de tentatives. Réessayez plus tard.",
          account_blocked: "Votre compte est bloqué. Contactez l'administrateur.",
          too_many_attempts: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
        };
        setError(messages[errorCode] ?? `Erreur : ${errorCode}`);
        return;
      }

      if (!result.ok) {
        setError("La connexion a échoué. Veuillez réessayer.");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[18px] font-bold mb-1" style={{ color: "var(--ink)", textTransform: "none", letterSpacing: "-0.01em" }}>
          {t("auth.welcomeBack")}
        </h2>
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          {t("auth.loginSubtitle")}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger mb-5 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {disabled && (
        <div className="alert alert-warning mb-5 flex items-center gap-2">
          <AlertCircle size={16} />
          Trop de tentatives. Veuillez patienter.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>
            {t("auth.email")}
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              autoComplete="email"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>
            {t("auth.password")}
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || disabled}
          className="btn btn-gold w-full btn-lg"
          style={{ marginTop: "8px" }}
        >
          {loading ? t("auth.signingIn") : t("auth.signIn")}
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>
    </div>
  );
}
