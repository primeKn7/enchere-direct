"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function EstimationIAButton({
  bienId,
  hasEstimation,
}: {
  bienId: string;
  hasEstimation: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/biens/${bienId}/estimation-ia`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Échec de la génération.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={generate} disabled={loading} className="btn btn-primary btn-sm" type="button">
        <Sparkles size={14} />
        {loading ? "Calcul…" : hasEstimation ? "Recalculer l'estimation IA" : "Générer l'estimation IA"}
      </button>
      {error && <p className="text-sm text-[var(--danger)] mt-2">{error}</p>}
    </div>
  );
}
