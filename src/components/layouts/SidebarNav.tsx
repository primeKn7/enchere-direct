"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderOpen, Gavel, Award, Package,
  UserCircle, Wallet, BarChart3, ShieldAlert, Users, Search, ShieldCheck, ClipboardCheck, BadgeCheck,
} from "lucide-react";

type NavItem = { href: string; label: string; iconName: string };

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, FolderOpen, Gavel, Award, Package,
  UserCircle, Wallet, BarChart3, ShieldAlert, Users, Search, ShieldCheck, ClipboardCheck, BadgeCheck,
};

export default function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
      {items.map((item) => {
        const Icon = iconMap[item.iconName] ?? LayoutDashboard;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${active ? "nav-link-active" : ""}`}
          >
            {active && <span className="nav-link-indicator" />}
            <Icon size={15} strokeWidth={active ? 2.2 : 1.6} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
