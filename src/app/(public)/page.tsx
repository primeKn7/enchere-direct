"use client";

import { Hero } from "@/components/marketing/Hero";
import { AuctionCard } from "@/components/marketing/AuctionCard";
import { getActiveAuctions } from "@/lib/demo-data";
import Link from "next/link";
import { Gavel, UserCircle, Wallet, Truck, ArrowRight } from "lucide-react";
import { useT } from "@/components/providers/LanguageProvider";

export default function HomePage() {
  const t = useT();
  const latestAuctions = getActiveAuctions(3);

  const steps = [
    { icon: UserCircle, title: t("how.step1.title"), description: t("how.step1.desc") },
    { icon: Wallet, title: t("how.step2.title"), description: t("how.step2.desc") },
    { icon: Gavel, title: t("how.step3.title"), description: t("how.step3.desc") },
    { icon: Truck, title: t("how.step4.title"), description: t("how.step4.desc") },
  ];

  return (
    <>
      <Hero />

      {/* Dernières ventes */}
      <section className="py-20" style={{ background: "var(--surface-base)" }}>
        <div className="container-app">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="mb-3">
                <span className="eyebrow-pill">{t("home.nowLabel")}</span>
              </div>
              <h2 className="marketing" style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.015em", color: "var(--ink)" }}>
                {t("home.latestSales")}
              </h2>
            </div>
            <Link href="/catalogue" className="btn btn-secondary btn-sm">
              {t("home.seeAll")}
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestAuctions.map((auction, index) => (
              <div key={auction.id} className={index === 2 ? "hidden sm:block" : ""}>
                <AuctionCard auction={auction} layout="vertical" />
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/catalogue" className="btn btn-primary">
              {t("home.exploreCatalogue")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20" style={{ background: "#ffffff" }}>
        <div className="container-app">
          <div className="text-center mb-12">
            <div className="mb-4">
              <span className="eyebrow-pill">{t("how.eyebrow")}</span>
            </div>
            <h2 className="marketing" style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.015em", color: "var(--ink)" }}>
              {t("how.title")}
            </h2>
            <p className="mt-2 text-[15px]" style={{ color: "var(--ink-muted)" }}>
              {t("how.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="card p-6 text-center transition-colors">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "var(--accent-subtle)" }}
                  >
                    <Icon size={26} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="text-[11px] font-bold mb-2 uppercase tracking-widest" style={{ color: "var(--accent-gold)" }}>
                    {t("how.step")} {index + 1}
                  </div>
                  <h3 className="text-[15px] font-bold mb-2" style={{ color: "var(--ink)" }}>
                    {item.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: "var(--teal-deep)" }}>
        <div className="container-app text-center">
          <h2 className="mb-4 font-bold" style={{ fontSize: "32px", color: "#ffffff", letterSpacing: "-0.015em" }}>
            {t("cta.title1")}<br />
            {t("cta.title2")}
          </h2>
          <p className="text-[15px] mb-8" style={{ color: "rgba(255,255,255,0.65)", maxWidth: "500px", margin: "0 auto 32px" }}>
            {t("cta.subtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn btn-gold btn-lg">
              {t("cta.createAccount")}
            </Link>
            <Link href="/register" className="btn btn-ghost-white btn-lg">
              {t("cta.becomeSeller")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
