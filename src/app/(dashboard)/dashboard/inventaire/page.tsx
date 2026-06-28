import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import {
  Package,
  ArrowRight,
  FileText,
  Plus,
  Camera,
  QrCode,
  MapPin,
} from "lucide-react";
import { hasPermission } from "@/types";

export default async function InventairePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role as Role;
  const canCreate = hasPermission(role, "DOSSIER_CREER") || role === Role.COMMISSAIRE_PRISEUR;

  const biens = await prisma.bienSaisi.findMany({
    include: {
      dossier: { select: { referenceJudiciaire: true } },
      lot: { select: { publie: true } },
      _count: { select: { medias: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package size={28} className="text-[var(--accent)]" />
          <h1 className="text-[var(--ink)]">Inventaire des biens saisis</h1>
        </div>
        {canCreate && (
          <Link href="/dashboard/inventaire/nouveau" className="btn btn-primary">
            <Plus size={16} /> Nouveau bien
          </Link>
        )}
      </div>

      {biens.length === 0 ? (
        <div className="glass-surface p-12 text-center">
          <Package size={48} className="mx-auto mb-4 text-[var(--ink-disabled)]" />
          <p className="text-[var(--ink-muted)] mb-4">Aucun bien enregistré.</p>
          {canCreate && (
            <Link href="/dashboard/inventaire/nouveau" className="btn btn-primary">
              <Plus size={16} /> Enregistrer un bien
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {biens.map((b) => (
            <div key={b.id} className="glass-surface p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="badge badge-subtle">{b.categorie}</span>
                  {b.sousCategorie && (
                    <span className="text-xs text-[var(--ink-muted)]">
                      / {b.sousCategorie}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {b.lot?.publie && (
                    <span className="badge badge-success">Publié</span>
                  )}
                  {b.qrCode && <QrCode size={14} className="text-[var(--ink-muted)]" />}
                </div>
              </div>

              <p className="text-[var(--ink-secondary)] mb-3 line-clamp-2">
                {b.description}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-4">
                <span className="text-price">
                  {Number(b.valeurEstimee).toLocaleString("fr-FR")} FCFA
                </span>
                <span className="flex items-center gap-1 text-[var(--ink-muted)]">
                  <MapPin size={12} /> {b.localisation}
                </span>
                <span className="flex items-center gap-1 text-[var(--ink-muted)]">
                  <Camera size={12} /> {b._count.medias} média(s)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-[var(--ink-muted)]">
                  <FileText size={14} />
                  {b.dossier.referenceJudiciaire}
                </span>
                <Link
                  href={`/dashboard/inventaire/${b.id}`}
                  className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
                >
                  Détails <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
