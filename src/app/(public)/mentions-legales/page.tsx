"use client";

import { useState } from "react";
import { Shield, FileText, Lock, Gavel } from "lucide-react";

const sections = [
  { id: "kyc", label: "KYC & AML", icon: Shield },
  { id: "terms", label: "Conditions générales", icon: FileText },
  { id: "privacy", label: "Confidentialité", icon: Lock },
  { id: "auction", label: "Règles d'enchère", icon: Gavel },
];

export default function LegalPage() {
  const [activeSection, setActiveSection] = useState("kyc");

  return (
    <main className="py-24 min-h-screen" style={{ background: "var(--surface-base)" }}>
      <div className="container-app max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-[var(--ink)]">Mentions Légales</h1>
          <p className="text-[var(--ink-secondary)] mt-2">EnchèreDirect.com</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`p-4 rounded-xl text-center transition-colors ${
                  activeSection === s.id
                    ? "bg-[var(--accent)] text-white"
                    : "glass-surface text-[var(--ink-secondary)] hover:bg-[var(--surface-raised)]"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon size={24} />
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="glass-surface p-8">
          {activeSection === "kyc" && (
            <div>
              <h2 className="text-[var(--ink)] mb-6">
                Politique KYC et Lutte anti-blanchiment
              </h2>
              <div className="space-y-6 text-[var(--ink-secondary)]">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                    1. Obligation légale
                  </h3>
                  <p>
                    En vertu des réglementations nationales et internationales en matière
                    de lutte contre le blanchiment des capitaux (AML) et le financement
                    du terrorisme (CFT), EnchèreDirect est tenu de vérifier l'identité
                    de ses utilisateurs.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                    2. Réglementations applicables
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Loi N° 2018-06 relative à la lutte contre le blanchiment - Bénin</li>
                    <li>Loi N° 2014-1384 relative à la lutte contre le blanchiment - Côte d'Ivoire</li>
                    <li>Bank of Ghana Anti-Money Laundering Act</li>
                    <li>NDLEA Act - Money Laundering Prohibition - Nigeria</li>
                    <li>UEMOA Directive N° 01/2009/CM/UEMOA</li>
                    <li>FATF/GAFI Recommendations (Standards internationaux)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                    3. Vérifications effectuées
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Vérification de l'adresse email (anti-fraude)</li>
                    <li>Validation du document d'identité</li>
                    <li>Analyse du profil de risque</li>
                    <li>Vérification contre les listes de sanctions</li>
                    <li>Screening PEP (personnes politiquement exposées)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                    4. Documents acceptés
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Carte nationale d'identité (CNI)</li>
                    <li>Passeport valide</li>
                    <li>Permis de conduire</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                    5. Conservation des données
                  </h3>
                  <p>
                    Conformément à la réglementation, les données KYC sont conservées pendant une
                    durée minimale de 10 ans après la fin de la relation commerciale.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "terms" && (
            <div>
              <h2 className="text-[var(--ink)] mb-6">
                Conditions Générales d'Utilisation
              </h2>
              <div className="space-y-6 text-[var(--ink-secondary)]">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">1. Objet</h3>
                  <p>
                    Les présentes conditions définissent les règles d'utilisation de la
                    plateforme EnchèreDirect pour l'achat et la vente aux enchères.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">2. Inscription</h3>
                  <p>
                    Pour enchérir, l'utilisateur doit créer un compte et compléter le processus KYC.
                    Un dépôt de garantie peut être requis selon le lot.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">3. Enchères</h3>
                  <p>
                    Les offres sont irrévocables. En cas de gain, l'utilisateur s'engage
                    à payer le prix dans les délais impartis.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">4. Frais</h3>
                  <p>
                    Des frais de plateforme peuvent s'appliquer sur chaque transaction.
                    Des frais supplémentaires peuvent s'appliquer selon le mode de paiement.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">5. Litiges</h3>
                  <p>
                    En cas de litige, les parties s'engagent à recourir à la médiation
                    avant toute action judiciaire.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "privacy" && (
            <div>
              <h2 className="text-[var(--ink)] mb-6">
                Politique de Confidentialité
              </h2>
              <div className="space-y-6 text-[var(--ink-secondary)]">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">1. Collecte</h3>
                  <p>
                    Nous collectons les données nécessaires à la vérification d'identité
                    et aux transactions : nom, email, téléphone, document d'identité.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">2. Usage</h3>
                  <p>
                    Vos données sont utilisées pour : vérifier votre identité, traiter les paiements,
                    respecter nos obligations légales, améliorer nos services.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">3. Partage</h3>
                  <p>
                    Nous ne partageons pas vos données avec des tiers, sauf obligation
                    légale ou demande des autorités compétentes.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">4. Vos droits</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Droit d'accès à vos données</li>
                    <li>Droit de rectification</li>
                    <li>Droit à l'effacement</li>
                    <li>Droit à la portabilité</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === "auction" && (
            <div>
              <h2 className="text-[var(--ink)] mb-6">Règles des Enchères</h2>
              <div className="space-y-6 text-[var(--ink-secondary)]">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">1. Fonctionnement</h3>
                  <p>
                    Les enchères peuvent être prolongées automatiquement si une offre est faite dans les
                    dernières minutes (anti-sniping).
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">2. Offres</h3>
                  <p>
                    Chaque offre doit être supérieure à l'offre actuelle. Les offres
                    sont irrévocables une fois soumises.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">3. Paiement</h3>
                  <p>
                    En cas de gain, le paiement doit intervenir dans les délais impartis via
                    les moyens autorisés.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">4. Retrait</h3>
                  <p>
                    Le retrait du lot se fait sur présentation du borderereau de retrait et
                    après validation du paiement.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[var(--border)] text-sm text-[var(--ink-muted)]">
            <p>Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>
            <p>EnchèreDirect.com - Tous droits réservés</p>
          </div>
        </div>
      </div>
    </main>
  );
}
