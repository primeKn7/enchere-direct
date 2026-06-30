"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

// Formats réellement acceptés côté serveur (voir /api/biens/[id]/medias).
const MEDIA_TYPES = [
  { value: "PHOTO", label: "Photo HD", accept: "image/jpeg,image/png,image/webp" },
  { value: "VIDEO", label: "Vidéo HD", accept: "video/mp4,video/webm" },
  { value: "VUE_360", label: "Vue 360°", accept: "image/jpeg,image/png,image/webp" },
  { value: "VISITE_VIRTUELLE", label: "Visite virtuelle", accept: "video/mp4,video/webm" },
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 Mo (identique au serveur)
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_MIMES = ["video/mp4", "video/webm"];

export default function MediaUpload({ bienId }: { bienId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedType, setSelectedType] = useState("PHOTO");

  const currentAccept =
    MEDIA_TYPES.find((t) => t.value === selectedType)?.accept ?? "image/*";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const fd = new FormData(e.currentTarget);
    const file = fd.get("file") as File | null;

    // Validation immédiate (évite un aller-retour serveur qui échoue).
    if (file && file.size > 0) {
      const isVideo = selectedType === "VIDEO" || selectedType === "VISITE_VIRTUELLE";
      const allowed = isVideo ? VIDEO_MIMES : IMAGE_MIMES;
      if (file.size > MAX_FILE_SIZE) {
        setError(
          `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(0)} Mo). Maximum : 100 Mo.`
        );
        setLoading(false);
        return;
      }
      if (file.type && !allowed.includes(file.type)) {
        setError(
          isVideo
            ? `Format vidéo non supporté (${file.type || "inconnu"}). Utilisez du MP4 (H.264) ou WebM — pas de .mov, .avi ni .mkv.`
            : `Format image non supporté (${file.type || "inconnu"}). Utilisez JPEG, PNG ou WebP.`
        );
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/biens/${bienId}/medias`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(
          typeof data.error === "string"
            ? data.error
            : "Erreur lors de l'upload."
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
      formRef.current?.reset();
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="glass-surface p-4 mb-6"
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">
            Type de média
          </label>
          <select
            name="type"
            required
            className="input"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            {MEDIA_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">
            Fichier
          </label>
          <input
            ref={fileRef}
            name="file"
            type="file"
            accept={currentAccept}
            required
            className="input text-sm"
            style={{ lineHeight: "28px" }}
          />
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            {selectedType === "VIDEO" || selectedType === "VISITE_VIRTUELLE"
              ? "MP4 (H.264) ou WebM, 100 Mo max. La résolution n'a pas d'importance."
              : "JPEG, PNG ou WebP, 100 Mo max."}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-sm"
        >
          <Upload size={14} />
          {loading ? "Envoi..." : "Ajouter"}
        </button>
      </div>

      {error && <p className="text-sm text-[var(--danger)] mt-2">{error}</p>}
      {success && (
        <p className="text-sm text-[var(--success)] mt-2">
          Média ajouté avec succès.
        </p>
      )}
    </form>
  );
}
