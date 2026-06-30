"use client";

import Link from "next/link";
import { Gavel, UserCircle, Wallet, Truck, CheckCircle } from "lucide-react";
import { useT } from "@/components/providers/LanguageProvider";

export default function HowItWorksPage() {
  const t = useT();

  const steps = [
    { icon: UserCircle, title: t("how.step1.title"), description: t("how.step1.desc") },
    { icon: Wallet, title: t("how.step2.title"), description: t("how.step2.desc") },
    { icon: Gavel, title: t("how.step3.title"), description: t("how.step3.desc") },
    { icon: Truck, title: t("how.step4.title"), description: t("how.step4.desc") },
  ];

  const benefits = [
    { title: t("how.benefit1.title"), description: t("how.benefit1.desc") },
    { title: t("how.benefit2.title"), description: t("how.benefit2.desc") },
    { title: t("how.benefit3.title"), description: t("how.benefit3.desc") },
    { title: t("how.benefit4.title"), description: t("how.benefit4.desc") },
  ];

  return (
    <main className="py-24 min-h-screen" style={{ background: "var(--surface-base)" }}>
      <div className="container-app">
        <div className="text-center mb-16">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "var(--accent)" }}
          >
            <Gavel size={30} className="text-white" />
          </div>
          <h1 className="mb-4" style={{ color: "var(--ink)" }}>{t("how.title")}</h1>
          <p className="text-[16px]" style={{ color: "var(--ink-muted)" }}>
            {t("how.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="card p-7 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "var(--accent-subtle)" }}
                >
                  <Icon size={26} style={{ color: "var(--accent)" }} />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--accent-gold)" }}>
                  {t("how.step")} {index + 1}
                </div>
                <h3 className="text-[15px] font-bold mb-2" style={{ color: "var(--ink)" }}>
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="card p-8 md:p-14 mb-20">
          <h2
            className="text-center mb-12"
            style={{ color: "var(--ink)", fontSize: "24px", fontWeight: 700, textTransform: "none", letterSpacing: "-0.015em" }}
          >
            {t("how.whyTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "var(--accent-subtle)" }}
                >
                  <CheckCircle size={26} style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="text-[15px] font-bold mb-2" style={{ color: "var(--ink)" }}>
                  {benefit.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2
            className="mb-8"
            style={{ color: "var(--ink)", fontSize: "24px", fontWeight: 700, textTransform: "none", letterSpacing: "-0.015em" }}
          >
            {t("how.readyTitle")}
          </h2>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/register" className="btn btn-gold btn-lg">
              {t("how.cta.register")}
            </Link>
            <Link href="/catalogue" className="btn btn-secondary btn-lg">
              {t("how.cta.catalogue")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
