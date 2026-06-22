import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string | number;
  href?: string;
};

export default function StatCard({ label, value, href }: StatCardProps) {
  const content = (
    <>
      <p
        className="text-[32px] font-semibold leading-tight"
        style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
      >
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>
      <p className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>
        {label}
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="card-interactive p-4 block">
        {content}
      </Link>
    );
  }

  return <div className="card p-4">{content}</div>;
}
