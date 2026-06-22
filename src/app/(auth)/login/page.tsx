"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
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
    const cleanPassword = password; // ne pas trim le mot de passe

    setLoading(true);
    setError("");

    try {
      console.log("[LOGIN FORM] Tentative pour:", cleanEmail, "mdp length:", cleanPassword.length);
      const result = await signIn("credentials", {
        email: cleanEmail,
        password: cleanPassword,
        redirect: false,
      });
      console.log("[LOGIN FORM] Résultat signIn:", result);

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
          otp_expired: "Le code de vérification a expiré. Veuillez réessayer.",
          otp_invalid: "Code de vérification incorrect.",
          otp_max_attempts: "Trop de tentatives. Veuillez réessayer plus tard.",
          account_blocked: "Votre compte est bloqué. Contactez l'administrateur.",
        };
        setError(messages[errorCode] ?? `Erreur: ${errorCode}`);
        return;
      }

      if (!result.ok) {
        setError("La connexion a échoué. Veuillez réessayer.");
        return;
      }

      // Rechargement complet pour s'assurer que la session NextAuth est bien propagée
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("[LOGIN FORM] Exception:", err);
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-center text-[var(--ink)]">
        Connexion sécurisée
      </h1>
      <p className="text-sm text-center text-[var(--ink-secondary)] mb-6">
        Accédez à votre espace EnchèreDirect
      </p>

      {error && (
        <div className="alert alert-danger mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {disabled && (
        <div className="alert alert-warning mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          Trop de tentatives. Veuillez patienter.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
            />
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
          <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
            Mot de passe
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
            />
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
          className="btn btn-primary w-full"
        >
          {loading ? "Connexion..." : "Se connecter"}
          <ArrowRight size={18} />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink-secondary)]">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-[var(--accent)] hover:underline font-medium">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}
