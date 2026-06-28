import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import {
  Package,
  MapPin,
  QrCode,
  Tag,
  DollarSign,
  Camera,
  Video,
  RotateCcw,
  Home,
  Barcode,
  Wifi,
  ArrowLeft,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { hasPermission } from "@/types";
import MediaUpload from "./MediaUpload";

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

export default async function BienDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const role = session.user.role as Role;
  const canUpload = hasPermission(role, "DOSSIER_CREER");

  const bien = await prisma.bienSaisi.findUnique({
    where: { id },
    include: {
      dossier: { select: { id: true, referenceJudiciaire: true } },
      medias: { orderBy: { createdAt: "desc" } },
      expertises: { orderBy: { createdAt: "desc" } },
      estimationIA: true,
    },
  });

  if (!bien) notFound();

  const photos = bien.medias.filter((m) => m.type === "PHOTO");
  const videos = bien.medias.filter((m) => m.type === "VIDEO");
  const vues360 = bien.medias.filter((m) => m.type === "VUE_360");
  const visites = bien.medias.filter((m) => m.type === "VISITE_VIRTUELLE");

  return (
    <div>
      <Link
        href="/dashboard/inventaire"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] mb-6"
      >
        <ArrowLeft size={14} /> Retour à l&apos;inventaire
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Package size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Détail du bien</h1>
        <span className="badge badge-subtle">{bien.categorie}</span>
      </div>

      {/* Fiche Bien */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Description */}
        <div className="glass-surface p-6 space-y-3 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={20} className="text-[var(--accent)]" />
            <h3 className="text-[var(--ink)] font-semibold">Fiche descriptive</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Catégorie" value={bien.categorie} />
            <InfoRow label="Sous-catégorie" value={bien.sousCategorie ?? "—"} />
            <InfoRow label="État général" value={bien.etatGeneral} />
            <InfoRow
              label="Dossier"
              value={bien.dossier.referenceJudiciaire}
              icon={<FileText size={14} className="text-[var(--ink-muted)]" />}
            />
          </div>
          <div className="pt-2">
            <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
              Description
            </span>
            <p className="text-[var(--ink)] mt-1 whitespace-pre-wrap">
              {bien.description}
            </p>
          </div>
          <div className="pt-1">
            <InfoRow
              label="Localisation"
              value={bien.localisation}
              icon={<MapPin size={14} className="text-[var(--ink-muted)]" />}
            />
          </div>
        </div>

        {/* Valorisation */}
        <div className="glass-surface p-6 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={20} className="text-[var(--accent)]" />
            <h3 className="text-[var(--ink)] font-semibold">Valorisation</h3>
          </div>
          <div>
            <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
              Valeur estimée
            </span>
            <p className="text-2xl font-bold text-[var(--ink)] mt-1">
              {Number(bien.valeurEstimee).toLocaleString("fr-FR")} FCFA
            </p>
          </div>
          {bien.estimationIA && (
            <div>
              <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
                Estimation IA
              </span>
              <p className="text-xl font-bold text-[var(--accent)] mt-1">
                {Number(bien.estimationIA.valeurPredite).toLocaleString("fr-FR")} FCFA
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                Confiance : {(bien.estimationIA.indiceConfiance * 100).toFixed(0)}%
              </p>
            </div>
          )}
          {bien.expertises.length > 0 && (
            <div>
              <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
                Expertises
              </span>
              <p className="text-[var(--ink)] font-medium mt-1">
                {bien.expertises.length} rapport(s)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Identification physique */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <QrCode size={22} className="text-[var(--accent)]" />
          <h3 className="text-lg font-semibold text-[var(--ink)]">
            Identification physique
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* QR Code */}
          <div className="glass-surface p-6 text-center">
            <QrCode size={20} className="mx-auto mb-2 text-[var(--accent)]" />
            <p className="text-xs text-[var(--ink-muted)] uppercase tracking-wider mb-3">
              QR Code
            </p>
            {bien.qrCodeDataUrl ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bien.qrCodeDataUrl}
                  alt="QR Code du bien"
                  className="mx-auto"
                  width={200}
                  height={200}
                />
                <p className="text-xs text-[var(--ink-muted)] mt-2 font-mono">
                  {bien.qrCode}
                </p>
              </div>
            ) : (
              <p className="text-[var(--ink-muted)]">Non généré</p>
            )}
          </div>

          {/* Code-barres */}
          <div className="glass-surface p-6 text-center">
            <Barcode size={20} className="mx-auto mb-2 text-[var(--accent)]" />
            <p className="text-xs text-[var(--ink-muted)] uppercase tracking-wider mb-3">
              Code-barres
            </p>
            {bien.codeBarre ? (
              <div>
                <div className="mx-auto w-fit px-4 py-3 bg-[var(--surface-sunken)] border border-[var(--border)] rounded-[var(--radius-md)] font-mono text-lg tracking-widest text-[var(--ink)]">
                  {bien.codeBarre}
                </div>
                <p className="text-xs text-[var(--ink-muted)] mt-2">
                  Format : CODE128
                </p>
              </div>
            ) : (
              <p className="text-[var(--ink-muted)]">Non généré</p>
            )}
          </div>

          {/* RFID */}
          <div className="glass-surface p-6 text-center">
            <Wifi size={20} className="mx-auto mb-2 text-[var(--accent)]" />
            <p className="text-xs text-[var(--ink-muted)] uppercase tracking-wider mb-3">
              Puce RFID
            </p>
            {bien.rfid ? (
              <div className="mx-auto w-fit px-4 py-3 bg-[var(--surface-sunken)] border border-[var(--border)] rounded-[var(--radius-md)] font-mono text-sm text-[var(--ink)]">
                {bien.rfid}
              </div>
            ) : (
              <p className="text-[var(--ink-muted)]">Non configurée</p>
            )}
          </div>
        </div>
      </div>

      {/* Médias HD */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Camera size={22} className="text-[var(--accent)]" />
          <h3 className="text-lg font-semibold text-[var(--ink)]">
            Ressources Médias HD
          </h3>
          <span className="text-sm text-[var(--ink-muted)]">
            ({bien.medias.length} fichier{bien.medias.length !== 1 ? "s" : ""})
          </span>
        </div>

        {canUpload && <MediaUpload bienId={bien.id} />}

        {/* Photos */}
        {photos.length > 0 && (
          <MediaSection title="Photos HD" icon="PHOTO" items={photos} />
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <MediaSection title="Vidéos HD" icon="VIDEO" items={videos} />
        )}

        {/* 360 */}
        {vues360.length > 0 && (
          <MediaSection title="Vues 360°" icon="VUE_360" items={vues360} />
        )}

        {/* Visites virtuelles */}
        {visites.length > 0 && (
          <MediaSection
            title="Visites virtuelles"
            icon="VISITE_VIRTUELLE"
            items={visites}
          />
        )}

        {bien.medias.length === 0 && (
          <div className="glass-surface p-8 text-center">
            <Camera
              size={40}
              className="mx-auto mb-3 text-[var(--ink-disabled)]"
            />
            <p className="text-[var(--ink-muted)]">
              Aucun média ajouté. Les photos HD, vidéos, vues 360° et visites
              virtuelles apparaîtront ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
        {label}
      </span>
      <p className="text-[var(--ink)] font-medium flex items-center gap-1.5 mt-0.5">
        {icon}
        {value}
      </p>
    </div>
  );
}

function MediaSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: { id: string; type: string; url: string; createdAt: Date }[];
}) {
  const isImage = icon === "PHOTO" || icon === "VUE_360";

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {MEDIA_ICONS[icon]}
        <h4 className="text-sm font-medium text-[var(--ink)]">
          {title} ({items.length})
        </h4>
      </div>
      <div
        className={
          isImage
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            : "grid grid-cols-1 md:grid-cols-2 gap-4"
        }
      >
        {items.map((m) =>
          isImage ? (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-surface overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={MEDIA_LABELS[m.type]}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="p-2 flex items-center justify-between">
                <span className="badge badge-subtle text-xs">
                  {MEDIA_LABELS[m.type]}
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </a>
          ) : (
            <div key={m.id} className="glass-surface overflow-hidden">
              <video
                controls
                preload="metadata"
                className="w-full"
                style={{ maxHeight: "300px" }}
              >
                <source src={m.url} />
              </video>
              <div className="p-2 flex items-center justify-between">
                <span className="badge badge-subtle text-xs">
                  {MEDIA_LABELS[m.type]}
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
