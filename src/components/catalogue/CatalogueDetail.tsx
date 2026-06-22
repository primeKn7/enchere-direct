import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, Clock, Gavel, Car, Home, Gem, Palette, Smartphone, Sofa, Cog, Package } from "lucide-react";
import { getAuctionById } from "@/lib/demo-data";
import Link from "next/link";

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

export default function CatalogueDetail({
  id,
  backHref,
  ctaHref,
  ctaLabel,
}: {
  id: string;
  backHref: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const auction = getAuctionById(id);

  if (!auction) {
    notFound();
  }

  const isEnded = new Date(auction.endDate).getTime() <= Date.now();
  const CategoryIcon = categoryIcons[auction.categoryKey] ?? Package;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[14px] hover:underline"
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft size={16} />
          Retour au catalogue
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          className="h-96 flex items-center justify-center rounded-[var(--radius-lg)]"
          style={{ background: "var(--surface-sunken)" }}
        >
          <CategoryIcon size={96} style={{ color: "var(--ink-muted)" }} />
        </div>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="badge badge-subtle">{auction.category}</span>
            {auction.type === "judiciaire" && (
              <span className="badge badge-warning">Judiciaire</span>
            )}
          </div>

          <h1 className="mb-4">{auction.title}</h1>

          <p className="text-[14px] mb-6" style={{ color: "var(--ink-secondary)" }}>
            {auction.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-[var(--radius-md)]" style={{ background: "var(--surface-sunken)" }}>
              <p className="text-[12px] mb-1" style={{ color: "var(--ink-muted)" }}>Prix de départ</p>
              <p className="text-[16px] font-semibold" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {auction.startingPrice.toLocaleString("fr-FR")} {auction.currency}
              </p>
            </div>
            <div className="p-4 rounded-[var(--radius-md)]" style={{ background: "var(--surface-sunken)" }}>
              <p className="text-[12px] mb-1" style={{ color: "var(--ink-muted)" }}>Mise actuelle</p>
              <p className="text-[20px] font-semibold" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {auction.currentPrice.toLocaleString("fr-FR")} {auction.currency}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-8 text-[14px]" style={{ color: "var(--ink-secondary)" }}>
            <p className="flex items-center gap-2">
              <MapPin size={16} style={{ color: "var(--ink-muted)" }} />
              <span className="font-medium">Localisation :</span> {auction.location}, {auction.country}
            </p>
            <p className="flex items-center gap-2">
              <Calendar size={16} style={{ color: "var(--ink-muted)" }} />
              <span className="font-medium">Date :</span> {new Date(auction.scheduleDate).toLocaleDateString("fr-FR")}
            </p>
            <p className="flex items-center gap-2">
              <Clock size={16} style={{ color: "var(--ink-muted)" }} />
              <span className="font-medium">Heure :</span> {auction.liveTime}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">État :</span> {auction.condition}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">Vendeur :</span> {auction.sellerName}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">Clôture :</span>{" "}
              {new Date(auction.endDate).toLocaleString("fr-FR")}
            </p>
          </div>

          <Link
            href={ctaHref ?? "/login"}
            className={`btn ${isEnded ? "btn-secondary" : "btn-primary"}`}
          >
            <Gavel size={18} />
            {isEnded ? "Vente terminée" : (ctaLabel ?? "Se connecter pour enchérir")}
          </Link>
        </div>
      </div>
    </div>
  );
}
