"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { registerSchema, RegisterInput } from "@/lib/validators";
import Link from "next/link";
import { UserCircle, Building2, Briefcase, Scale, Truck, Shield, Landmark, Crown, AlertCircle, ArrowRight } from "lucide-react";

const ROLE_LABELS: Record<Role, string> = {
  CITOYEN: "Citoyen",
  ENTREPRISE: "Entreprise",
  COMMISSAIRE_PRISEUR: "Commissaire-Priseur",
  AGENT_AES: "Agent AES",
  MAGISTRAT: "Magistrat",
  DOUANIER: "Douanier",
  TRESOR_PUBLIC: "Trésor Public",
  ADMINISTRATEUR: "Administrateur",
};

const ROLE_ICONS: Record<Role, React.ElementType> = {
  CITOYEN: UserCircle,
  ENTREPRISE: Building2,
  COMMISSAIRE_PRISEUR: Briefcase,
  AGENT_AES: Shield,
  MAGISTRAT: Scale,
  DOUANIER: Truck,
  TRESOR_PUBLIC: Landmark,
  ADMINISTRATEUR: Crown,
};

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(Role.CITOYEN);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    console.log("[REGISTER FORM] Submit intercepté");

    setErrors({});
    setServerError("");

    const formData = new FormData(e.currentTarget);
    const data: Partial<RegisterInput> = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      nom: formData.get("nom") as string,
      prenom: formData.get("prenom") as string,
      telephone: (formData.get("telephone") as string) || undefined,
      role,
      numeroCNI: (formData.get("numeroCNI") as string) || undefined,
      numeroRCCM: (formData.get("numeroRCCM") as string) || undefined,
      raisonSociale: (formData.get("raisonSociale") as string) || undefined,
      numeroAgrement: (formData.get("numeroAgrement") as string) || undefined,
      jurisdiction: (formData.get("jurisdiction") as string) || undefined,
      posteAffectation: (formData.get("posteAffectation") as string) || undefined,
    };
    console.log("[REGISTER FORM] Données formulaire:", { ...data, password: "***" });

    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      console.log("[REGISTER FORM] Erreurs de validation:", flattened);
      setErrors(
        Object.fromEntries(
          Object.entries(flattened).map(([k, v]) => [k, v?.[0] ?? ""])
        )
      );
      return;
    }

    setLoading(true);
    console.log("[REGISTER FORM] Envoi fetch vers /api/auth/register");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      console.log("[REGISTER FORM] Réponse HTTP:", res.status, res.statusText);
      const json = await res.json().catch(() => ({}));
      console.log("[REGISTER FORM] Réponse JSON:", json);

      if (!res.ok) {
        const message =
          typeof json.error === "string"
            ? json.error
            : json.error?.formErrors?.[0] ?? "L'inscription a échoué.";
        setServerError(message);
        return;
      }

      router.push("/login");
    } catch (err) {
      console.error("[REGISTER FORM] Erreur fetch:", err);
      setServerError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-center text-[var(--ink)]">
        Créer un compte
      </h1>
      <p className="text-sm text-center text-[var(--ink-secondary)] mb-6">
        Rejoignez la plateforme nationale des enchères
      </p>

      {serverError && (
        <div className="alert alert-danger mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
            Rôle
          </label>
          <div className="relative">
            <RoleIcon role={role} />
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="input pl-10"
            >
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Nom</label>
            <input name="nom" required className="input" />
            {errors.nom && <p className="text-xs text-[var(--danger)] mt-1">{errors.nom}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Prénom</label>
            <input name="prenom" required className="input" />
            {errors.prenom && <p className="text-xs text-[var(--danger)] mt-1">{errors.prenom}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Email</label>
          <input name="email" type="email" required className="input" />
          {errors.email && <p className="text-xs text-[var(--danger)] mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
            Mot de passe
          </label>
          <input name="password" type="password" required className="input" />
          {errors.password && <p className="text-xs text-[var(--danger)] mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Téléphone</label>
          <input name="telephone" className="input" />
        </div>

        {role === Role.CITOYEN && (
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Numéro CNI</label>
            <input name="numeroCNI" className="input" />
            {errors.numeroCNI && <p className="text-xs text-[var(--danger)] mt-1">{errors.numeroCNI}</p>}
          </div>
        )}

        {role === Role.ENTREPRISE && (
          <>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Numéro RCCM</label>
              <input name="numeroRCCM" className="input" />
              {errors.numeroRCCM && <p className="text-xs text-[var(--danger)] mt-1">{errors.numeroRCCM}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Raison sociale</label>
              <input name="raisonSociale" className="input" />
              {errors.raisonSociale && <p className="text-xs text-[var(--danger)] mt-1">{errors.raisonSociale}</p>}
            </div>
          </>
        )}

        {role === Role.COMMISSAIRE_PRISEUR && (
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Numéro d&apos;agrément</label>
            <input name="numeroAgrement" className="input" />
            {errors.numeroAgrement && <p className="text-xs text-[var(--danger)] mt-1">{errors.numeroAgrement}</p>}
          </div>
        )}

        {role === Role.MAGISTRAT && (
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Juridiction compétente</label>
            <input name="jurisdiction" className="input" />
            {errors.jurisdiction && <p className="text-xs text-[var(--danger)] mt-1">{errors.jurisdiction}</p>}
          </div>
        )}

        {role === Role.DOUANIER && (
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Poste d&apos;affectation</label>
            <input name="posteAffectation" className="input" />
            {errors.posteAffectation && <p className="text-xs text-[var(--danger)] mt-1">{errors.posteAffectation}</p>}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? "Inscription..." : "S'inscrire"}
          <ArrowRight size={18} />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink-secondary)]">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

function RoleIcon({ role }: { role: Role }) {
  const Icon = ROLE_ICONS[role];
  return (
    <Icon
      size={16}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none"
    />
  );
}
