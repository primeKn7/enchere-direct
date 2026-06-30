"use client";

import Link from "next/link";
import { Radio, ArrowLeft } from "lucide-react";
import { useT } from "@/components/providers/LanguageProvider";

export default function VenteLivePage() {
  const t = useT();

  return (
    <main
      className="min-h-[70vh] flex items-center justify-center px-4 py-20"
      style={{ background: "var(--surface-base)" }}
    >
      <div className="text-center max-w-lg">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 relative"
          style={{ background: "var(--accent)" }}
        >
          <Radio size={30} className="text-white" />
          <span className="absolute -top-1 -right-1 live-dot" style={{ width: 12, height: 12 }} />
        </div>

        <span className="badge badge-urgent mb-4 inline-flex">{t("live.subtitle")}</span>

        <h1 className="text-[28px] font-bold mb-3" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
          {t("live.title")}
        </h1>
        <p className="text-[15px] leading-relaxed mb-8" style={{ color: "var(--ink-muted)" }}>
          {t("live.desc")}
        </p>

        <Link href="/" className="btn btn-primary">
          <ArrowLeft size={16} />
          {t("live.back")}
        </Link>
      </div>
    </main>
  );
}
