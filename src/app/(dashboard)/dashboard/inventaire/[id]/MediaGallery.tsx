"use client";

import { useState } from "react";
import { Camera, Video, RotateCcw, Home } from "lucide-react";

const MEDIA_ICONS: Record<string, React.ReactNode> = {
  PHOTO: <Camera size={14} />,
  VIDEO: <Video size={14} />,
  VUE_360: <RotateCcw size={14} />,
  VISITE_VIRTUELLE: <Home size={14} />,
};

const MEDIA_LABELS: Record<string, string> = {
  PHOTO: "Photo HD",
  VIDEO: "Vidéo HD",
  VUE_360: "Vue 360°",
  VISITE_VIRTUELLE: "Visite virtuelle",
};

type MediaItem = { id: string; type: string; url: string; createdAt: string | Date };

// Classes de grille selon le nombre de colonnes choisi (desktop uniquement).
const COL_CLASS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

export default function MediaGallery({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: MediaItem[];
}) {
  const isImage = icon === "PHOTO" || icon === "VUE_360";
  // Vidéos : par défaut 2 colonnes ; images : 3 colonnes.
  const [cols, setCols] = useState(isImage ? 3 : 2);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          {MEDIA_ICONS[icon]}
          <h4 className="text-sm font-medium text-[var(--ink)]">
            {title} ({items.length})
          </h4>
        </div>

        {/* Sélecteur de colonnes — visible sur desktop seulement (mobile = défilement). */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-[var(--ink-muted)]">Colonnes</span>
          <div className="seg" role="tablist" style={{ width: "auto" }}>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCols(n)}
                className={`seg-btn ${cols === n ? "active" : ""}`}
                style={{ flex: "none", minWidth: 38, padding: "0 12px" }}
                aria-pressed={cols === n}
              >
                {n === 4 ? "4+" : n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/*
        Mobile : carrousel à défilement horizontal (snap), chaque élément a une
        largeur fixe → l'utilisateur swipe pour parcourir les médias.
        Desktop (sm+) : grille classique au nombre de colonnes choisi.
      */}
      <div
        className={`flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:gap-4 sm:overflow-visible sm:pb-0 ${COL_CLASS[cols]}`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((m) => (
          <div
            key={m.id}
            className="snap-start shrink-0 w-[80%] xs:w-[70%] sm:w-auto"
          >
            {isImage ? (
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-surface overflow-hidden group block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={MEDIA_LABELS[m.type]}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <MediaFooter type={m.type} createdAt={m.createdAt} />
              </a>
            ) : (
              <div className="glass-surface overflow-hidden">
                <video controls preload="metadata" className="w-full" style={{ maxHeight: "300px" }}>
                  <source src={m.url} />
                </video>
                <MediaFooter type={m.type} createdAt={m.createdAt} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaFooter({ type, createdAt }: { type: string; createdAt: string | Date }) {
  return (
    <div className="p-2 flex items-center justify-between">
      <span className="badge badge-subtle text-xs">{MEDIA_LABELS[type]}</span>
      <span className="text-xs text-[var(--ink-muted)]">
        {new Date(createdAt).toLocaleDateString("fr-FR")}
      </span>
    </div>
  );
}
