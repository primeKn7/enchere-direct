import Link from "next/link";
import { ArrowRight } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  href?: string;
};

export default function StatCard({ label, value, href }: StatCardProps) {
  const content = (
    <div className="flex flex-col h-full">
      <p
        className="text-[11px] font-bold mb-2 uppercase tracking-widest"
        style={{ color: "var(--ink-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-[30px] font-bold leading-none"
        style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
      >
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>
      {href && (
        <div className="mt-auto pt-3 flex items-center gap-1" style={{ color: "var(--accent-sage)" }}>
          <span className="text-[11px] font-semibold">Voir</span>
          <ArrowRight size={11} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="card-interactive p-5 block" style={{ minHeight: "96px" }}>
        {content}
      </Link>
    );
  }

  return <div className="card p-5" style={{ minHeight: "96px" }}>{content}</div>;
}
