import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role, StatutDossier, StatutEnchere } from "@prisma/client";
import {
  BarChart3,
  Users,
  FolderOpen,
  Package,
  Gavel,
  HandCoins,
  Award,
  AlertTriangle,
  TrendingUp,
  Percent,
  Banknote,
} from "lucide-react";

export default async function StatistiquesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role as Role;
  if (
    role !== Role.ADMINISTRATEUR &&
    role !== Role.AGENT_AES &&
    role !== Role.COMMISSAIRE_PRISEUR
  ) {
    redirect("/dashboard");
  }

  const [
    totalUtilisateurs,
    totalDossiers,
    dossiersParStatut,
    totalBiens,
    totalLots,
    lotsPublies,
    totalEncheres,
    encheresParStatut,
    totalOffres,
    totalAdjudications,
    totalAlertesFraude,
    alertesNonTraitees,
    recettesResult,
  ] = await Promise.all([
    prisma.utilisateur.count(),
    prisma.dossierSaisie.count(),
    prisma.dossierSaisie.groupBy({ by: ["statut"], _count: true }),
    prisma.bienSaisi.count(),
    prisma.lot.count(),
    prisma.lot.count({ where: { publie: true } }),
    prisma.enchere.count(),
    prisma.enchere.groupBy({ by: ["statut"], _count: true }),
    prisma.offre.count(),
    prisma.adjudication.count(),
    prisma.alerteFraude.count(),
    prisma.alerteFraude.count({ where: { traite: false } }),
    prisma.adjudication.aggregate({ _sum: { montantFinal: true } }),
  ]);

  const encheresStatut: Record<string, number> = {};
  for (const g of encheresParStatut) {
    encheresStatut[g.statut] = g._count;
  }
  const dossiersStatut: Record<string, number> = {};
  for (const g of dossiersParStatut) {
    dossiersStatut[g.statut] = g._count;
  }

  const encheresActives =
    (encheresStatut[StatutEnchere.EN_COURS] ?? 0) +
    (encheresStatut[StatutEnchere.PROLONGEE] ?? 0);

  const tauxEcoulement =
    totalLots > 0
      ? ((totalAdjudications / totalLots) * 100).toFixed(1)
      : "0.0";

  const recettes = recettesResult._sum.montantFinal?.toString() ?? "0";

  const cards = [
    { label: "Utilisateurs", value: totalUtilisateurs, icon: Users, color: "var(--accent)" },
    { label: "Dossiers de saisie", value: totalDossiers, icon: FolderOpen, color: "var(--accent)" },
    { label: "Biens saisis", value: totalBiens, icon: Package, color: "var(--accent)" },
    { label: "Lots publiés", value: `${lotsPublies} / ${totalLots}`, icon: Package, color: "var(--success)" },
    { label: "Enchères actives", value: encheresActives, icon: Gavel, color: "var(--warning)" },
    { label: "Total enchères", value: totalEncheres, icon: Gavel, color: "var(--accent)" },
    { label: "Offres déposées", value: totalOffres, icon: HandCoins, color: "var(--accent)" },
    { label: "Adjudications", value: totalAdjudications, icon: Award, color: "var(--success)" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Statistiques &amp; Tableaux de bord</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="glass-surface p-5">
              <div className="flex items-center gap-3 mb-3">
                <Icon size={22} style={{ color: c.color }} />
                <p className="text-sm text-[var(--ink-muted)]">{c.label}</p>
              </div>
              <p className="text-3xl font-bold text-[var(--ink)]">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <Banknote size={22} className="text-[var(--success)]" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Recettes totales</h2>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">
            {Number(recettes).toLocaleString("fr-FR")} <span className="text-base font-normal">FCFA</span>
          </p>
        </div>

        <div className="glass-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <Percent size={22} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Taux d&apos;écoulement</h2>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">
            {tauxEcoulement} <span className="text-base font-normal">%</span>
          </p>
          <p className="text-sm text-[var(--ink-muted)] mt-1">
            {totalAdjudications} adjudications sur {totalLots} lots
          </p>
        </div>

        <div className="glass-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={22} className="text-[var(--warning)]" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Alertes fraude</h2>
          </div>
          <p className="text-3xl font-bold text-[var(--ink)]">{alertesNonTraitees}</p>
          <p className="text-sm text-[var(--ink-muted)] mt-1">
            non traitées sur {totalAlertesFraude} total
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <FolderOpen size={20} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Dossiers par statut</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(dossiersStatut).map(([statut, count]) => (
              <div key={statut} className="flex items-center justify-between">
                <span className={`badge ${
                  statut === "EN_ATTENTE" ? "badge-warning" :
                  statut === "VALIDE" ? "badge-success" :
                  statut === "NON_CONFORME" ? "badge-danger" :
                  "badge-subtle"
                }`}>{statut}</span>
                <span className="font-semibold text-[var(--ink)]">{count}</span>
              </div>
            ))}
            {Object.keys(dossiersStatut).length === 0 && (
              <p className="text-[14px]" style={{ color: "var(--ink-muted)" }}>Aucun dossier enregistré pour le moment.</p>
            )}
          </div>
        </div>

        <div className="glass-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={20} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Enchères par statut</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(encheresStatut).map(([statut, count]) => (
              <div key={statut} className="flex items-center justify-between">
                <span className={`badge ${
                  statut === "EN_COURS" || statut === "PROLONGEE" ? "badge-success" :
                  statut === "PLANIFIEE" ? "badge-warning" :
                  statut === "CLOTUREE" ? "badge-brand" :
                  "badge-subtle"
                }`}>{statut}</span>
                <span className="font-semibold text-[var(--ink)]">{count}</span>
              </div>
            ))}
            {Object.keys(encheresStatut).length === 0 && (
              <p className="text-[14px]" style={{ color: "var(--ink-muted)" }}>Aucune enchère enregistrée pour le moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
