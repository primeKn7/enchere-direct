"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ShieldCheck, AlertCircle, Clock, RotateCcw, ArrowRight, Mail } from "lucide-react";

const MFA_EMAIL_KEY = "mfa_email";

function VerifyOtpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailFromStorage, setEmailFromStorage] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(600);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedEmail = sessionStorage.getItem(MFA_EMAIL_KEY);
    if (storedEmail) {
      setEmail(storedEmail);
      setEmailFromStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!email) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (attempts >= 3) {
      setError("Nombre maximum de tentatives atteint.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      otp: code,
      redirect: false,
    });

    setLoading(false);

    if (result?.error || result?.code) {
      setAttempts((a) => a + 1);
      const errorCode = result.code ?? result.error ?? "unknown";
      if (errorCode === "otp_invalid") {
        setError("Code incorrect.");
      } else if (errorCode === "otp_expired") {
        setError("Code expiré. Veuillez demander un nouveau code.");
      } else if (errorCode === "otp_max_attempts") {
        setError("Trop de tentatives. Veuillez demander un nouveau code.");
      } else {
        setError("Vérification impossible.");
      }
      return;
    }

    sessionStorage.removeItem(MFA_EMAIL_KEY);
    window.location.href = "/dashboard";
  }

  async function resendCode() {
    if (!email) return;
    setError("");
    setAttempts(0);
    setRemaining(600);
    await signIn("credentials", { email, password, redirect: false });
  }

  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  return (
    <div>
      <div className="flex justify-center mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "var(--accent-subtle)" }}
        >
          <ShieldCheck size={28} className="text-[var(--accent)]" />
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2 text-center text-[var(--ink)]">
        Vérification MFA
      </h1>

      {email && emailFromStorage ? (
        <p className="text-sm text-center text-[var(--ink-secondary)] mb-6">
          Un code à 6 chiffres a été envoyé à {email}
        </p>
      ) : (
        <p className="text-sm text-center text-[var(--ink-secondary)] mb-6">
          Saisissez votre email et le code reçu
        </p>
      )}

      {error && (
        <div className="alert alert-danger mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} method="post" className="space-y-4">
        {!emailFromStorage && (
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
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
            Mot de passe
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
            Code à 6 chiffres
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="input text-center text-2xl tracking-[0.5em]"
          />
          {attempts > 0 && (
            <p className="text-xs text-[var(--warning)] mt-1">
              Tentative {attempts}/3
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-[var(--ink-secondary)]">
          <Clock size={14} />
          <span className="font-mono font-bold">
            {minutes}:{seconds}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || remaining === 0 || !email}
          className="btn btn-primary w-full"
        >
          {loading ? "Vérification..." : "Vérifier"}
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={resendCode}
          disabled={remaining > 0 || loading || !email}
          className="btn btn-ghost w-full"
        >
          <RotateCcw size={16} />
          Renvoyer le code
        </button>
      </form>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-[var(--ink-secondary)]">Chargement...</div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
