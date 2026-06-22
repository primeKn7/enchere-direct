import type { Metadata } from "next";
import "../globals.css";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "EnchèreDirect.com - Plateforme nationale des saisies et enchères",
  description:
    "Plateforme nationale de gestion des saisies judiciaires et des enchères électroniques de l'Agence des Saisies et Enchères (AES) du Bénin.",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="marketing min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
