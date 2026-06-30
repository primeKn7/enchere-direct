import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Role, StatutEnchere, StatutOffre, StatutDossier } from "@prisma/client";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";

function formatDate() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PageHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1>{title}</h1>
      <span className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
        {formatDate()}
      </span>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { user } = session;
  const role = user.role as Role;

  if (role === Role.AGENT_AES) return <AgentAESDashboard userId={user.id} />;
  if (role === Role.CITOYEN || role === Role.ENTREPRISE) return <CitoyenDashboard userId={user.id} />;
  if (role === Role.COMMISSAIRE_PRISEUR) return <CommissaireDashboard userId={user.id} />;
  if (role === Role.ADMINISTRATEUR) return <AdminDashboard />;
  if (role === Role.MAGISTRAT) return <MagistratDashboard userId={user.id} email={user.email!} />;

  return (
    <div>
      <PageHeader title="Tableau de bord" />
      <div className="card p-8 text-center">
        <p className="text-[14px]" style={{ color: "var(--ink-muted)" }}>
          Votre tableau de bord sera bientôt disponible.
        </p>
      </div>
    </div>
  );
}

async function AgentAESDashboard({ userId }: { userId: string }) {
  const [dossiersEnCours, dossiersEnAttente, alertes, biens] = await Promise.all([
    prisma.dossierSaisie.count({ where: { statut: { notIn: [StatutDossier.CLOTURE] } } }),
    prisma.dossierSaisie.count({ where: { statut: StatutDossier.EN_ATTENTE } }),
    prisma.alerteFraude.count({ where: { traite: false } }),
    prisma.bienSaisi.count(),
  ]);

  return (
    <div>
      <PageHeader title="Tableau de bord" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Dossiers en cours" value={dossiersEnCours} href="/dashboard/saisies" />
        <StatCard label="En attente" value={dossiersEnAttente} />
        <StatCard label="Alertes fraude" value={alertes} href="/dashboard/fraude" />
        <StatCard label="Biens inventoriés" value={biens} href="/dashboard/inventaire" />
      </div>
    </div>
  );
}

async function CitoyenDashboard({ userId }: { userId: string }) {
  const [encheresActives, offresActives, adjudications, portefeuille] = await Promise.all([
    prisma.enchere.count({
      where: { statut: { in: [StatutEnchere.EN_COURS, StatutEnchere.PROLONGEE] }, lot: { publie: true } },
    }),
    prisma.offre.count({
      where: { utilisateurId: userId, statut: { in: [StatutOffre.EN_ATTENTE, StatutOffre.ACCEPTEE] } },
    }),
    prisma.adjudication.count({ where: { adjudicataireId: userId } }),
    prisma.portefeuille.findUnique({ where: { utilisateurId: userId }, select: { soldeDisponible: true } }),
  ]);

  const [encheres, offres] = await Promise.all([
    prisma.enchere.findMany({
      where: {
        statut: { in: [StatutEnchere.EN_COURS, StatutEnchere.PROLONGEE] },
        lot: { publie: true },
      },
      include: {
        lot: { include: { bien: { select: { description: true, localisation: true, categorie: true } } } },
      },
      take: 5,
      orderBy: { dateFin: "asc" },
    }),
    prisma.offre.findMany({
      where: { utilisateurId: userId, statut: { in: [StatutOffre.EN_ATTENTE, StatutOffre.ACCEPTEE] } },
      include: { enchere: { select: { id: true, montantActuel: true, dateFin: true } } },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const solde = portefeuille ? Number(portefeuille.soldeDisponible).toLocaleString("fr-FR") : "0";

  return (
    <div>
      <PageHeader title="Tableau de bord" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Enchères actives" value={encheresActives} href="/dashboard/encheres" />
        <StatCard label="Mes offres" value={offresActives} />
        <StatCard label="Adjudications" value={adjudications} href="/dashboard/adjudication" />
        <StatCard label="Solde FCFA" value={solde} href="/dashboard/portefeuille" />
      </div>

      <section className="mb-8">
        <SectionHeader title="Enchères en cours" count={encheres.length} href="/dashboard/encheres" />
        {encheres.length === 0 ? (
          <EmptyState
            title="Aucune enchère pour le moment"
            description="Les enchères en cours apparaîtront ici dès qu'elles seront publiées. Consultez le catalogue pour découvrir les biens disponibles."
            illustration="auction"
            action={{ label: "Explorer le catalogue", href: "/dashboard/catalogue" }}
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Bien</th>
                  <th>Catégorie</th>
                  <th>Montant actuel</th>
                  <th>Fin</th>
                </tr>
              </thead>
              <tbody>
                {encheres.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link
                        href={`/dashboard/encheres/${e.id}`}
                        className="text-[14px] font-medium hover:underline"
                        style={{ color: "var(--ink)" }}
                      >
                        {e.lot.bien.description.slice(0, 60)}
                      </Link>
                    </td>
                    <td>
                      <span className="badge badge-subtle">{e.lot.bien.categorie}</span>
                    </td>
                    <td className="text-price">{e.montantActuel.toString()} FCFA</td>
                    <td className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
                      {new Date(e.dateFin).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Mes offres" count={offres.length} />
        {offres.length === 0 ? (
          <EmptyState
            title="Aucune offre déposée"
            description="Vos offres sur les enchères en cours s'afficheront ici. Parcourez les enchères actives pour placer votre première offre."
            illustration="list"
            action={{ label: "Voir les enchères", href: "/dashboard/encheres" }}
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Enchère actuelle</th>
                </tr>
              </thead>
              <tbody>
                {offres.map((o) => (
                  <tr key={o.id}>
                    <td className="text-price">{o.montant.toString()} FCFA</td>
                    <td>
                      <span className={`badge ${o.statut === "ACCEPTEE" ? "badge-success" : "badge-warning"}`}>
                        {o.statut}
                      </span>
                    </td>
                    <td className="text-[14px]" style={{ color: "var(--ink-secondary)" }}>
                      {o.enchere.montantActuel.toString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

async function CommissaireDashboard({ userId }: { userId: string }) {
  const [total, actives, planifiees, adjudications] = await Promise.all([
    prisma.enchere.count({ where: { commissairePriseurId: userId } }),
    prisma.enchere.count({ where: { commissairePriseurId: userId, statut: { in: [StatutEnchere.EN_COURS, StatutEnchere.PROLONGEE] } } }),
    prisma.enchere.count({ where: { commissairePriseurId: userId, statut: StatutEnchere.PLANIFIEE } }),
    prisma.adjudication.count({ where: { enchere: { commissairePriseurId: userId } } }),
  ]);

  const encheres = await prisma.enchere.findMany({
    where: {
      commissairePriseurId: userId,
      statut: { in: [StatutEnchere.PLANIFIEE, StatutEnchere.EN_COURS, StatutEnchere.PROLONGEE] },
    },
    include: { lot: { include: { bien: { select: { description: true, categorie: true } } } } },
    take: 6,
    orderBy: { dateDebut: "asc" },
  });

  return (
    <div>
      <PageHeader title="Tableau de bord" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total enchères" value={total} />
        <StatCard label="Actives" value={actives} />
        <StatCard label="Planifiées" value={planifiees} />
        <StatCard label="Adjudications" value={adjudications} href="/dashboard/adjudication" />
      </div>

      <section>
        <SectionHeader title="Mes enchères" count={encheres.length} href="/dashboard/encheres" />
        {encheres.length === 0 ? (
          <EmptyState
            title="Aucune enchère en cours"
            description="Vos enchères planifiées et actives apparaîtront ici. Créez une nouvelle enchère depuis la gestion de l'inventaire."
            illustration="auction"
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Bien</th>
                  <th>Catégorie</th>
                  <th>Statut</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {encheres.map((e) => (
                  <tr key={e.id}>
                    <td className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                      {e.lot.bien.description.slice(0, 60)}
                    </td>
                    <td>
                      <span className="badge badge-subtle">{e.lot.bien.categorie}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        e.statut === "EN_COURS" || e.statut === "PROLONGEE" ? "badge-success" : "badge-warning"
                      }`}>
                        {e.statut}
                      </span>
                    </td>
                    <td className="text-price">{e.montantActuel.toString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

async function AdminDashboard() {
  const [users, dossiers, encheres, offres, adjudications, alertes] = await Promise.all([
    prisma.utilisateur.count(),
    prisma.dossierSaisie.count(),
    prisma.enchere.count(),
    prisma.offre.count(),
    prisma.adjudication.count(),
    prisma.alerteFraude.count({ where: { traite: false } }),
  ]);

  return (
    <div>
      <PageHeader title="Tableau de bord" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Utilisateurs" value={users} href="/dashboard/utilisateurs" />
        <StatCard label="Dossiers" value={dossiers} href="/dashboard/saisies" />
        <StatCard label="Enchères" value={encheres} href="/dashboard/encheres" />
        <StatCard label="Offres" value={offres} />
        <StatCard label="Adjudications" value={adjudications} href="/dashboard/adjudication" />
        <StatCard label="Alertes fraude" value={alertes} href="/dashboard/fraude" />
      </div>
    </div>
  );
}

async function MagistratDashboard({ userId, email }: { userId: string; email: string }) {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: userId },
    select: { jurisdiction: true },
  });

  const jurisdiction = utilisateur?.jurisdiction ?? email;
  const [dossiers, enAttente] = await Promise.all([
    prisma.dossierSaisie.count({ where: { jurisdictionCompetente: jurisdiction } }),
    prisma.dossierSaisie.count({ where: { jurisdictionCompetente: jurisdiction, statut: StatutDossier.EN_ATTENTE } }),
  ]);

  return (
    <div>
      <PageHeader title="Tableau de bord" />
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="Dossiers (juridiction)" value={dossiers} href="/dashboard/saisies" />
        <StatCard label="En attente" value={enAttente} />
      </div>
    </div>
  );
}
