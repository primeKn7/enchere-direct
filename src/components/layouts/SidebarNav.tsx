"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  iconName: string;
};

import {
  LayoutDashboard,
  FolderOpen,
  Gavel,
  Award,
  Package,
  UserCircle,
  Wallet,
  BarChart3,
  ShieldAlert,
  Users,
  Search,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  FolderOpen,
  Gavel,
  Award,
  Package,
  UserCircle,
  Wallet,
  BarChart3,
  ShieldAlert,
  Users,
  Search,
};

export default function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
      {items.map((item) => {
        const Icon = iconMap[item.iconName] ?? LayoutDashboard;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex items-center gap-3 px-3 py-[7px] rounded-[var(--radius-md)] text-[14px] transition-colors"
            style={{
              color: active ? "var(--ink)" : "var(--ink-muted)",
              background: active ? "var(--surface-sunken)" : "transparent",
              fontWeight: active ? 500 : 400,
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = "var(--surface-sunken)";
                e.currentTarget.style.color = "var(--ink-secondary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ink-muted)";
              }
            }}
          >
            {active && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r"
                style={{ background: "var(--accent)" }}
              />
            )}
            <Icon size={16} strokeWidth={active ? 2 : 1.5} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
