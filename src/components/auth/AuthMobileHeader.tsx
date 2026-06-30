"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/providers/LanguageProvider";
import LanguageToggle from "@/components/ui/LanguageToggle";

export function AuthMobileHeader() {
  const pathname = usePathname();
  const t = useT();

  const isRegister = pathname.startsWith("/register");
  const subtitle = isRegister ? t("auth.createAccountSub") : t("auth.signIn");

  return (
    <div
      className="md:hidden relative overflow-hidden px-6 pt-14 pb-16 text-center"
      style={{
        background:
          "radial-gradient(120% 130% at 0% 0%, rgba(10,42,56,0.95) 0%, rgba(10,42,56,0) 52%), linear-gradient(to left, #1A5A7A 0%, #0F3C4D 55%, #0A2A38 100%)",
      }}
    >
      <div className="absolute top-4 right-4">
        <LanguageToggle variant="dark" />
      </div>

      <Link href="/" className="inline-flex flex-col items-center gap-3">
        <Image
          src="/images/encheredirect_logo.png"
          alt="EnchèreDirect"
          width={64}
          height={64}
          className="h-16 w-auto"
        />
        <span className="text-[24px] font-bold text-white">EnchèreDirect</span>
      </Link>
      <p className="mt-2 text-[14px]" style={{ color: "rgba(255,255,255,0.72)" }}>
        {subtitle}
      </p>
    </div>
  );
}
