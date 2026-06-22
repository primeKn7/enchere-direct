import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  UserCircle,
  Mail,
  Phone,
  ShieldCheck,
  Shield,
  Calendar,
  Clock,
  BadgeCheck,
  Building2,
  CreditCard,
  FileText,
  MapPin,
} from "lucide-react";

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.utilisateur.findUnique({
    where: { id: session.user.id },
    include: {
      portefeuille: {
        select: { soldeDisponible: true, soldeBloque: true },
      },
    },
  });

  if (!user) redirect("/login");

  const roleLabels: Record<string, string> = {
    CITOYEN: "Citoyen",
    ENTREPRISE: "Entreprise",
    COMMISSAIRE_PRISEUR: "Commissaire-Priseur",
    AGENT_AES: "Agent AES",
    MAGISTRAT: "Magistrat",
    DOUANIER: "Douanier",
    TRESOR_PUBLIC: "Trésor Public",
    ADMINISTRATEUR: "Administrateur Système",
  };

  const fields: { label: string; value: string | null; icon: React.ElementType }[] = [
    { label: "Nom", value: user.nom, icon: UserCircle },
    { label: "Prénom", value: user.prenom, icon: UserCircle },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Téléphone", value: user.telephone, icon: Phone },
    { label: "Rôle", value: roleLabels[user.role] ?? user.role, icon: ShieldCheck },
  ];

  if (user.numeroCNI) {
    fields.push({ label: "N° CNI", value: user.numeroCNI, icon: FileText });
  }
  if (user.raisonSociale) {
    fields.push({ label: "Raison sociale", value: user.raisonSociale, icon: Building2 });
  }
  if (user.numeroRCCM) {
    fields.push({ label: "N° RCCM", value: user.numeroRCCM, icon: CreditCard });
  }
  if (user.numeroAgrement) {
    fields.push({ label: "N° Agrément", value: user.numeroAgrement, icon: BadgeCheck });
  }
  if (user.jurisdiction) {
    fields.push({ label: "Juridiction", value: user.jurisdiction, icon: MapPin });
  }
  if (user.posteAffectation) {
    fields.push({ label: "Poste d'affectation", value: user.posteAffectation, icon: MapPin });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <UserCircle size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Mon profil</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-surface p-6">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-6">Informations personnelles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-start gap-3">
                  <Icon size={18} className="text-[var(--ink-muted)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--ink-muted)]">{f.label}</p>
                    <p className="font-medium text-[var(--ink)]">{f.value ?? "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-surface p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Sécurité</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield size={18} className={user.mfaActif ? "text-[var(--success)]" : "text-[var(--ink-muted)]"} />
                <div>
                  <p className="text-sm text-[var(--ink-secondary)]">MFA (Double authentification)</p>
                  <span className={`badge ${user.mfaActif ? "badge-success" : "badge-warning"}`}>
                    {user.mfaActif ? "Activé" : "Désactivé"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BadgeCheck size={18} className={user.compteVerifie ? "text-[var(--success)]" : "text-[var(--ink-muted)]"} />
                <div>
                  <p className="text-sm text-[var(--ink-secondary)]">Compte vérifié</p>
                  <span className={`badge ${user.compteVerifie ? "badge-success" : "badge-warning"}`}>
                    {user.compteVerifie ? "Vérifié" : "Non vérifié"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-surface p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Activité</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-[var(--ink-muted)]" />
                <div>
                  <p className="text-xs text-[var(--ink-muted)]">Inscription</p>
                  <p className="text-sm text-[var(--ink)]">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-[var(--ink-muted)]" />
                <div>
                  <p className="text-xs text-[var(--ink-muted)]">Dernière connexion</p>
                  <p className="text-sm text-[var(--ink)]">
                    {user.derniereConnexion
                      ? new Date(user.derniereConnexion).toLocaleString("fr-FR")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {user.portefeuille && (
            <div className="glass-surface p-6">
              <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Portefeuille</h2>
              <div className="space-y-2">
                <p className="text-sm text-[var(--ink-secondary)]">
                  Disponible :{" "}
                  <span className="font-semibold text-[var(--ink)]">
                    {Number(user.portefeuille.soldeDisponible).toLocaleString("fr-FR")} FCFA
                  </span>
                </p>
                <p className="text-sm text-[var(--ink-secondary)]">
                  Bloqué :{" "}
                  <span className="font-semibold text-[var(--ink)]">
                    {Number(user.portefeuille.soldeBloque).toLocaleString("fr-FR")} FCFA
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
