"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";

export default function MobileBalance() {
  const [solde, setSolde] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/portefeuille")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data && data.soldeDisponible != null) {
          setSolde(Number(data.soldeDisponible));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (solde === null) return null;

  return (
    <Link
      href="/dashboard/portefeuille"
      className="flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-md)] text-[12px] font-bold"
      style={{
        background: "var(--accent-subtle)",
        color: "var(--accent)",
        border: "1.5px solid rgba(12,59,48,0.15)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <Wallet size={13} />
      {solde.toLocaleString("fr-FR")}
      <span style={{ fontWeight: 500, opacity: 0.7 }}>FCFA</span>
    </Link>
  );
}
