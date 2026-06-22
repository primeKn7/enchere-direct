import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";

export default async function AdjudicationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const adjudications = await prisma.adjudication.findMany({
    where:
      session.user.role === "COMMISSAIRE_PRISEUR"
        ? {}
        : { adjudicataireId: session.user.id },
    include: {
      enchere: { include: { lot: { include: { bien: { select: { description: true } } } } } },
    },
    orderBy: { dateAdjudication: "desc" },
    take: 20,
  });

  return (
    <div>
      <h1 className="mb-8">Adjudications</h1>

      {adjudications.length === 0 ? (
        <EmptyState
          title="Aucune adjudication"
          description="Les biens qui vous sont adjugés à l'issue d'une enchère apparaîtront ici. Participez aux enchères en cours pour remporter un bien."
          illustration="award"
          action={{ label: "Voir les enchères", href: "/dashboard/encheres" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Bien</th>
                <th>Montant final</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {adjudications.map((a) => (
                <tr key={a.id}>
                  <td className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                    {a.enchere.lot.bien.description.slice(0, 80)}
                  </td>
                  <td className="text-price">{a.montantFinal.toString()} FCFA</td>
                  <td className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
                    {new Date(a.dateAdjudication).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
