import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { ClipboardCheck, ArrowLeft } from "lucide-react";
import { hasPermission } from "@/types";
import AffectationForm from "./AffectationForm";

export default async function NouvelleAffectationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role as Role;
  if (!hasPermission(role, "EXPERTISE_AFFECTER")) redirect("/dashboard/expertises");

  const [biens, expertsRaw] = await Promise.all([
    prisma.bienSaisi.findMany({
      select: {
        id: true,
        categorie: true,
        sousCategorie: true,
        dossier: { select: { referenceJudiciaire: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.utilisateur.findMany({
      where: { role: Role.EXPERT, compteBloque: false },
      select: {
        id: true,
        nom: true,
        prenom: true,
        notationsRecues: { select: { note: true } },
        _count: { select: { affectationsExpert: true } },
      },
      orderBy: { nom: "asc" },
    }),
  ]);

  const biensOptions = biens.map((b) => ({
    id: b.id,
    categorie: b.categorie,
    sousCategorie: b.sousCategorie,
    reference: b.dossier.referenceJudiciaire,
  }));

  const experts = expertsRaw.map((e) => {
    const notes = e.notationsRecues.map((n) => n.note);
    const noteMoyenne =
      notes.length > 0 ? Number((notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1)) : null;
    return {
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      noteMoyenne,
      nbAffectations: e._count.affectationsExpert,
    };
  });

  return (
    <div>
      <Link
        href="/dashboard/expertises"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] mb-6"
      >
        <ArrowLeft size={14} /> Retour aux expertises
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <ClipboardCheck size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Affecter un expert</h1>
      </div>

      <AffectationForm biens={biensOptions} experts={experts} />
    </div>
  );
}
