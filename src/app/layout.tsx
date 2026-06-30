import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import LanguageProvider from "@/components/providers/LanguageProvider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EnchèreDirect — Maison d'enchères officielle CEDEAO",
  description:
    "Plateforme officielle de saisie-vente dans l'espace communautaire CEDEAO. Achetez et vendez en toute transparence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${poppins.variable} ${playfair.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
