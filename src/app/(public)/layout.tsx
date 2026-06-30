import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { MobileBottomNav } from "@/components/marketing/MobileBottomNav";

export const metadata: Metadata = {
  title: "EnchèreDirect — Maison d'enchères officielle CEDEAO",
  description:
    "Plateforme officielle de vente sur saisie dans l'espace CEDEAO. Transparence, légitimité, sécurité.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
