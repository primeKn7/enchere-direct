"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

const MEDIA_TYPES = [
  { value: "PHOTO", label: "Photo HD", accept: "image/*" },
  { value: "VIDEO", label: "Vidéo HD", accept: "video/*" },
  { value: "VUE_360", label: "Vue 360°", accept: "image/*" },
  { value: "VISITE_VIRTUELLE", label: "Visite virtuelle", accept: "video/*" },
];

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
