import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Role, StatutDossier } from "@prisma/client";
import { FolderOpen, ArrowRight, Calendar } from "lucide-react";

const statusBadges: Record<StatutDossier, string> = {
  [StatutDossier.EN_ATTENTE]: "badge-warning",
  [StatutDossier.CONFORME]: "badge-subtle",
  [StatutDossier.NON_CONFORME]: "badge-danger",
  [StatutDossier.VALIDE]: "badge-success",
  [StatutDossier.CLOTURE]: "badge-subtle",
};

export default async function SaisiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role as Role;
  const isAllowed =
    role === Role.AGENT_AES || role === Role.MAGISTRAT || role === Role.ADMINISTRATEUR;

  if (!isAllowed) {
    redirect("/dashboard");
  }

  let where: Record<string, unknown> = {};
  if (role === Role.MAGISTRAT) {
    const u = await prisma.utilisateur.findUnique({
      where: { id: session.user.id },
      select: { jurisdiction: true },
    });
    where = { jurisdictionCompetente: u?.jurisdiction ?? "" };
  }

  const dossiers = await prisma.dossierSaisie.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <FolderOpen size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Dossiers de saisie</h1>
      </div>

      <div className="table-wrapper overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Juridiction</th>
              <th>Statut</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dossiers.map((d) => (
              <tr key={d.id}>
                <td className="font-medium text-[var(--ink)]">
                  {d.referenceJudiciaire}
                </td>
                <td>{d.jurisdictionCompetente}</td>
                <td>
                  <span className={`badge ${statusBadges[d.statut]}`}>{d.statut}</span>
                </td>
                <td>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(d.dateSaisie).toLocaleDateString("fr-FR")}
                  </span>
                </td>
                <td>
                  <Link
                    href={`/dashboard/saisies/${d.id}`}
                    className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
                  >
                    Détails <ArrowRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
