import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { FolderOpen, Scale, Package, FileText } from "lucide-react";

export default async function SaisieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const role = session.user.role as Role;

  const dossier = await prisma.dossierSaisie.findUnique({
    where: { id },
    include: { biens: true, documents: true },
  });

  if (!dossier) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <FolderOpen size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">
          Dossier {dossier.referenceJudiciaire}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-surface p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Scale size={22} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Informations</h2>
          </div>
          <p className="text-[var(--ink-secondary)]">
            <span className="font-medium text-[var(--ink)]">Juridiction :</span>{" "}
            {dossier.jurisdictionCompetente}
          </p>
          <p className="text-[var(--ink-secondary)]">
            <span className="font-medium text-[var(--ink)]">Statut :</span>{" "}
            <span className="badge badge-subtle">{dossier.statut}</span>
          </p>
        </div>

        <div className="glass-surface p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Package size={22} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Biens saisis</h2>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">{dossier.biens.length}</p>
        </div>

        <div className="glass-surface p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={22} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Documents</h2>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">{dossier.documents.length}</p>
        </div>
      </div>
    </div>
  );
}
