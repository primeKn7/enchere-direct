import Link from "next/link";

type SectionHeaderProps = {
  title: string;
  count?: number;
  href?: string;
  hrefLabel?: string;
};

export default function SectionHeader({ title, count, href, hrefLabel = "Tout voir" }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2>{title}</h2>
        {count !== undefined && (
          <span className="badge badge-subtle">{count}</span>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="text-[12px] font-medium transition-colors hover:underline"
          style={{ color: "var(--accent)" }}
        >
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}
