import { Hero } from "@/components/marketing/Hero";
import { AuctionCard } from "@/components/marketing/AuctionCard";
import { getActiveAuctions } from "@/lib/demo-data";
import Link from "next/link";
import { Gavel, UserCircle, Wallet, Truck, ArrowRight } from "lucide-react";

export default function HomePage() {
  const activeAuctions = getActiveAuctions(6);

  const steps = [
    {
      icon: UserCircle,
      title: "Créez un compte",
      description: "Inscrivez-vous gratuitement et complétez la vérification d'identité",
    },
    {
      icon: Wallet,
      title: "Déposez des fonds",
      description: "Créditez votre compte pour enchérir",
    },
    {
      icon: Gavel,
      title: "Enchérissez & Gagnez",
      description: "Participez aux ventes en direct et gagnez des objets",
    },
    {
      icon: Truck,
      title: "Payez & Recevez",
      description: "Payez votre objet et recevez-le",
    },
  ];

  return (
    <>
      <Hero />

      <section className="py-20" style={{ background: "var(--surface-base)" }}>
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-[var(--ink)] mb-3">Dernières ventes</h2>
            <p className="text-[var(--ink-secondary)] text-lg">
              Les objets les plus récents mis en vente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/catalogue" className="btn btn-primary btn-lg">
              Voir tout
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20" style={{ background: "var(--surface-sunken)" }}>
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-[var(--ink)] mb-3">Comment ça marche</h2>
            <p className="text-[var(--ink-secondary)] text-lg">
              4 étapes simples pour acheter ou vendre
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="glass-surface p-6 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "var(--accent-muted)" }}
                  >
                    <Icon size={28} className="text-[var(--accent)]" />
                  </div>
                  <div
                    className="text-xs font-semibold mb-2"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    Étape {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--ink-secondary)]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20" style={{ background: "var(--accent)" }}>
        <div className="container-app text-center">
          <h2 className="text-white mb-4">Prêt à commencer ?</h2>
          <p className="text-xl text-white/80 mb-8">
            Rejoignez des milliers d'acheteurs dans la sous-région
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="btn btn-gold btn-lg">
              Créer un compte
            </Link>
            <Link
              href="/catalogue"
              className="btn btn-ghost btn-lg"
              style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}
            >
              Parcourir les ventes
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
