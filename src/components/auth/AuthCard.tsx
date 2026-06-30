"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useT } from "@/components/providers/LanguageProvider";

type Tab = "login" | "register";

export default function AuthCard({ defaultTab = "login" }: { defaultTab?: Tab }) {
  const router = useRouter();
  const t = useT();
  const [tab, setTab] = useState<Tab>(defaultTab);

  function switchTab(next: Tab) {
    setTab(next);
    // Garde l'URL synchronisée sans recharger la page
    router.replace(next === "login" ? "/login" : "/register", { scroll: false });
  }

  return (
    <div className="card p-6 sm:p-8 mt-[17px]">
      {/* Onglets Connexion / Inscription */}
      <div className="seg mb-6" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "login"}
          className={`seg-btn ${tab === "login" ? "active" : ""}`}
          onClick={() => switchTab("login")}
        >
          {t("auth.tabLogin")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "register"}
          className={`seg-btn ${tab === "register" ? "active" : ""}`}
          onClick={() => switchTab("register")}
        >
          {t("auth.tabRegister")}
        </button>
      </div>

      <div key={tab} className={tab === "register" ? "auth-slide-right" : "auth-slide-left"}>
        {tab === "login" ? (
          <LoginForm />
        ) : (
          <RegisterForm onSuccess={() => switchTab("login")} />
        )}
      </div>
    </div>
  );
}
