"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DemoAuction } from "@/components/marketing/AuctionCard";

// Marqueur personnalisé aux couleurs de la charte (or / pétrole).
function buildIcon(count?: number) {
  const badge =
    count && count > 1
      ? `<span style="position:absolute;top:-6px;right:-6px;background:#9E2B25;color:#fff;font-size:10px;font-weight:700;min-width:16px;height:16px;line-height:16px;border-radius:8px;padding:0 3px;text-align:center;">${count}</span>`
      : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:26px;height:26px;">
      <div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#FDC134;border:2px solid #0F3C4D;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
      <div style="position:absolute;top:6px;left:8px;width:10px;height:10px;border-radius:50%;background:#0F3C4D;"></div>
      ${badge}
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function LotsMap({
  auctions,
  basePath = "/catalogue",
}: {
  auctions: DemoAuction[];
  basePath?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Initialisation de la carte (une seule fois).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [9.5, -4],
      zoom: 5,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // (Re)dessine les marqueurs quand la liste filtrée change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const located = auctions.filter(
      (a) => typeof a.lat === "number" && typeof a.lng === "number"
    );

    // Décale légèrement les lots partageant les mêmes coordonnées.
    const seen = new Map<string, number>();
    const markers: L.Marker[] = [];

    located.forEach((a) => {
      const key = `${a.lat},${a.lng}`;
      const idx = seen.get(key) ?? 0;
      seen.set(key, idx + 1);
      const offset = idx === 0 ? 0 : 0.06 * idx;
      const lat = a.lat! + offset;
      const lng = a.lng! + offset;

      const marker = L.marker([lat, lng], { icon: buildIcon() });
      const href = `${basePath}/${a.id}`;
      marker.bindPopup(
        `<div style="min-width:170px;font-family:inherit;">
          <div style="font-weight:700;font-size:13px;color:#0A2A38;margin-bottom:2px;">${escapeHtml(
            a.title
          )}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px;">${escapeHtml(
            a.location
          )}, ${escapeHtml(a.country)}</div>
          <div style="font-weight:700;font-size:13px;color:#0F3C4D;margin-bottom:6px;">${a.currentPrice.toLocaleString(
            "fr-FR"
          )} ${escapeHtml(a.currency)}</div>
          <a href="${href}" style="display:inline-block;background:#FDC134;color:#0F3C4D;font-weight:700;font-size:12px;text-decoration:none;padding:5px 10px;border-radius:8px;">Voir le lot →</a>
        </div>`
      );
      marker.addTo(layer);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 7 });
    }
  }, [auctions, basePath]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-[var(--radius-lg)] overflow-hidden"
      style={{ height: "520px", zIndex: 0, border: "1px solid var(--border)" }}
    />
  );
}
