import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "@/components/layouts/LogoutButton";
import SidebarNav from "@/components/layouts/SidebarNav";
import MobileMenu from "@/components/layouts/MobileMenu";
import MobileBalance from "@/components/layouts/MobileBalance";
import { Role } from "@prisma/client";

const ROLE_LABELS: Record<string, string> = {
  CITOYEN: "Citoyen",
  ENTREPRISE: "Entreprise",
  COMMISSAIRE_PRISEUR: "Commissaire-Priseur",
  AGENT_AES: "Agent AES",
  MAGISTRAT: "Magistrat",
  DOUANIER: "Douanier",
  TRESOR_PUBLIC: "Trésor Public",
  EXPERT: "Expert",
  ADMINISTRATEUR: "Administrateur",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { user } = session;
  const displayName = user.name ?? user.email;
  const role = user.role as Role;

  const navItems: { href: string; label: string; iconName: string }[] = [
    { href: "/dashboard", label: "Tableau de bord", iconName: "LayoutDashboard" },
  ];

  const has = (...roles: Role[]) => (roles as Role[]).includes(role);

  if (has(Role.AGENT_AES, Role.MAGISTRAT, Role.ADMINISTRATEUR)) {
    navItems.push({ href: "/dashboard/saisies", label: "Saisies", iconName: "FolderOpen" });
  }
  if (has(Role.CITOYEN, Role.ENTREPRISE, Role.COMMISSAIRE_PRISEUR, Role.ADMINISTRATEUR)) {
    navItems.push({ href: "/dashboard/encheres", label: "Enchères", iconName: "Gavel" });
  }
  navItems.push({ href: "/dashboard/adjudication", label: "Adjudications", iconName: "Award" });
  if (has(Role.AGENT_AES, Role.ADMINISTRATEUR, Role.COMMISSAIRE_PRISEUR)) {
    navItems.push({ href: "/dashboard/inventaire", label: "Inventaire", iconName: "Package" });
  }
  if (has(Role.EXPERT, Role.AGENT_AES, Role.MAGISTRAT, Role.COMMISSAIRE_PRISEUR, Role.ADMINISTRATEUR)) {
    navItems.push({ href: "/dashboard/expertises", label: "Expertises", iconName: "ClipboardCheck" });
  }
  if (has(Role.CITOYEN, Role.ENTREPRISE, Role.COMMISSAIRE_PRISEUR, Role.ADMINISTRATEUR)) {
    navItems.push({ href: "/dashboard/portefeuille", label: "Portefeuille", iconName: "Wallet" });
  }
  if (has(Role.ADMINISTRATEUR, Role.AGENT_AES, Role.COMMISSAIRE_PRISEUR)) {
    navItems.push({ href: "/dashboard/statistiques", label: "Statistiques", iconName: "BarChart3" });
  }
  if (has(Role.AGENT_AES, Role.ADMINISTRATEUR)) {
    navItems.push({ href: "/dashboard/fraude", label: "Fraude", iconName: "ShieldAlert" });
  }
  if (role === Role.ADMINISTRATEUR) {
    navItems.push({ href: "/dashboard/kyc-validation", label: "Validation KYC", iconName: "BadgeCheck" });
    navItems.push({ href: "/dashboard/utilisateurs", label: "Utilisateurs", iconName: "Users" });
  }
  navItems.push({ href: "/dashboard/catalogue", label: "Catalogue", iconName: "Search" });
  navItems.push({ href: "/dashboard/profil", label: "Mon profil", iconName: "UserCircle" });
  // Vérification KYC tout en bas, après le profil.
  if (has(Role.CITOYEN, Role.ENTREPRISE, Role.COMMISSAIRE_PRISEUR)) {
    navItems.push({ href: "/dashboard/kyc", label: "Vérification (KYC)", iconName: "ShieldCheck" });
  }

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="min-h-screen flex" style={{ background: "var(--surface-base)" }}>
      {/* Sidebar desktop */}
      <aside
        className="fixed left-0 top-0 bottom-0 w-[240px] hidden lg:flex flex-col z-50"
        style={{
          background: "#ffffff",
          borderRight: "1px solid var(--border)",
          boxShadow: "1px 0 0 var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="h-[56px] flex items-center px-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/images/encheredirect_logo.png"
              alt="EnchèreDirect"
              width={28}
              height={28}
              className="h-7 w-auto"
            />
            <span className="text-[14px] font-bold" style={{ color: "var(--teal-deep)" }}>
              EnchèreDirect
            </span>
          </Link>
        </div>

        <SidebarNav items={navItems} />

        {/* User footer */}
        <div
          className="px-3 pb-3 pt-2 shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div
              className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-[12px] font-bold shrink-0"
              style={{
                background: "var(--accent-subtle)",
                color: "var(--accent)",
                border: "1.5px solid rgba(12,59,48,0.15)",
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                {displayName}
              </p>
              <p className="text-[11px] truncate" style={{ color: "var(--ink-muted)" }}>
                {ROLE_LABELS[role] ?? role}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 lg:ml-[240px]">
        {/* Mobile header */}
        <header
          className="sticky top-0 z-40 h-[52px] lg:hidden flex items-center justify-between px-4"
          style={{
            background: "#ffffff",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <MobileMenu
              items={navItems}
              displayName={displayName ?? ""}
              role={ROLE_LABELS[role] ?? role}
              initials={initials}
            />
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/images/encheredirect_logo.png"
                alt="EnchèreDirect"
                width={24}
                height={24}
                className="h-6 w-auto"
              />
              <span className="text-[14px] font-bold" style={{ color: "var(--teal-deep)" }}>
                EnchèreDirect
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <MobileBalance />
            <div
              className="w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center text-[11px] font-bold"
              style={{
                background: "var(--accent-subtle)",
                color: "var(--accent)",
                border: "1.5px solid rgba(12,59,48,0.15)",
              }}
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="px-5 lg:px-8 py-7 max-w-[1120px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
