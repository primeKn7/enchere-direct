import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "@/components/layouts/LogoutButton";
import SidebarNav from "@/components/layouts/SidebarNav";
import MobileMenu from "@/components/layouts/MobileMenu";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Role } from "@prisma/client";

const ROLE_LABELS: Record<string, string> = {
  CITOYEN: "Citoyen",
  ENTREPRISE: "Entreprise",
  COMMISSAIRE_PRISEUR: "Commissaire-Priseur",
  AGENT_AES: "Agent AES",
  MAGISTRAT: "Magistrat",
  DOUANIER: "Douanier",
  TRESOR_PUBLIC: "Trésor Public",
  ADMINISTRATEUR: "Administrateur",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { user } = session;
  const displayName = user.name ?? user.email;
  const role = user.role as Role;

  const navItems: { href: string; label: string; iconName: string }[] = [
    { href: "/dashboard", label: "Tableau de bord", iconName: "LayoutDashboard" },
  ];

  if (
    role === Role.AGENT_AES ||
    role === Role.MAGISTRAT ||
    role === Role.ADMINISTRATEUR
  ) {
    navItems.push({ href: "/dashboard/saisies", label: "Saisies", iconName: "FolderOpen" });
  }

  if (
    role === Role.CITOYEN ||
    role === Role.ENTREPRISE ||
    role === Role.COMMISSAIRE_PRISEUR ||
    role === Role.ADMINISTRATEUR
  ) {
    navItems.push({ href: "/dashboard/encheres", label: "Enchères", iconName: "Gavel" });
  }

  navItems.push({ href: "/dashboard/adjudication", label: "Adjudications", iconName: "Award" });

  if (
    role === Role.AGENT_AES ||
    role === Role.ADMINISTRATEUR ||
    role === Role.COMMISSAIRE_PRISEUR
  ) {
    navItems.push({ href: "/dashboard/inventaire", label: "Inventaire", iconName: "Package" });
  }

  if (
    role === Role.CITOYEN ||
    role === Role.ENTREPRISE ||
    role === Role.COMMISSAIRE_PRISEUR ||
    role === Role.ADMINISTRATEUR
  ) {
    navItems.push({ href: "/dashboard/portefeuille", label: "Portefeuille", iconName: "Wallet" });
  }

  if (
    role === Role.ADMINISTRATEUR ||
    role === Role.AGENT_AES ||
    role === Role.COMMISSAIRE_PRISEUR
  ) {
    navItems.push({ href: "/dashboard/statistiques", label: "Statistiques", iconName: "BarChart3" });
  }

  if (role === Role.AGENT_AES || role === Role.ADMINISTRATEUR) {
    navItems.push({ href: "/dashboard/fraude", label: "Fraude", iconName: "ShieldAlert" });
  }

  if (role === Role.ADMINISTRATEUR) {
    navItems.push({ href: "/dashboard/utilisateurs", label: "Utilisateurs", iconName: "Users" });
  }

  navItems.push({ href: "/dashboard/catalogue", label: "Catalogue", iconName: "Search" });
  navItems.push({ href: "/dashboard/profil", label: "Mon profil", iconName: "UserCircle" });

  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="min-h-screen flex" style={{ background: "var(--surface-base)" }}>
      <aside
        className="fixed left-0 top-0 bottom-0 w-[240px] hidden lg:flex flex-col z-50"
        style={{
          background: "var(--surface-primary)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div
          className="h-[48px] flex items-center px-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/encheredirect_logo.png"
              alt="EnchèreDirect"
              width={24}
              height={24}
              className="h-6 w-auto"
            />
            <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              EnchèreDirect
            </span>
          </Link>
        </div>

        <SidebarNav items={navItems} />

        <div
          className="px-3 pb-3 pt-2 shrink-0 space-y-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 px-2 py-1">
            <div
              className="w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center text-[12px] font-semibold shrink-0"
              style={{
                background: "var(--surface-sunken)",
                color: "var(--ink-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium truncate" style={{ color: "var(--ink)" }}>
                {displayName}
              </p>
              <p className="text-[12px] truncate" style={{ color: "var(--ink-muted)" }}>
                {ROLE_LABELS[role] ?? role}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 lg:ml-[240px]">
        <header
          className="sticky top-0 z-40 h-[48px] lg:hidden flex items-center justify-between px-4"
          style={{
            background: "var(--surface-primary)",
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
              <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                EnchèreDirect
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div
              className="w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center text-[12px] font-semibold"
              style={{
                background: "var(--surface-sunken)",
                color: "var(--ink-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="px-6 lg:px-8 py-6 max-w-[1120px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
