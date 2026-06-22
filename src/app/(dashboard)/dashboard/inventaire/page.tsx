import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ArrowRight, FileText } from "lucide-react";

export default async function InventairePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const biens = await prisma.bienSaisi.findMany({
    include: {
      dossier: { select: { referenceJudiciaire: true } },
      lot: { select: { publie: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Package size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Inventaire des biens saisis</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {biens.map((b) => (
          <div key={b.id} className="glass-surface p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="badge badge-brand">{b.categorie}</span>
              {b.lot?.publie && <span className="badge badge-success">Publié</span>}
            </div>
            <p className="text-[var(--ink-secondary)] mb-3">{b.description.slice(0, 120)}...</p>
            <p className="text-sm text-[var(--ink-secondary)] mb-1">
              Valeur estimée :{" "}
              <span className="text-price-start">{b.valeurEstimee.toString()} FCFA</span>
            </p>
            <p className="flex items-center gap-2 text-sm text-[var(--ink-muted)] mb-4">
              <FileText size={14} />
              Dossier : {b.dossier.referenceJudiciaire}
            </p>
            <Link
              href={`/dashboard/inventaire/${b.id}`}
              className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
            >
              Détails <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
