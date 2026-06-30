"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import {
  LayoutDashboard, FolderOpen, Gavel, Award, Package,
  UserCircle, Wallet, BarChart3, ShieldAlert, Users, Search, ShieldCheck, ClipboardCheck, BadgeCheck,
} from "lucide-react";
import { signOut } from "next-auth/react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, FolderOpen, Gavel, Award, Package,
  UserCircle, Wallet, BarChart3, ShieldAlert, Users, Search, ShieldCheck, ClipboardCheck, BadgeCheck,
};

type NavItem = { href: string; label: string; iconName: string };

export default function MobileMenu({
  items,
  displayName,
  role,
  initials,
}: {
  items: NavItem[];
  displayName: string;
  role: string;
  initials: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 -ml-2 rounded-[var(--radius-md)]"
        style={{ color: "var(--ink)" }}
        aria-label="Ouvrir le menu"
        type="button"
      >
        <Menu size={20} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[90] lg:hidden"
            style={{ background: "rgba(15,30,26,0.40)" }}
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div
            className="fixed left-0 top-0 bottom-0 w-[280px] z-[100] lg:hidden flex flex-col"
            style={{
              background: "#ffffff",
              borderRight: "1px solid var(--border)",
              boxShadow: "4px 0 20px rgba(0,0,0,0.10)",
            }}
          >
            {/* Header */}
            <div
              className="h-[52px] flex items-center justify-between px-4 shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span className="text-[14px] font-bold" style={{ color: "var(--teal-deep)" }}>
                EnchèreDirect
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-[var(--radius-sm)]"
                style={{ color: "var(--ink-muted)" }}
                aria-label="Fermer le menu"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {items.map((item) => {
                const Icon = iconMap[item.iconName] ?? LayoutDashboard;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`nav-link ${active ? "nav-link-active" : ""}`}
                  >
                    {active && <span className="nav-link-indicator" />}
                    <Icon size={15} strokeWidth={active ? 2.2 : 1.6} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

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
                    {role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[13px] cursor-pointer transition-colors"
                style={{ color: "var(--danger)", background: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--danger-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                type="button"
              >
                <LogOut size={14} />
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
