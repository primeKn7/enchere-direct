"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/components/providers/LanguageProvider";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Car,
  Home,
  Gem,
  Palette,
  Smartphone,
  Sofa,
  Cog,
  Package,
  Gavel,
} from "lucide-react";

export interface DemoAuction {
  id: string;
  title: string;
  description: string;
  images: string[];
  startingPrice: number;
  currentPrice: number;
  currency: string;
  category: string;
  categoryKey: string;
  country: string;
  countryKey: string;
  type: "judiciaire" | "volontaire";
  status: "active" | "ended" | "upcoming";
  endDate: string;
  scheduleDate: string;
  liveTime: string;
  sellerName: string;
  condition: string;
  location: string;
  lat?: number;
  lng?: number;
  /** Numéro de lot réel (ex. "LOT-000001"). Absent pour les données démo. */
  lotNumber?: string;
  /** true si aucune enchère n'est encore programmée pour ce lot. */
  nonProgramme?: boolean;
}

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

function getTimeLeft(endDate: string): { text: string; variant: "ok" | "warning" | "danger" } {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { text: "TERMINÉ", variant: "danger" };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return { text: `${days}j ${hours}h`, variant: "ok" };
  if (hours > 0) return { text: `${hours}h ${minutes}min`, variant: hours < 2 ? "warning" : "ok" };
  if (minutes <= 5) return { text: `${minutes}min`, variant: "danger" };
  return { text: `${minutes}min`, variant: "warning" };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface AuctionCardProps {
  auction: DemoAuction;
  basePath?: string;
  layout?: "horizontal" | "vertical";
}

export function AuctionCard({ auction, basePath = "/catalogue", layout = "horizontal" }: AuctionCardProps) {
  const t = useT();
  const [currentImage, setCurrentImage] = useState(0);
  const images = auction.images.length > 0 ? auction.images : [null];
  const hasMultiple = auction.images.length > 1;
  const { text: timeLeftRaw, variant } = getTimeLeft(auction.endDate);
  const isEnded = new Date(auction.endDate).getTime() - Date.now() <= 0;
  const timeLeft = isEnded ? t("card.statusEnded") : timeLeftRaw;
  const CategoryIcon = categoryIcons[auction.categoryKey] ?? Package;

  const timerStyle: Record<string, { bg: string; color: string }> = {
    ok: { bg: "var(--success-subtle)", color: "var(--success)" },
    warning: { bg: "var(--warning-subtle)", color: "var(--warning)" },
    danger: { bg: "var(--danger-subtle)", color: "var(--danger)" },
  };

  const lotNumber = auction.lotNumber ?? `${t("card.lot")} ${String(auction.id).padStart(3, "0")}`;
  const typeLabel = auction.type === "judiciaire" ? t("card.judiciaire") : t("cat.volontaire");
  const typeBadgeClass = auction.type === "judiciaire" ? "badge-type" : "badge-type-vol";

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentImage((p) => (p + 1) % images.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentImage((p) => (p - 1 + images.length) % images.length);
  };

  if (layout === "horizontal") {
    return (
      <Link href={`${basePath}/${auction.id}`} className="block group">
        <div className="card-interactive flex overflow-hidden" style={{ minHeight: "160px" }}>
          {/* Image */}
          <div className="relative shrink-0 w-[180px] sm:w-[200px]" style={{ background: "var(--surface-sunken)" }}>
            {images[currentImage] ? (
              <img
                src={images[currentImage]!}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CategoryIcon size={40} style={{ color: "var(--ink-disabled)" }} />
              </div>
            )}
            {hasMultiple && (
              <>
                <button onClick={prevImage} className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Précédent">
                  <ChevronLeft size={14} style={{ color: "var(--teal-deep)" }} />
                </button>
                <button onClick={nextImage} className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Suivant">
                  <ChevronRight size={14} style={{ color: "var(--teal-deep)" }} />
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="badge badge-lot">{lotNumber}</span>
                <span className={`badge ${typeBadgeClass}`}>{typeLabel}</span>
              </div>
              <span className="badge badge-subtle mb-2 inline-block">{auction.category}</span>
              <h3 className="text-[15px] font-semibold mb-1 line-clamp-2" style={{ color: "var(--ink)" }}>
                {auction.title}
              </h3>
              <p className="flex items-center gap-1 text-[12px] mb-2" style={{ color: "var(--ink-muted)" }}>
                <MapPin size={12} />
                {auction.location}, {auction.country}
              </p>
              <div className="flex items-center gap-4 text-[12px] mb-3" style={{ color: "var(--ink-muted)" }}>
                <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(auction.scheduleDate)}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{auction.liveTime}</span>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--ink-muted)", fontWeight: 600 }}>{t("card.currentBid")}</p>
                <p className="text-price text-[16px]">
                  {auction.currentPrice.toLocaleString("fr-FR")} <span className="text-[12px] font-medium" style={{ color: "var(--ink-muted)" }}>{auction.currency}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="badge"
                  style={{ background: timerStyle[variant].bg, color: timerStyle[variant].color }}
                >
                  {timeLeft}
                </span>
                <span className="btn btn-gold btn-sm" style={{ pointerEvents: "none", opacity: isEnded ? 0.45 : 1 }}>
                  <Gavel size={14} />
                  {isEnded ? t("card.endedShort") : t("card.bid")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* Vertical layout (catalogue grid / mobile) */
  return (
    <Link href={`${basePath}/${auction.id}`} className="block group">
      <div className="card-interactive flex flex-col h-full overflow-hidden">
        {/* Image */}
        <div className="relative h-48" style={{ background: "var(--surface-sunken)" }}>
          {images[currentImage] ? (
            <img src={images[currentImage]!} alt={auction.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CategoryIcon size={48} style={{ color: "var(--ink-disabled)" }} />
            </div>
          )}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="badge badge-lot">{lotNumber}</span>
            <span className={`badge ${typeBadgeClass}`}>{typeLabel}</span>
          </div>
          {hasMultiple && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Précédent">
                <ChevronLeft size={16} style={{ color: "var(--teal-deep)" }} />
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Suivant">
                <ChevronRight size={16} style={{ color: "var(--teal-deep)" }} />
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <span className="badge badge-subtle mb-2 self-start">{auction.category}</span>
          <h3 className="text-[15px] font-semibold mb-2 line-clamp-2" style={{ color: "var(--ink)" }}>
            {auction.title}
          </h3>
          <p className="flex items-center gap-1 text-[12px] mb-3" style={{ color: "var(--ink-muted)" }}>
            <MapPin size={12} />
            {auction.location}, {auction.country}
          </p>

          <div className="mt-auto">
            <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--ink-muted)", fontWeight: 600 }}>{t("card.currentBid")}</p>
            <p className="text-price text-[17px] mb-3">
              {auction.currentPrice.toLocaleString("fr-FR")} <span className="text-[12px] font-medium" style={{ color: "var(--ink-muted)" }}>{auction.currency}</span>
            </p>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                {formatDate(auction.scheduleDate)} · {auction.liveTime}
              </p>
              <span
                className="badge"
                style={{ background: timerStyle[variant].bg, color: timerStyle[variant].color }}
              >
                {timeLeft}
              </span>
            </div>
            <button
              className="btn btn-gold w-full"
              type="button"
              disabled={isEnded}
              style={{ pointerEvents: "none" }}
            >
              <Gavel size={16} />
              {isEnded ? t("card.saleEnded") : t("card.participate")}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
