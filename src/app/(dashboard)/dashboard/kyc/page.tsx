"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Check,
  Camera,
  ImagePlus,
  ShieldCheck,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";

type DocType = "CNI" | "PASSEPORT" | "PERMIS";
type Statut = "saisie" | "EN_ATTENTE" | "VALIDE" | "REJETE";

const DOC_TYPES: { key: DocType; label: string }[] = [
  { key: "CNI", label: "CNI" },
  { key: "PASSEPORT", label: "Passeport" },
  { key: "PERMIS", label: "Permis" },
];

const STEPS = ["Email", "Pièce d'identité", "Validation"];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-7">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="flex items-center justify-center rounded-full text-[12px] font-bold shrink-0"
                style={{
                  width: 30,
                  height: 30,
                  border: "2px solid",
                  borderColor: done ? "var(--success)" : active ? "var(--accent-gold)" : "var(--border-strong)",
                  background: done ? "var(--success)" : active ? "var(--accent-gold)" : "var(--surface-primary)",
                  color: done ? "#fff" : active ? "var(--teal-deep)" : "var(--ink-muted)",
                }}
              >
                {done ? <Check size={15} /> : i + 1}
              </div>
              <span
                className="text-[10px] font-semibold whitespace-nowrap"
                style={{ color: active ? "var(--accent)" : done ? "var(--success)" : "var(--ink-muted)" }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="rounded-full"
                style={{ flex: 1, height: 2, margin: "0 8px", marginBottom: 18, background: done ? "var(--success)" : "var(--border-strong)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PhotoBox({
  label,
  file,
  onPick,
}: {
  label: string;
  file?: File;
  onPick: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const done = Boolean(file);
  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] px-3 text-center transition-colors"
        style={{
          height: 110,
          border: `1.5px dashed ${done ? "var(--success)" : "var(--border-strong)"}`,
          background: done ? "var(--success-subtle)" : "transparent",
        }}
      >
        <div
          className="flex items-center justify-center rounded-[var(--radius-md)]"
          style={{ width: 30, height: 30, border: "1.5px solid", borderColor: done ? "var(--success)" : "var(--border-strong)", color: done ? "var(--success)" : "var(--ink-muted)" }}
        >
          {done ? <Check size={16} /> : <ImagePlus size={16} />}
        </div>
        <span className="text-[12px] font-semibold truncate max-w-full" style={{ color: done ? "var(--success)" : "var(--ink-muted)" }}>
          {done ? file!.name : label}
        </span>
      </button>
    </div>
  );
}

export default function KycPage() {
  const [docType, setDocType] = useState<DocType>("CNI");
  const [docNumber, setDocNumber] = useState("");
  const [recto, setRecto] = useState<File>();
  const [verso, setVerso] = useState<File>();
  const [selfie, setSelfie] = useState<File>();
  const [submitting, setSubmitting] = useState(false);
  const [statut, setStatut] = useState<Statut>("saisie");
  const [motifRejet, setMotifRejet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selfieRef = useRef<HTMLInputElement>(null);

  // Récupère le statut KYC réel au chargement.
  useEffect(() => {
    fetch("/api/kyc/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.compteVerifie || json.demande?.statut === "VALIDE") {
          setStatut("VALIDE");
        } else if (json.demande?.statut === "EN_ATTENTE") {
          setStatut("EN_ATTENTE");
        } else if (json.demande?.statut === "REJETE") {
          setStatut("REJETE");
          setMotifRejet(json.demande.motifRejet ?? null);
        }
      })
      .catch(() => {});
  }, []);

  const complete = Boolean(docNumber.trim() && recto && selfie);

  async function handleSubmit() {
    if (!complete || !recto || !selfie) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("typeDocument", docType);
    fd.set("numeroDocument", docNumber.trim());
    fd.set("recto", recto);
    if (verso) fd.set("verso", verso);
    fd.set("selfie", selfie);
    try {
      const res = await fetch("/api/kyc", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Échec de l'envoi.");
        setSubmitting(false);
        return;
      }
      setStatut("EN_ATTENTE");
      setMotifRejet(null);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelCls = "block text-[11px] font-bold uppercase tracking-widest mb-2";
  const stepperStep = statut === "VALIDE" ? 3 : statut === "EN_ATTENTE" ? 2 : 1;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard" className="p-1 -ml-1 rounded-[var(--radius-md)] transition-colors" style={{ color: "var(--ink-muted)" }} aria-label="Retour">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-[var(--ink)]">Vérification d&apos;identité</h1>
      </div>

      <Stepper current={stepperStep} />

      {statut === "VALIDE" ? (
        <div className="rounded-[var(--radius-xl)] p-6 text-center" style={{ background: "var(--success-subtle)" }}>
          <div className="mx-auto mb-3 flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "var(--success)", color: "#fff" }}>
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-[17px] font-bold mb-1" style={{ color: "var(--ink)" }}>Compte vérifié</h2>
          <p className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
            Votre identité a été validée. Vous pouvez désormais enchérir.
          </p>
        </div>
      ) : statut === "EN_ATTENTE" ? (
        <div className="rounded-[var(--radius-xl)] p-6 text-center" style={{ background: "var(--warning-subtle)" }}>
          <div className="mx-auto mb-3 flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "var(--warning)", color: "#fff" }}>
            <Clock size={28} />
          </div>
          <h2 className="text-[17px] font-bold mb-1" style={{ color: "var(--ink)" }}>Documents envoyés</h2>
          <p className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
            Vos documents sont en cours de vérification par un agent habilité. Vous serez notifié dès la validation.
          </p>
        </div>
      ) : (
        <>
          {statut === "REJETE" && (
            <div className="alert alert-danger mb-5 flex items-start gap-2">
              <XCircle size={16} className="mt-0.5 shrink-0" />
              <span><strong>Demande rejetée.</strong> {motifRejet ? motifRejet : "Veuillez resoumettre des pièces valides."}</span>
            </div>
          )}
          {error && (
            <div className="alert alert-danger mb-5 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <p className="text-[13px] leading-relaxed mb-7" style={{ color: "var(--ink-secondary)" }}>
            Pour enchérir, vérifiez votre identité. Vos documents sont confidentiels et seuls les agents de validation y ont accès.
          </p>

          <div className="mb-6">
            <span className={labelCls} style={{ color: "var(--ink-muted)" }}>Type de document</span>
            <div className="grid grid-cols-3 gap-2">
              {DOC_TYPES.map((d) => {
                const selected = docType === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDocType(d.key)}
                    className="h-11 rounded-[var(--radius-md)] text-[13px] font-semibold transition-colors"
                    style={{
                      background: selected ? "var(--teal-deep)" : "var(--surface-primary)",
                      color: selected ? "#fff" : "var(--ink-secondary)",
                      border: `1.5px solid ${selected ? "var(--teal-deep)" : "var(--border-strong)"}`,
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className={labelCls} style={{ color: "var(--ink-muted)" }}>Numéro du document</label>
            <input type="text" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className="input" placeholder="Ex : 1234567890" />
          </div>

          <div className="mb-6">
            <span className={labelCls} style={{ color: "var(--ink-muted)" }}>Photos du document</span>
            <div className="grid grid-cols-2 gap-3">
              <PhotoBox label="Recto" file={recto} onPick={setRecto} />
              <PhotoBox label="Verso (optionnel)" file={verso} onPick={setVerso} />
            </div>
          </div>

          <input
            ref={selfieRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setSelfie(f);
            }}
          />
          <button
            type="button"
            onClick={() => selfieRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 mb-7 rounded-[var(--radius-lg)] text-left transition-colors"
            style={{ border: "1px solid var(--border)", background: "var(--surface-primary)" }}
          >
            <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 44, height: 44, background: selfie ? "var(--success)" : "var(--surface-sunken)", color: selfie ? "#fff" : "var(--ink-muted)" }}>
              {selfie ? <Check size={20} /> : <Camera size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Selfie de vérification</p>
              <p className="text-[12px] truncate" style={{ color: "var(--ink-muted)" }}>{selfie?.name ?? "Prenez-vous en photo"}</p>
            </div>
            <span className="text-[13px] font-semibold shrink-0" style={{ color: "var(--accent)" }}>Ouvrir →</span>
          </button>

          <button type="button" onClick={handleSubmit} disabled={!complete || submitting} className="btn btn-gold btn-lg w-full justify-center">
            {submitting ? "Envoi en cours…" : "Soumettre pour vérification"}
          </button>

          <p className="text-center text-[12px] mt-4 flex items-center justify-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
            <ShieldCheck size={13} /> Vos pièces sont chiffrées en transit et à accès restreint
          </p>
        </>
      )}
    </div>
  );
}
