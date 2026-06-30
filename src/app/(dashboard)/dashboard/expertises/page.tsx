import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Role, Prisma } from "@prisma/client";
import {
  ClipboardCheck,
  Plus,
  ArrowRight,
  Package,
  UserCheck,
  Clock,
  CalendarClock,
} from "lucide-react";
import { hasPermission } from "@/types";

const AFFECTATION_BADGE: Record<string, string> = {
  PROPOSEE: "badge-warning",
  ACCEPTEE: "badge-subtle",
  REFUSEE: "badge-danger",
  TERMINEE: "badge-success",
};

const AFFECTATION_LABEL: Record<string, string> = {
  PROPOSEE: "Proposée",
  ACCEPTEE: "En cours",
  REFUSEE: "Refusée",
  TERMINEE: "Terminée",
};

const RAPPORT_BADGE: Record<string, string> = {
  BROUILLON: "badge-subtle",
  SOUMIS: "badge-warning",
  VALIDE: "badge-success",
  REJETE: "badge-danger",
};

const RAPPORT_LABEL: Record<string, string> = {
  BROUILLON: "Brouillon",
  SOUMIS: "Rapport soumis",
  VALIDE: "Rapport validé",
  REJETE: "Rapport rejeté",
};

export default async function ExpertisesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role as Role;
  if (!hasPermission(role, "EXPERTISE_LIRE")) redirect("/dashboard");

  const canAffecter = hasPermission(role, "EXPERTISE_AFFECTER");
  const isExpert = role === Role.EXPERT;

  const where: Prisma.AffectationExpertiseWhereInput = isExpert
    ? { expertId: session.user.id }
    : {};

  const affectations = await prisma.affectationExpertise.findMany({
    where,
    include: {
      bien: { select: { id: true, categorie: true, sousCategorie: true, description: true } },
      expert: { select: { nom: true, prenom: true } },
      assignePar: { select: { nom: true, prenom: true } },
      rapport: { select: { statutValidation: true, valeurEstimee: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ClipboardCheck size={28} className="text-[var(--accent)]" />
          <h1 className="text-[var(--ink)]">
            {isExpert ? "Mes expertises" : "Expertises des biens"}
          </h1>
        </div>
        {canAffecter && (
          <Link href="/dashboard/expertises/nouvelle" className="btn btn-primary">
            <Plus size={16} /> Affecter un expert
          </Link>
        )}
      </div>

      {affectations.length === 0 ? (
        <div className="glass-surface p-12 text-center">
          <ClipboardCheck size={48} className="mx-auto mb-4 text-[var(--ink-disabled)]" />
          <p className="text-[var(--ink-muted)] mb-4">
            {isExpert
              ? "Aucune expertise ne vous est affectée pour le moment."
              : "Aucune affectation d'expertise enregistrée."}
          </p>
          {canAffecter && (
            <Link href="/dashboard/expertises/nouvelle" className="btn btn-primary">
              <Plus size={16} /> Affecter un expert
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {affectations.map((a) => (
            <div key={a.id} className="glass-surface p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="badge badge-subtle">{a.bien.categorie}</span>
                  {a.bien.sousCategorie && (
                    <span className="text-xs text-[var(--ink-muted)]">/ {a.bien.sousCategorie}</span>
                  )}
                </div>
                <span className={`badge ${AFFECTATION_BADGE[a.statut]}`}>
                  {AFFECTATION_LABEL[a.statut]}
                </span>
              </div>

              <p className="text-[var(--ink-secondary)] mb-3 line-clamp-2">{a.bien.description}</p>

              <div className="flex flex-col gap-1.5 text-sm mb-4">
                {!isExpert && (
                  <span className="flex items-center gap-1.5 text-[var(--ink-muted)]">
                    <UserCheck size={14} /> Expert : {a.expert.prenom} {a.expert.nom}
                  </span>
                )}
                {a.dateLimite && (
                  <span className="flex items-center gap-1.5 text-[var(--ink-muted)]">
                    <CalendarClock size={14} /> Échéance :{" "}
                    {new Date(a.dateLimite).toLocaleDateString("fr-FR")}
                  </span>
                )}
                {a.rapport ? (
                  <span className="flex items-center gap-2">
                    <span className={`badge ${RAPPORT_BADGE[a.rapport.statutValidation]}`}>
                      {RAPPORT_LABEL[a.rapport.statutValidation]}
                    </span>
                    <span className="text-price">
                      {Number(a.rapport.valeurEstimee).toLocaleString("fr-FR")} FCFA
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[var(--ink-muted)]">
                    <Clock size={14} /> En attente du rapport
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-[var(--ink-muted)]">
                  <Package size={14} /> Bien #{a.bien.id.slice(0, 8)}
                </span>
                <Link
                  href={`/dashboard/expertises/${a.id}`}
                  className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
                >
                  {isExpert && !a.rapport ? "Rédiger" : "Détails"} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
