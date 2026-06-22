"use client";

import { useState } from "react";
import Link from "next/link";
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

function getTimeLeft(endDate: string): { text: string; variant: "brand" | "warning" | "danger" } {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return { text: "TERMINÉ", variant: "danger" };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return { text: `${days}j ${hours}h`, variant: "brand" };
  if (hours > 0) return { text: `${hours}h ${minutes}min`, variant: hours < 1 ? "warning" : "brand" };
  if (minutes <= 5) return { text: `${minutes}min`, variant: "danger" };
  return { text: `${minutes}min`, variant: "warning" };
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface AuctionCardProps {
  auction: DemoAuction;
  basePath?: string;
}

export function AuctionCard({ auction, basePath = "/catalogue" }: AuctionCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const images =
    auction.images.length > 0 ? auction.images : [null];
  const hasMultipleImages = auction.images.length > 1;

  const { text: timeLeft, variant: timerVariant } = getTimeLeft(auction.endDate);
  const isEnded = timeLeft === "TERMINÉ";
  const CategoryIcon = categoryIcons[auction.categoryKey] ?? Package;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage(idx);
  };

  const timerClasses = {
    brand: "bg-[var(--accent-subtle)] text-[var(--accent)]",
    warning: "bg-[var(--warning-subtle)] text-[var(--warning)]",
    danger: "bg-[var(--danger-subtle)] text-[var(--danger)] animate-pulse",
  };

  return (
    <Link href={`${basePath}/${auction.id}`} className="block group">
      <div className="glass-surface transition-all duration-250 ease-out hover:-translate-y-1 h-full flex flex-col">
        <div className="relative h-48 overflow-hidden rounded-t-[var(--radius-lg)]">
          {images[currentImage] ? (
            <img
              src={images[currentImage]}
              alt={`${auction.title} - Image ${currentImage + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "var(--surface-sunken)" }}
            >
              <CategoryIcon size={48} className="text-[var(--ink-muted)]" />
            </div>
          )}

          <div className="absolute top-3 left-3">
            <span className="badge badge-brand">{auction.category}</span>
          </div>

          {auction.type === "judiciaire" && (
            <div className="absolute top-3 right-3">
              <span className="badge badge-judiciaire">Judiciaire</span>
            </div>
          )}

          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                aria-label="Image précédente"
              >
                <ChevronLeft size={18} className="text-[var(--accent)]" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                aria-label="Image suivante"
              >
                <ChevronRight size={18} className="text-[var(--accent)]" />
              </button>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => goToImage(e, idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentImage === idx ? "bg-[var(--accent)]" : "bg-white/60"
                    }`}
                    aria-label={`Voir image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col relative z-10">
          <div className="flex items-center gap-2 mb-3 text-sm text-[var(--ink-muted)]">
            <MapPin size={14} />
            <span>{auction.country}</span>
          </div>

          <h3 className="text-lg font-semibold text-[var(--ink)] mb-3 line-clamp-2">
            {auction.title}
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-[var(--ink-muted)]">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{formatDate(auction.scheduleDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>{auction.liveTime}</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-[var(--ink-muted)] mb-1">Prix de départ</p>
            <p className="text-lg text-price-start">
              {auction.startingPrice.toLocaleString("fr-FR")} {auction.currency}
            </p>
          </div>

          <div className="flex items-center justify-between mb-5 mt-auto">
            <div>
              <p className="text-xs text-[var(--ink-muted)] mb-1">Mise actuelle</p>
              <p className="text-xl text-price">
                {auction.currentPrice.toLocaleString("fr-FR")} {auction.currency}
              </p>
            </div>
            <span className={`badge ${timerClasses[timerVariant]}`} aria-live="polite">
              {isEnded ? "Expirée" : timeLeft}
            </span>
          </div>

          <button className="btn btn-gold w-full" type="button" disabled={isEnded}>
            <Gavel size={18} />
            {isEnded ? "Vente terminée" : "Participer"}
          </button>
        </div>
      </div>
    </Link>
  );
}
