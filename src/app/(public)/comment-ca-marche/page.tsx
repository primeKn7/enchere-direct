import Link from "next/link";
import { Gavel, UserCircle, Wallet, Truck, CheckCircle, ArrowRight } from "lucide-react";

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

const benefits = [
  { title: "Paiements sécurisés", description: "Transactions traçables et sécurisées" },
  { title: "Vendeurs vérifiés", description: "Tous les vendeurs sont authentifiés" },
  { title: "Livraison encadrée", description: "Retrait des lots sous contrôle administratif" },
  { title: "Support 24/7", description: "Assistance disponible en permanence" },
];

export default function HowItWorksPage() {
  return (
    <main className="py-24 min-h-screen" style={{ background: "var(--surface-base)" }}>
      <div className="container-app">
        <div className="text-center mb-14">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent)" }}
          >
            <Gavel size={32} className="text-white" />
          </div>
          <h1 className="text-[var(--ink)] mb-4">Comment ça marche</h1>
          <p className="text-xl text-[var(--ink-secondary)]">
            4 étapes simples pour acheter ou vendre
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="glass-surface p-6 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "var(--accent-muted)" }}
                >
                  <Icon size={28} className="text-[var(--accent)]" />
                </div>
                <div className="text-xs font-semibold text-[var(--ink-muted)] mb-2">
                  Étape {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--ink-secondary)]">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="glass-surface p-10 mb-16">
          <h2 className="text-[var(--ink)] text-center mb-10">
            Pourquoi choisir EnchèreDirect ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <CheckCircle
                  size={40}
                  className="text-[var(--success)] mx-auto mb-3"
                />
                <h3 className="text-base font-semibold text-[var(--ink)] mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-[var(--ink-secondary)]">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-[var(--ink)] mb-6">Prêt à commencer ?</h2>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="btn btn-gold btn-lg">
              Inscription
            </Link>
            <Link href="/catalogue" className="btn btn-secondary btn-lg">
              Catalogue
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
