"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, Globe, Briefcase, AtSign } from "lucide-react";

const categoryLinks = [
  { href: "/catalogue?category=vehicules", label: "Véhicules" },
  { href: "/catalogue?category=immobilier", label: "Immobilier" },
  { href: "/catalogue?category=bijoux", label: "Bijoux / Or" },
  { href: "/catalogue?category=art", label: "Art / Antiquités" },
];

const quickLinks = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export function Footer() {
  return (
    <footer
      className="border-t"
      style={{
        background: "var(--accent)",
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <div className="container-app py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/encheredirect_logo.png"
                alt="EnchèreDirect"
                width={32}
                height={32}
                className="h-8 w-auto opacity-100"
                style={{ opacity: 1 }}
              />
              <span className="text-lg font-semibold text-white">
                EnchèreDirect
              </span>
            </div>
            <p className="text-sm text-white/80">
              Plateforme officielle de vente aux enchères pour les objets saisis et les ventes publiques.
            </p>
          </div>

          <div>
            <h4 className="text-base font-semibold text-[var(--accent)] mb-4">
              Liens rapides
            </h4>
            <nav className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/80 hover:text-[var(--accent)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="text-base font-semibold text-[var(--accent)] mb-4">
              Catégories
            </h4>
            <nav className="flex flex-col gap-2">
              {categoryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/80 hover:text-[var(--accent)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="text-base font-semibold text-[var(--accent)] mb-4">
              Contact
            </h4>
            <div className="flex flex-col gap-3 text-sm text-white/80">
              <p className="flex items-center gap-2">
                <Mail size={16} /> contact@encheredirect.com
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} /> +229 XX XX XX XX
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={16} /> Cotonou, Bénin
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                aria-label="Facebook"
              >
                <Globe size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                aria-label="LinkedIn"
              >
                <Briefcase size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                aria-label="X (Twitter)"
              >
                <AtSign size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm text-white/70">
          <p>&copy; {new Date().getFullYear()} EnchèreDirect.com - Tous droits réservés</p>
        </div>
      </div>
    </footer>
  );
}
