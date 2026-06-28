"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

const DOC_TYPES = [
  { value: "PV_SAISIE", label: "PV de saisie" },
  { value: "JUGEMENT", label: "Jugement" },
  { value: "ORDONNANCE", label: "Ordonnance" },
  { value: "EXPERTISE", label: "Expertise" },
];

const ACCEPTED = ".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.mp4,.webm";

export default function DocumentUpload({ dossierId }: { dossierId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/saisies/${dossierId}/documents`, {
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
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">
            Fichier
          </label>
          <input
            name="file"
            type="file"
            accept={ACCEPTED}
            required
            className="input text-sm"
            style={{ lineHeight: "28px" }}
          />
        </div>

        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">
            Type de document
          </label>
          <select name="type" required className="input">
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
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
          Document ajouté avec succès.
        </p>
      )}
    </form>
  );
}
