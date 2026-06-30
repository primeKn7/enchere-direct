// Thème clair forcé pour toute l'app : pas besoin de next-themes
// (qui injectait un <script> no-flash provoquant un warning React).
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
