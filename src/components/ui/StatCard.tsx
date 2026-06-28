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
        className="text-[12px] font-medium mb-2"
        style={{ color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}
      >
        {label}
      </p>
      <p
        className="text-[28px] font-semibold leading-none"
        style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
      >
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>
      {href && (
        <div className="mt-auto pt-3 flex items-center gap-1" style={{ color: "var(--accent-sage)" }}>
          <span className="text-[11px] font-medium">Voir</span>
          <ArrowRight size={11} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="card-interactive p-4 block" style={{ minHeight: "88px" }}>
        {content}
      </Link>
    );
  }

  return <div className="card p-4" style={{ minHeight: "88px" }}>{content}</div>;
}
