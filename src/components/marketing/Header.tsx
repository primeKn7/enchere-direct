"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useT } from "@/components/providers/LanguageProvider";
import LanguageToggle from "@/components/ui/LanguageToggle";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/catalogue", label: t("nav.catalogue") },
    { href: "/comment-ca-marche", label: t("nav.howItWorks") },
  ];

  const liveActive = pathname.startsWith("/vente-live");

  return (
    <header
      className="sticky top-0 z-[100] h-16 border-b"
      style={{
        background: "#ffffff",
        borderColor: "var(--border)",
        boxShadow: "0 1px 0 var(--border)",
      }}
    >
      <div className="container-app h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/images/encheredirect_logo.png"
              alt="EnchèreDirect"
              width={36}
              height={36}
              className="h-9 w-auto"
            />
            <span className="text-[16px] font-bold hidden sm:block" style={{ color: "var(--teal-deep)" }}>
              EnchèreDirect
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-[var(--radius-md)] text-[13.5px] font-medium transition-colors"
                  style={{
                    color: active ? "var(--accent)" : "var(--ink-muted)",
                    background: active ? "var(--accent-subtle)" : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            {/* Vente Live — page placeholder en attendant la vraie fonctionnalité */}
            <Link
              href="/vente-live"
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-[13.5px] font-medium inline-flex items-center gap-1.5 transition-colors"
              style={{
                color: liveActive ? "var(--accent)" : "var(--ink-muted)",
                background: liveActive ? "var(--accent-subtle)" : "transparent",
                fontWeight: liveActive ? 600 : 400,
              }}
            >
              <span className="live-dot" />
              {t("nav.liveSale")}
            </Link>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageToggle />
            <Link href="/login" className="btn btn-secondary btn-sm">
              {t("nav.login")}
            </Link>
            <Link href="/register" className="btn btn-gold btn-sm">
              {t("nav.register")}
            </Link>
          </div>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-1">
            <LanguageToggle />
            <button
              className="p-2 rounded-[var(--radius-md)]"
              style={{ color: "var(--ink)" }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden absolute top-16 left-0 right-0 border-b shadow-lg"
          style={{ background: "#ffffff", borderColor: "var(--border)" }}
        >
          <nav className="container-app flex flex-col py-3 gap-1">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2.5 rounded-[var(--radius-md)] text-[14px] transition-colors"
                  style={{
                    color: active ? "var(--accent)" : "var(--ink-secondary)",
                    background: active ? "var(--accent-subtle)" : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/vente-live"
              className="px-3 py-2.5 rounded-[var(--radius-md)] text-[14px] inline-flex items-center gap-2 transition-colors"
              style={{ color: "var(--ink-secondary)" }}
              onClick={() => setMobileOpen(false)}
            >
              <span className="live-dot" />
              {t("nav.liveSale")}
            </Link>
            <div className="flex gap-2 mt-2 pb-1">
              <Link href="/login" className="flex-1 btn btn-secondary text-center" onClick={() => setMobileOpen(false)}>
                {t("nav.login")}
              </Link>
              <Link href="/register" className="flex-1 btn btn-gold text-center" onClick={() => setMobileOpen(false)}>
                {t("nav.register")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
