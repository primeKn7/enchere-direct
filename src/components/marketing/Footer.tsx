"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { useT } from "@/components/providers/LanguageProvider";

export function Footer() {
  const t = useT();

  const quickLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/catalogue", label: t("nav.catalogue") },
    { href: "/comment-ca-marche", label: t("nav.howItWorks") },
    { href: "/mentions-legales", label: t("footer.legal") },
  ];

  const categoryLinks = [
    { href: "/catalogue?category=vehicules", label: t("category.vehicules") },
    { href: "/catalogue?category=immobilier", label: t("category.immobilier") },
    { href: "/catalogue?category=bijoux", label: t("category.bijoux") },
    { href: "/catalogue?category=art", label: t("category.art") },
    { href: "/catalogue?category=electronique", label: t("category.electronique") },
  ];

  return (
    <footer style={{ background: "var(--encre)" }}>
      <div className="container-app pt-12 pb-10 md:pt-24 md:pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 md:gap-10 mb-8 md:mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/encheredirect_logo.png"
                alt="EnchèreDirect"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-[16px] font-bold text-white">EnchèreDirect</span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
              {t("footer.tagline")}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--accent-gold)" }}>
              {t("footer.navigation")}
            </p>
            <nav className="flex flex-col gap-2.5">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-[13px] transition-colors footer-link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Categories */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--accent-gold)" }}>
              {t("footer.categories")}
            </p>
            <nav className="flex flex-col gap-2.5">
              {categoryLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-[13px] transition-colors footer-link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--accent-gold)" }}>
              {t("footer.contact")}
            </p>
            <div className="flex flex-col gap-3 text-[13px]" style={{ color: "rgba(255,255,255,0.65)" }}>
              <p className="flex items-center gap-2.5">
                <Mail size={14} style={{ color: "var(--accent-gold)" }} />
                contact@encheredirect.com
              </p>
              <p className="flex items-center gap-2.5">
                <Phone size={14} style={{ color: "var(--accent-gold)" }} />
                +229 XX XX XX XX
              </p>
              <p className="flex items-center gap-2.5">
                <MapPin size={14} style={{ color: "var(--accent-gold)" }} />
                Cotonou, Bénin
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.40)" }}
        >
          <p>&copy; {new Date().getFullYear()} EnchèreDirect — {t("footer.copyright")}</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--accent-gold)" }} />
            <span>{t("footer.operational")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
