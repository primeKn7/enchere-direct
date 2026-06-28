import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import {
  FolderOpen,
  Scale,
  Package,
  FileText,
  User,
  Landmark,
  Gavel,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { hasPermission } from "@/types";
import DocumentUpload from "./DocumentUpload";

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
    include: {
      agentAes: { select: { nom: true, prenom: true } },
      biens: true,
      documents: { where: { archive: false }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!dossier) notFound();

  const canUpload = hasPermission(role, "DOSSIER_CREER");

  const statusBadge: Record<string, string> = {
    EN_ATTENTE: "badge-warning",
    CONFORME: "badge-subtle",
    NON_CONFORME: "badge-danger",
    VALIDE: "badge-success",
    CLOTURE: "badge-subtle",
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const typeLabels: Record<string, string> = {
    PV_SAISIE: "PV de saisie",
    JUGEMENT: "Jugement",
    ORDONNANCE: "Ordonnance",
    EXPERTISE: "Expertise",
  };

  const formatBadge: Record<string, string> = {
    PDF: "badge-danger",
    DOCX: "badge-subtle",
    IMAGE: "badge-success",
    VIDEO: "badge-warning",
  };

  return (
    <div>
      <Link
        href="/dashboard/saisies"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] mb-6"
      >
        <ArrowLeft size={14} /> Retour aux dossiers
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <FolderOpen size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">
          Dossier {dossier.referenceJudiciaire}
        </h1>
        <span className={`badge ${statusBadge[dossier.statut]}`}>
          {dossier.statut}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-surface p-6 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Scale size={20} className="text-[var(--accent)]" />
            <h3 className="text-[var(--ink)] font-semibold">Informations judiciaires</h3>
          </div>
          <InfoRow label="Référence" value={dossier.referenceJudiciaire} />
          <InfoRow label="Juridiction" value={dossier.jurisdictionCompetente} />
          <InfoRow
            label="Date de saisie"
            value={new Date(dossier.dateSaisie).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            icon={<Calendar size={14} className="text-[var(--ink-muted)]" />}
          />
          <InfoRow
            label="Agent AES"
            value={`${dossier.agentAes.prenom} ${dossier.agentAes.nom}`}
          />
        </div>

        <div className="glass-surface p-6 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <User size={20} className="text-[var(--accent)]" />
            <h3 className="text-[var(--ink)] font-semibold">Parties concernées</h3>
          </div>
          <InfoRow
            label="Propriétaire"
            value={dossier.identiteProprietaire}
            icon={<User size={14} className="text-[var(--ink-muted)]" />}
          />
          <InfoRow
            label="Créancier"
            value={dossier.creancier}
            icon={<Landmark size={14} className="text-[var(--ink-muted)]" />}
          />
          <InfoRow
            label="Huissier"
            value={dossier.huissierInstrumentaire}
            icon={<Gavel size={14} className="text-[var(--ink-muted)]" />}
          />
        </div>

        <div className="glass-surface p-6 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Package size={20} className="text-[var(--accent)]" />
            <h3 className="text-[var(--ink)] font-semibold">Résumé</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--ink-muted)]">Biens saisis</span>
            <span className="text-2xl font-bold text-[var(--ink)]">
              {dossier.biens.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--ink-muted)]">Documents GED</span>
            <span className="text-2xl font-bold text-[var(--ink)]">
              {dossier.documents.length}
            </span>
          </div>
        </div>
      </div>

      {/* GED Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={22} className="text-[var(--accent)]" />
          <h3 className="text-lg font-semibold text-[var(--ink)]">
            Gestion Électronique des Documents
          </h3>
        </div>

        {canUpload && <DocumentUpload dossierId={dossier.id} />}

        {dossier.documents.length === 0 ? (
          <div className="glass-surface p-8 text-center">
            <FileText
              size={40}
              className="mx-auto mb-3 text-[var(--ink-disabled)]"
            />
            <p className="text-[var(--ink-muted)]">Aucun document ajouté.</p>
          </div>
        ) : (
          <div className="table-wrapper overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom du fichier</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Taille</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dossier.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="font-medium text-[var(--ink)]">
                      {doc.nomFichier}
                    </td>
                    <td>{typeLabels[doc.type] ?? doc.type}</td>
                    <td>
                      <span className={`badge ${formatBadge[doc.format] ?? "badge-subtle"}`}>
                        {doc.format}
                      </span>
                    </td>
                    <td className="text-mono">{formatSize(doc.tailleFichier)}</td>
                    <td>
                      {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      <a
                        href={doc.urlStockage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--accent)] hover:underline"
                      >
                        Ouvrir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
        {label}
      </span>
      <p className="text-[var(--ink)] font-medium flex items-center gap-1.5 mt-0.5">
        {icon}
        {value}
      </p>
    </div>
  );
}
