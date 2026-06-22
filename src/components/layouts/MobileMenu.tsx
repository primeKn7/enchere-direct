"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

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
        className="lg:hidden p-2 -ml-2"
        style={{ color: "var(--ink)" }}
        aria-label="Ouvrir le menu"
        type="button"
      >
        <Menu size={20} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[90] lg:hidden"
            style={{ background: "rgba(0, 0, 0, 0.4)" }}
            onClick={() => setOpen(false)}
          />

          <div
            className="fixed left-0 top-0 bottom-0 w-[280px] z-[100] lg:hidden flex flex-col"
            style={{
              background: "var(--surface-primary)",
              borderRight: "1px solid var(--border)",
            }}
          >
            <div
              className="h-[48px] flex items-center justify-between px-4 shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span
                className="text-[14px] font-semibold"
                style={{ color: "var(--ink)" }}
              >
                EnchèreDirect
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1"
                style={{ color: "var(--ink-muted)" }}
                aria-label="Fermer le menu"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
              {items.map((item) => {
                const Icon = iconMap[item.iconName] ?? LayoutDashboard;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="relative flex items-center gap-3 px-3 py-[7px] rounded-[var(--radius-md)] text-[14px] transition-colors"
                    style={{
                      color: active ? "var(--ink)" : "var(--ink-muted)",
                      background: active ? "var(--surface-sunken)" : "transparent",
                      fontWeight: active ? 500 : 400,
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
                  <p
                    className="text-[14px] font-medium truncate"
                    style={{ color: "var(--ink)" }}
                  >
                    {displayName}
                  </p>
                  <p
                    className="text-[12px] truncate"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[14px] cursor-pointer"
                style={{ color: "var(--danger)", background: "transparent" }}
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
