import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Package, MapPin, QrCode, Tag, DollarSign } from "lucide-react";

export default async function BienDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const bien = await prisma.bienSaisi.findUnique({
    where: { id },
    include: { dossier: true, medias: true, estimationIA: true },
  });

  if (!bien) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Package size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Détail du bien</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-surface p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={18} className="text-[var(--ink-muted)]" />
            <span className="badge badge-brand">{bien.categorie}</span>
          </div>
          <p className="text-[var(--ink-secondary)]">
            <span className="font-medium text-[var(--ink)]">Description :</span>{" "}
            {bien.description}
          </p>
          <p className="flex items-center gap-2 text-[var(--ink-secondary)]">
            <MapPin size={18} className="text-[var(--ink-muted)]" />
            <span className="font-medium text-[var(--ink)]">Localisation :</span>{" "}
            {bien.localisation}
          </p>
          <p className="text-[var(--ink-secondary)]">
            <span className="font-medium text-[var(--ink)]">État :</span> {bien.etatGeneral}
          </p>
        </div>

        <div className="glass-surface p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={22} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Valorisation</h2>
          </div>
          <p className="text-[var(--ink-secondary)]">
            <span className="font-medium text-[var(--ink)]">Valeur estimée :</span>{" "}
            <span className="text-price">{bien.valeurEstimee.toString()} FCFA</span>
          </p>
          {bien.estimationIA && (
            <p className="text-[var(--ink-secondary)]">
              <span className="font-medium text-[var(--ink)]">Estimation IA :</span>{" "}
              <span className="text-price">{bien.estimationIA.valeurPredite.toString()} FCFA</span>
              <span className="text-sm text-[var(--ink-muted)] ml-2">
                (confiance : {(bien.estimationIA.indiceConfiance * 100).toFixed(0)}%)
              </span>
            </p>
          )}
          {bien.qrCode && (
            <p className="flex items-center gap-2 text-[var(--ink-secondary)]">
              <QrCode size={18} className="text-[var(--ink-muted)]" />
              <span className="font-medium text-[var(--ink)]">QR Code :</span> {bien.qrCode}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
