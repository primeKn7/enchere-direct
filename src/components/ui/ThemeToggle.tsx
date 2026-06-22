"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
        style={{ background: "var(--surface-sunken)" }}
        aria-label="Changer le thème"
      >
        <Moon size={14} style={{ color: "var(--ink-muted)" }} />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center transition-colors"
      style={{ background: "var(--surface-sunken)" }}
      aria-label={isDark ? "Passer au mode clair" : "Passer au mode sombre"}
    >
      {isDark ? (
        <Sun size={14} style={{ color: "var(--ink-muted)" }} />
      ) : (
        <Moon size={14} style={{ color: "var(--ink-muted)" }} />
      )}
    </button>
  );
}
