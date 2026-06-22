"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-[100] h-16 border-b"
      style={{
        background: "var(--surface-primary)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="container-app h-full">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/encheredirect_logo.png"
              alt="EnchèreDirect"
              width={40}
              height={40}
              className="h-10 w-auto opacity-100"
              style={{ opacity: 1 }}
            />
            <span className="text-lg font-semibold text-[var(--ink)] hidden sm:block">
              EnchèreDirect
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-[var(--ink-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="btn btn-secondary btn-md"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="btn btn-primary btn-md"
            >
              Inscription
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-[var(--ink)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden absolute top-16 left-0 right-0 border-b shadow-lg"
          style={{
            background: "var(--surface-primary)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderColor: "var(--border)",
          }}
        >
          <nav className="container-app flex flex-col py-4 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-3 text-[var(--ink-secondary)] hover:text-[var(--accent)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-3">
              <Link
                href="/login"
                className="flex-1 btn btn-secondary btn-md text-center"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="flex-1 btn btn-primary btn-md text-center"
              >
                Inscription
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
