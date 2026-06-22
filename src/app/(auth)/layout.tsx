import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--surface-base)" }}
    >
      <div className="mb-8">
        <Image
          src="/images/encheredirect_logo.png"
          alt="EnchèreDirect"
          width={40}
          height={40}
          className="h-10 w-auto opacity-100"
          style={{ opacity: 1 }}
        />
      </div>
      <div className="glass-surface w-full max-w-md p-8">{children}</div>
    </main>
  );
}
