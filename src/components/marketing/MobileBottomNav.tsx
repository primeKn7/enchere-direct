"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Radio, User } from "lucide-react";
import { useT } from "@/components/providers/LanguageProvider";

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useT();

  const items = [
    { href: "/", label: t("nav.home"), icon: Home, match: (p: string) => p === "/" },
    { href: "/catalogue", label: t("nav.catalogue"), icon: LayoutGrid, match: (p: string) => p.startsWith("/catalogue") },
    { href: "/vente-live", label: t("nav.live"), icon: Radio, match: (p: string) => p.startsWith("/vente-live") },
    { href: "/login", label: t("nav.account"), icon: User, match: (p: string) => p.startsWith("/login") || p.startsWith("/register") },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] border-t"
      style={{
        background: "#ffffff",
        borderColor: "var(--border)",
        boxShadow: "0 -1px 8px rgba(10,42,56,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
              style={{ color: active ? "var(--accent)" : "var(--ink-muted)", fontWeight: active ? 600 : 400 }}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
