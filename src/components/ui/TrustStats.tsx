"use client";

import { useT } from "@/components/providers/LanguageProvider";

export default function TrustStats() {
  const t = useT();

  const stats = [
    { value: t("trust.s1v"), caption: t("trust.s1c") },
    { value: t("trust.s2v"), caption: t("trust.s2c") },
    { value: t("trust.s3v"), caption: t("trust.s3c") },
    { value: t("trust.s4v"), caption: t("trust.s4c") },
  ];

  return (
    <div className="hidden sm:flex flex-wrap items-start gap-x-10 gap-y-5 mt-10">
      {stats.map((s, i) => (
        <div key={i} className="trust-stat">
          <div className="value">{s.value}</div>
          <div className="caption">{s.caption}</div>
        </div>
      ))}
    </div>
  );
}
