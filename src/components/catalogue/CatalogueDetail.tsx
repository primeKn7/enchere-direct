"use client";

import { useEffect, useRef, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Car, Home, Gem, Palette, Smartphone, Sofa, Cog, Package, Gavel, ChevronRight,
} from "lucide-react";
import { getAuctionById } from "@/lib/demo-data";
import type { DemoAuction } from "@/components/marketing/AuctionCard";
import { useT } from "@/components/providers/LanguageProvider";

const categoryIcons: Record<string, React.ElementType> = {
  vehicules: Car,
  immobilier: Home,
  bijoux: Gem,
  art: Palette,
  electronique: Smartphone,
  meubles: Sofa,
  machines: Cog,
  autres: Package,
};

const COUNTRY_CODES: Record<string, string> = {
  benin: "BJ",
  togo: "TG",
  ghana: "GH",
  nigeria: "NG",
  cote_ivoire: "CI",
  senegal: "SN",
  burkina_faso: "BF",
};

const PALIER = 100000;

function useCountdown(endDate: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(endDate).getTime() - now);
  const totalSec = Math.floor(diff / 1000);
  return {
    ended: diff <= 0,
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function CatalogueDetail({
  id,
  backHref,
  ctaHref,
  interactiveBid = false,
  auction: auctionProp,
}: {
  id: string;
  backHref: string;
  ctaHref?: string;
  ctaLabel?: string;
  interactiveBid?: boolean;
  /** Lot réel fourni par le serveur ; sinon repli sur les données démo. */
  auction?: DemoAuction;
}) {
  const t = useT();
  const auction = auctionProp ?? getAuctionById(id);
  if (!auction) notFound();

  const nonProgramme = auction.nonProgramme || !auction.endDate;
  const { ended, hours, minutes, seconds } = useCountdown(auction.endDate || new Date().toISOString());
  const CategoryIcon = categoryIcons[auction.categoryKey] ?? Package;
  const countryCode = auction.countryKey
    ? COUNTRY_CODES[auction.countryKey] ?? auction.countryKey.slice(0, 2).toUpperCase()
    : "";
  // Numéro de lot réel (LOT-000001) si disponible, sinon repli démo (Lot 001).
  const lotNumber = auction.lotNumber ?? `${t("card.lot")} ${String(auction.id).padStart(3, "0")}`;
  const isJudiciaire = auction.type === "judiciaire";

  // Données simulées (offres / historique), interactives en mode dashboard
  const initialOffers = ((Number(auction.id) * 7) % 18) + 6;
  const initialHistory = [4127, 3380, 2915, 4471].map((b, i) => ({
    name: `${t("detail.bidder")} #${b}`,
    amount: auction.currentPrice - i * PALIER,
  }));

  const [currentPrice, setCurrentPrice] = useState(auction.currentPrice);
  const [offers, setOffers] = useState(initialOffers);
  const [history, setHistory] = useState(initialHistory);
  const nextBid = currentPrice + PALIER;

  // Carrousel d'images
  const slides = auction.images.length > 0 ? auction.images : [null];
  const [activeImg, setActiveImg] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  function onCarouselScroll() {
    const el = carouselRef.current;
    if (!el) return;
    setActiveImg(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goToSlide(i: number) {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function placeBid() {
    if (ended) return;
    const newPrice = currentPrice + PALIER;
    setCurrentPrice(newPrice);
    setOffers((o) => o + 1);
    setHistory((h) => [{ name: t("detail.you"), amount: newPrice }, ...h]);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] mb-6" style={{ color: "var(--ink-muted)" }}>
        <Link href={backHref} className="hover:underline">{t("detail.catalogue")}</Link>
        <ChevronRight size={13} />
        <span>{auction.category}</span>
        <ChevronRight size={13} />
        <span className="font-semibold" style={{ color: "var(--ink)" }}>{auction.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8">
        {/* ───── Colonne gauche ───── */}
        <div>
          {/* Carrousel d'images */}
          <div className="relative mb-3">
            <div
              ref={carouselRef}
              onScroll={onCarouselScroll}
              className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar rounded-[var(--radius-xl)]"
              style={{ scrollBehavior: "smooth" }}
            >
              {slides.map((src, i) => (
                <div
                  key={i}
                  className="snap-center shrink-0 w-full flex items-center justify-center"
                  style={{ height: "clamp(260px, 60vw, 380px)", background: "var(--surface-sunken)" }}
                >
                  {src ? (
                    <img src={src} alt={`${auction.title} — ${i + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3" style={{ color: "var(--ink-disabled)" }}>
                      <CategoryIcon size={64} />
                      <span className="text-[12px] uppercase tracking-widest font-semibold">
                        {t("detail.photoMain")} — {auction.category}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Badges sur l'image */}
            <span className="badge badge-lot absolute top-4 left-4">{lotNumber}</span>
            <span className={`badge ${isJudiciaire ? "badge-type" : "badge-type-vol"} absolute top-4 right-4`}>
              {isJudiciaire ? t("detail.saleJudiciaire") : t("detail.saleVolontaire")}
            </span>
          </div>

          {/* Points du carrousel */}
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Image ${i + 1}`}
                  onClick={() => goToSlide(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === activeImg ? "20px" : "8px",
                    height: "8px",
                    background: i === activeImg ? "var(--accent-gold)" : "var(--border-strong)",
                  }}
                />
              ))}
            </div>
          )}
          {slides.length <= 1 && <div className="mb-8" />}

          {/* Description */}
          <div className="card p-6">
            <h2
              className="mb-4"
              style={{ color: "var(--ink)", fontFamily: "var(--font-serif)", fontSize: "20px", fontWeight: 700, textTransform: "none", letterSpacing: "-0.01em" }}
            >
              {t("detail.description")}
            </h2>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: "var(--ink-secondary)" }}>
              {auction.description}
            </p>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
              {[
                { label: t("detail.state"), value: auction.condition },
                { label: t("detail.place"), value: `${auction.location}, ${auction.country}` },
                { label: t("detail.seller"), value: auction.sellerName },
                { label: t("detail.startPrice"), value: `${auction.startingPrice.toLocaleString("fr-FR")} ${auction.currency}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--ink-muted)" }}>
                    {label}
                  </p>
                  <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ───── Colonne droite ───── */}
        <div className="space-y-5">
          {/* Titre + meta */}
          <div>
            <p className="text-[12px] font-semibold mb-2" style={{ color: "var(--ink-muted)" }}>
              {[countryCode, auction.country, auction.category].filter(Boolean).join(" · ")}
            </p>
            <h1 style={{ color: "var(--ink)", fontFamily: "var(--font-serif)", fontSize: "30px", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
              {auction.title}
            </h1>
          </div>

          {/* Carte sombre : clôture + countdown + mise */}
          <div className="p-6 rounded-[var(--radius-xl)]" style={{ background: "var(--teal-deep)" }}>
            {nonProgramme ? (
              <div className="text-center py-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Lot publié
                </p>
                <p className="text-[15px] font-semibold" style={{ color: "#fff" }}>
                  Vente non encore programmée
                </p>
                <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                  La date d&apos;ouverture et de clôture sera fixée à la création de l&apos;enchère.
                </p>
                <div className="flex items-end justify-center pt-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {t("detail.startPrice")}
                    </p>
                    <p className="text-[24px] font-bold leading-none" style={{ color: "var(--accent-gold)", fontVariantNumeric: "tabular-nums" }}>
                      {auction.startingPrice.toLocaleString("fr-FR")} <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.6)" }}>{auction.currency}</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
            <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
                {t("detail.close")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--accent-gold)" }}>
                <span className="live-dot" style={{ background: "var(--accent-gold)" }} />
                {ended ? t("detail.endedBadge") : t("detail.live")}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[
                { v: pad(hours), l: t("detail.hours"), gold: false },
                { v: pad(minutes), l: t("detail.min"), gold: false },
                { v: pad(seconds), l: t("detail.sec"), gold: true },
              ].map((b, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center py-3 rounded-[var(--radius-md)]"
                  style={{ background: b.gold ? "rgba(253,193,52,0.16)" : "rgba(255,255,255,0.06)" }}
                >
                  <span
                    className="text-[26px] font-bold leading-none"
                    style={{ color: b.gold ? "var(--accent-gold)" : "#fff", fontVariantNumeric: "tabular-nums" }}
                  >
                    {b.v}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest mt-1.5" style={{ color: b.gold ? "rgba(253,193,52,0.8)" : "rgba(255,255,255,0.45)" }}>
                    {b.l}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-end justify-between pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {t("detail.currentBid")}
                </p>
                <p className="text-[24px] font-bold leading-none" style={{ color: "var(--accent-gold)", fontVariantNumeric: "tabular-nums" }}>
                  {currentPrice.toLocaleString("fr-FR")} <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.6)" }}>{auction.currency}</span>
                </p>
              </div>
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                {offers} {t("detail.offers")}
              </span>
            </div>
            </>
            )}
          </div>

          {/* Votre offre */}
          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--ink-muted)" }}>
              {t("detail.yourBid")}
            </p>
            {nonProgramme ? (
              <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
                Les offres seront ouvertes dès qu&apos;une enchère sera programmée pour ce lot.
              </p>
            ) : (
            <>
            <div className="flex items-stretch gap-3">
              <input
                type="text"
                value={nextBid.toLocaleString("fr-FR")}
                readOnly
                className="input flex-1"
                style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}
              />
              {interactiveBid ? (
                <button
                  type="button"
                  onClick={placeBid}
                  disabled={ended}
                  className={`btn shrink-0 ${ended ? "btn-secondary" : "btn-gold"}`}
                >
                  <Gavel size={16} />
                  {ended ? t("detail.saleEnded") : `${t("detail.bid")} +100 000`}
                </button>
              ) : (
                <Link
                  href={ctaHref ?? "/login"}
                  className={`btn shrink-0 ${ended ? "btn-secondary" : "btn-gold"}`}
                  style={ended ? { pointerEvents: "none", opacity: 0.6 } : undefined}
                >
                  <Gavel size={16} />
                  {ended ? t("detail.saleEnded") : `${t("detail.bid")} +100 000`}
                </Link>
              )}
            </div>
            <p className="text-[11px] leading-relaxed mt-3" style={{ color: "var(--ink-muted)" }}>
              {t("detail.proxyHelp")}
            </p>
            </>
            )}
          </div>

          {/* Historique des offres */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-bold" style={{ color: "var(--ink)" }}>{t("detail.history")}</p>
              <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-muted)" }}>
                <span className="live-dot" style={{ background: "var(--success)" }} />
                {t("detail.realtime")}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <span className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                    {h.name}
                  </span>
                  <span className="text-[13px] font-bold" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                    {h.amount.toLocaleString("fr-FR")} {auction.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
