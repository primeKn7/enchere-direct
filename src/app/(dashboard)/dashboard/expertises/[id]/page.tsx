import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import {
  ClipboardCheck,
  ArrowLeft,
  Package,
  UserCheck,
  CalendarClock,
  DollarSign,
  Sparkles,
  FileText,
  Star,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { hasPermission } from "@/types";
import RapportForm from "./RapportForm";
import ValidationActions from "./ValidationActions";
import EstimationIAButton from "./EstimationIAButton";

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
  SOUMIS: "Soumis",
  VALIDE: "Validé",
  REJETE: "Rejeté",
};

export default async function ExpertiseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role as Role;
  if (!hasPermission(role, "EXPERTISE_LIRE")) redirect("/dashboard");

  const { id } = await params;

  const affectation = await prisma.affectationExpertise.findUnique({
    where: { id },
    include: {
      expert: { select: { id: true, nom: true, prenom: true, numeroAgrement: true } },
      assignePar: { select: { nom: true, prenom: true } },
      bien: {
        include: {
          dossier: { select: { id: true, referenceJudiciaire: true } },
          estimationIA: true,
          _count: { select: { medias: true } },
        },
      },
      rapport: {
        include: {
          valideePar: { select: { nom: true, prenom: true } },
          notation: true,
        },
      },
    },
  });

  if (!affectation) notFound();

  // Un expert ne peut voir que ses propres affectations.
  if (role === Role.EXPERT && affectation.expertId !== session.user.id) {
    redirect("/dashboard/expertises");
  }

  const { bien, rapport } = affectation;
  const isAssignedExpert = role === Role.EXPERT && affectation.expertId === session.user.id;
  const canValider = hasPermission(role, "EXPERTISE_VALIDER");
  const canEstimer = hasPermission(role, "ESTIMATION_GENERER");
  const canRediger = isAssignedExpert && rapport?.statutValidation !== "VALIDE";

  const estim = bien.estimationIA;
  const params2 = (estim?.parametres ?? {}) as Record<string, unknown>;

  return (
    <div>
      <Link
        href="/dashboard/expertises"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] mb-6"
      >
        <ArrowLeft size={14} /> Retour aux expertises
      </Link>

      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <ClipboardCheck size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Expertise du bien</h1>
        <span className="badge badge-subtle">{bien.categorie}</span>
        <span className={`badge ${AFFECTATION_BADGE[affectation.statut]}`}>
          {AFFECTATION_LABEL[affectation.statut]}
        </span>
      </div>

      {/* Cartes d'information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Bien */}
        <div className="glass-surface p-6 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Package size={20} className="text-[var(--accent)]" />
            <h3 className="text-[var(--ink)] font-semibold">Bien concerné</h3>
          </div>
          <InfoRow label="Catégorie" value={bien.categorie} />
          <InfoRow label="Sous-catégorie" value={bien.sousCategorie ?? "—"} />
          <InfoRow label="État général" value={bien.etatGeneral} />
          <InfoRow
            label="Dossier"
            value={bien.dossier.referenceJudiciaire}
            icon={<FileText size={14} className="text-[var(--ink-muted)]" />}
          />
          <div>
            <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">Description</span>
            <p className="text-[var(--ink)] mt-1 whitespace-pre-wrap text-sm">{bien.description}</p>
          </div>
          <Link
            href={`/dashboard/inventaire/${bien.id}`}
            className="text-sm text-[var(--accent)] hover:underline inline-block"
          >
            Voir la fiche complète →
          </Link>
        </div>

        {/* Affectation */}
        <div className="glass-surface p-6 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={20} className="text-[var(--accent)]" />
            <h3 className="text-[var(--ink)] font-semibold">Affectation</h3>
          </div>
          <InfoRow label="Expert" value={`${affectation.expert.prenom} ${affectation.expert.nom}`} />
          <InfoRow label="Agrément" value={affectation.expert.numeroAgrement ?? "—"} />
          <InfoRow label="Affecté par" value={`${affectation.assignePar.prenom} ${affectation.assignePar.nom}`} />
          {affectation.dateLimite && (
            <InfoRow
              label="Échéance"
              value={new Date(affectation.dateLimite).toLocaleDateString("fr-FR")}
              icon={<CalendarClock size={14} className="text-[var(--ink-muted)]" />}
            />
          )}
          {affectation.consigne && (
            <div>
              <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">Consigne</span>
              <p className="text-[var(--ink)] mt-1 text-sm whitespace-pre-wrap">{affectation.consigne}</p>
            </div>
          )}
        </div>

        {/* Valorisation */}
        <div className="glass-surface p-6 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={20} className="text-[var(--accent)]" />
            <h3 className="text-[var(--ink)] font-semibold">Valorisation</h3>
          </div>
          <div>
            <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">Valeur de référence</span>
            <p className="text-xl font-bold text-[var(--ink)] mt-1">
              {Number(bien.valeurEstimee).toLocaleString("fr-FR")} FCFA
            </p>
          </div>
          {rapport?.statutValidation === "VALIDE" && (
            <div>
              <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">Valeur experte (validée)</span>
              <p className="text-xl font-bold text-[var(--success)] mt-1">
                {Number(rapport.valeurEstimee).toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          )}
          {estim && (
            <div>
              <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">Estimation IA</span>
              <p className="text-xl font-bold text-[var(--accent)] mt-1">
                {Number(estim.valeurPredite).toLocaleString("fr-FR")} FCFA
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                Confiance : {(estim.indiceConfiance * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Estimation IA (outil) */}
      {canEstimer && (
        <div className="glass-surface p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-[var(--accent)]" />
            <h3 className="text-[var(--ink)] font-semibold">Outil d&apos;estimation automatique</h3>
          </div>
          <p className="text-sm text-[var(--ink-muted)] mb-4">
            Estimation heuristique calculée à partir de la valeur de référence, de l&apos;état du bien, de sa
            catégorie et de sa documentation. À utiliser comme aide à la décision, en complément de l&apos;expertise humaine.
          </p>
          {estim && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <Param label="Facteur état" value={String(params2.facteurEtat ?? "—")} />
              <Param label="Facteur catégorie" value={String(params2.facteurCategorie ?? "—")} />
              <Param label="Volatilité" value={String(params2.volatiliteCategorie ?? "—")} />
              <Param label="Méthode" value={String(params2.methode ?? "—")} />
            </div>
          )}
          <EstimationIAButton bienId={bien.id} hasEstimation={Boolean(estim)} />
        </div>
      )}

      {/* Rapport d'expertise */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={22} className="text-[var(--accent)]" />
          <h3 className="text-lg font-semibold text-[var(--ink)]">Rapport d&apos;expertise</h3>
          {rapport && (
            <span className={`badge ${RAPPORT_BADGE[rapport.statutValidation]}`}>
              {RAPPORT_LABEL[rapport.statutValidation]}
            </span>
          )}
        </div>

        {/* Rapport existant */}
        {rapport && (
          <div className="glass-surface p-6 space-y-4 mb-6">
            {rapport.statutValidation === "REJETE" && rapport.motifRejet && (
              <div className="alert alert-danger flex items-start gap-2">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                <span>
                  <strong>Rapport rejeté.</strong> {rapport.motifRejet}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                label="Valeur estimée par l'expert"
                value={`${Number(rapport.valeurEstimee).toLocaleString("fr-FR")} FCFA`}
              />
              <InfoRow label="Méthodologie" value={rapport.methodologie ?? "—"} />
            </div>
            <div>
              <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">Contenu</span>
              <p className="text-[var(--ink)] mt-1 whitespace-pre-wrap text-sm">{rapport.contenu}</p>
            </div>

            {rapport.statutValidation === "VALIDE" && (
              <div className="pt-3 border-t border-[var(--border)] space-y-2">
                <p className="flex items-center gap-1.5 text-sm text-[var(--success)]">
                  <ShieldCheck size={15} /> Validé par {rapport.valideePar?.prenom}{" "}
                  {rapport.valideePar?.nom}
                  {rapport.dateValidation
                    ? ` le ${new Date(rapport.dateValidation).toLocaleDateString("fr-FR")}`
                    : ""}
                </p>
                {rapport.notation && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--ink-muted)]">Note de l&apos;expert :</span>
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={16}
                          fill={n <= rapport.notation!.note ? "var(--accent-gold)" : "none"}
                          color={n <= rapport.notation!.note ? "var(--accent-gold)" : "var(--border-strong)"}
                        />
                      ))}
                    </span>
                    {rapport.notation.commentaire && (
                      <span className="text-sm text-[var(--ink-muted)]">
                        — {rapport.notation.commentaire}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Formulaire de rédaction (expert) */}
        {canRediger && (
          <div className="mb-6">
            {rapport?.statutValidation === "REJETE" && (
              <p className="text-sm text-[var(--ink-muted)] mb-3">
                Corrigez votre rapport puis soumettez-le à nouveau.
              </p>
            )}
            {!rapport && (
              <p className="text-sm text-[var(--ink-muted)] mb-3">
                Rédigez votre rapport d&apos;expertise pour ce bien.
              </p>
            )}
            <RapportForm
              affectationId={affectation.id}
              initial={
                rapport
                  ? {
                      valeurEstimee: String(Number(rapport.valeurEstimee)),
                      methodologie: rapport.methodologie ?? "",
                      contenu: rapport.contenu,
                    }
                  : undefined
              }
            />
          </div>
        )}

        {/* Actions de validation (validateur) */}
        {canValider && rapport?.statutValidation === "SOUMIS" && (
          <ValidationActions affectationId={affectation.id} />
        )}

        {/* État vide */}
        {!rapport && !canRediger && (
          <div className="glass-surface p-8 text-center">
            <FileText size={40} className="mx-auto mb-3 text-[var(--ink-disabled)]" />
            <p className="text-[var(--ink-muted)]">
              L&apos;expert n&apos;a pas encore soumis son rapport.
            </p>
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
      <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">{label}</span>
      <p className="text-[var(--ink)] font-medium flex items-center gap-1.5 mt-0.5">
        {icon}
        {value}
      </p>
    </div>
  );
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--surface-sunken)] px-3 py-2">
      <span className="text-xs text-[var(--ink-muted)] block">{label}</span>
      <span className="text-[var(--ink)] font-medium font-mono text-sm">{value}</span>
    </div>
  );
}
