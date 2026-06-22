"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[14px] transition-colors cursor-pointer"
      style={{ color: "var(--ink-muted)", background: "transparent" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-sunken)";
        e.currentTarget.style.color = "var(--danger)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--ink-muted)";
      }}
      type="button"
    >
      <LogOut size={14} />
      Déconnexion
    </button>
  );
}
