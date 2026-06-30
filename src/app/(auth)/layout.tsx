import Image from "next/image";
import Link from "next/link";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { AuthMobileHeader } from "@/components/auth/AuthMobileHeader";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--surface-base)" }}
    >
      {/* Mobile gradient header */}
      <AuthMobileHeader />

      {/* Top bar (desktop) */}
      <div
        className="h-14 hidden md:flex items-center justify-between px-6 border-b"
        style={{ background: "#ffffff", borderColor: "var(--border)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/encheredirect_logo.png"
            alt="EnchèreDirect"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
          <span className="text-[15px] font-bold" style={{ color: "var(--teal-deep)" }}>
            EnchèreDirect
          </span>
        </Link>
        <LanguageToggle />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start md:items-center justify-center px-4 pt-5 pb-10 md:py-10">
        <div className="w-full max-w-lg -mt-[17px] md:mt-0 relative z-10">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div
        className="py-4 text-center text-[12px]"
        style={{ color: "var(--ink-muted)", borderTop: "1px solid var(--border)" }}
      >
        <Link href="/mentions-legales" className="hover:underline" style={{ color: "var(--ink-muted)" }}>
          Mentions légales
        </Link>
        {" · "}
        <Link href="/comment-ca-marche" className="hover:underline" style={{ color: "var(--ink-muted)" }}>
          Comment ça marche
        </Link>
      </div>
    </main>
  );
}
