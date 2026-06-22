import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: { label: string; href: string };
  illustration?: "auction" | "wallet" | "award" | "search" | "list";
};

function Illustration({ type }: { type: NonNullable<EmptyStateProps["illustration"]> }) {
  const style = { stroke: "var(--ink-disabled)", fill: "none" } as const;

  if (type === "auction") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" {...style} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 38h28" />
        <path d="M18 38V22" />
        <path d="M30 38V22" />
        <rect x="14" y="18" width="20" height="4" rx="1" />
        <path d="M24 18v-4" />
        <circle cx="24" cy="11" r="3" />
      </svg>
    );
  }

  if (type === "wallet") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" {...style} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="14" width="32" height="22" rx="3" />
        <path d="M8 22h32" />
        <circle cx="34" cy="28" r="2" />
        <path d="M12 14l4-4h16l4 4" />
      </svg>
    );
  }

  if (type === "award") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" {...style} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="24" cy="18" r="10" />
        <path d="M18 26l-4 14 10-5 10 5-4-14" />
      </svg>
    );
  }

  if (type === "search") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" {...style} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="22" cy="22" r="10" />
        <path d="M30 30l8 8" />
        <path d="M18 22h8" />
      </svg>
    );
  }

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" {...style} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="8" width="28" height="32" rx="3" />
      <path d="M16 16h16" />
      <path d="M16 22h12" />
      <path d="M16 28h8" />
    </svg>
  );
}

export default function EmptyState({ title, description, action, illustration = "list" }: EmptyStateProps) {
  return (
    <div className="card py-12 px-6 flex flex-col items-center text-center">
      <div className="mb-4">
        <Illustration type={illustration} />
      </div>
      <p
        className="text-[16px] font-medium mb-1"
        style={{ color: "var(--ink)" }}
      >
        {title}
      </p>
      <p
        className="text-[14px] max-w-sm"
        style={{ color: "var(--ink-muted)" }}
      >
        {description}
      </p>
      {action && (
        <Link
          href={action.href}
          className="btn btn-primary btn-sm mt-5"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
