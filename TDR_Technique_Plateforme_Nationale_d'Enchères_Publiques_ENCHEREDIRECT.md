

## WCC SARL
## TERMES DE RÉFÉRENCE TECHNIQUES
## (TDR)
Plateforme Nationale de Gestion des Saisies et Enchères
## Électroniques
## ENCHEREDIRECT.COM

Maître d'Ouvrage : Agence des Saisies et Enchères (AES)
Type de Projet : Sous-système Critique & Plateforme Nationale
Statut du Doc : Version Enrichie - Technique & Fonctionnelle
Date de Publication : Fév 2026




## 1. OBJET DU PROJET
Le présent cahier des charges a pour objet la conception, le développement, le déploiement et
la maintenance d'une plateforme numérique nationale hautement sécurisée permettant
d'automatiser et de centraliser tout le cycle de vie des biens saisis et des ventes publiques. La
solution vise à offrir les fonctionnalités majeures suivantes :
● Gestion des biens saisis : Enregistrement, traçabilité et suivi juridique des saisies.
● Gestion des inventaires : Valorisation, catégorisation et catalogage des lots.
● Publication des biens : Accessibilité et transparence de l'information auprès du grand
public.
● Organisation des enchères électroniques : Mécanismes d'offres classiques,
descendantes et scellées.
● Organisation des enchères vidéo en direct (Live Auction) : Retransmission temps réel
pour les commissaires-priseurs (sous-système critique).
● Gestion des adjudications : Attribution automatique et sécurisée des lots aux gagnants.
● Gestion des paiements sécurisés : Intégration financière forte incluant un compte
séquestre de pré-garantie.
● Traçabilité complète : Auditabilité de toutes les actions pour empêcher la fraude.
La plateforme devra être exploitée de manière collaborative par l'Agence des Saisies et
Enchères (AES), les commissaires-priseurs, les juridictions, les douanes, le trésor public ainsi
que les citoyens.
## 2. PRINCIPES DIRECTEURS
Pour assurer la légitimité et l'efficacité d'un tel dispositif d'État, l'architecture globale reposera
sur six piliers fondamentaux :
● Transparence : Toutes les opérations doivent être rigoureusement traçables sans
modification possible.
● Sécurité : Protection absolue des données personnelles, judiciaires et des transactions
financières.
● Disponibilité : Un taux de service disponible 24h/24, notamment durant les phases
critiques d'enchères.
● Scalabilité : Capacité modulaire et technique à supporter une extension sur plusieurs

pays ou régions.
● Interopérabilité : Communication fluide via APIs sécurisées avec les systèmes
gouvernementaux existants.
● Auditabilité : Conservation infalsifiable de toutes les preuves numériques et signatures.
## 3. ARCHITECTURE GÉNÉRALE
Afin de garantir l'évolutivité et l'indépendance des modules, le système adopte une architecture
microservices orientée événements, schématisée de la manière suivante :
## [ Portail Public ]    [ Portail Professionnel ]    [ Applications Mobiles ]
## |
API Gateway
## |
-----------------------------------------------------------------------------------------
|  IAM (Identity)  |  Saisies  |  Inventaire  |  Enchères (Live & Cl.)  |  Finance / SPI  |
-----------------------------------------------------------------------------------------
## |
## Event Bus / Kafka
## |
-----------------------------------------------------------------------------------------
|        Reporting        |     IA / Fraude     |     Archivage     |    Monitoring     |
-----------------------------------------------------------------------------------------

## 4. SPÉCIFICATIONS FONCTIONNELLES
## ET MODULES
4.1. Module de Gestion des Utilisateurs (IAM)
● Authentification forte : Combinaison Login/Mot de passe avec obligation d'un MFA
(OTP par SMS, OTP par Email) et intégration de l'authentification biométrique sur

mobiles.
● Profils d'utilisateurs gérés : Citoyen, Entreprise, Commissaire-priseur, Agent AES,
Magistrat, Douanier, Trésor Public, Administrateur système.
● Habilitations : Gestion fine via un modèle RBAC complet (Rôles, Privilèges,
Permissions, Délégations de droits).
4.2. Module de Gestion des Saisies
● Création des dossiers : Enregistrement de la référence judiciaire, juridiction
compétente, date de saisie, identité du propriétaire, créancier, huissier instrumentaire et
magistrat en charge.
● Gestion Électronique des Documents (GED) : Centralisation sécurisée des PV de
saisie, jugements, ordonnances et expertises aux formats PDF, DOCX, images et vidéos.
4.3. Module Inventaire des Biens
● Fiche Bien exhaustive : Catégorie, sous-catégorie, description textuelle complète,
valeur estimée, localisation physique et état général.
● Ressources Médias HD : Intégration obligatoire de photos HD, vidéos HD, captures à
360° et visites virtuelles pour les biens immobiliers ou industriels.
● Identification physique : Génération automatique de QR Codes, codes-barres et
support des puces RFID en option.
4.4. Module d'Expertise
● Suivi des experts : Affectation des dossiers aux experts agréés, système de notation et
flux de validation des rapports.
● Estimation financière : Mode d'estimation manuelle couplé à un outil d'estimation
assistée par Intelligence Artificielle basé sur l'historique du marché.
## 4.5. Module Catalogue National
● Consultation Publique : Moteur de recherche multicritère (catégorie, région, prix, date
d'enchère, mots-clés).
● Modes d'affichage : Vue en galerie d'images, vue en liste détaillée et cartographie
géographique interactive des lots.

4.6. Module Enchères Électroniques (Classiques)
● Types d'enchères supportés : Enchère ascendante (montant croissant), descendante
(au cadran/prix dégressif), scellée (offres cachées) et vente directe à prix fixe.
● Surenchère automatique : Paramétrage par l'utilisateur d'un plafond maximal et d'un
incrément automatique.
● Anti-sniping : Prolongation automatique de la durée de l'enchère si une offre est
déposée dans les dernières secondes de la vente.
● Historique d'audit : Traçabilité nominative de chaque offre avec enregistrement de
l'utilisateur, de la date exacte, de l'adresse IP et du montant engagé.
## 5. SOUS-SYSTÈMES CRITIQUES
5.1. Module d'Enchères Vidéo en Temps Réel (Live
## Auction)
Ce module constitue le coeur applicatif de la plateforme nationale pour les ventes en direct.
● Objectif : Permettre aux commissaires-priseurs de diriger des ventes publiques
physiques ou virtuelles retransmises en direct vidéo haute définition.
● Technologies requises : Protocoles WebRTC, serveurs SFU (Selective Forwarding
Unit), streaming adaptatif (ABR) et routage via un CDN (Content Delivery Network).
● Salle Virtuelle à Haute Charge : Capacité d'accueil simultané allant de 10 000 à 100 000
participants par vente.
● Outils de Présentation : Flux vidéo du commissaire-priseur, partage d'écran, affichage
dynamique des photos et des pièces du dossier de vente.
● Interface Enchérisseur Temps Réel : Synchronisation parfaite (< 500 ms de latence)
affichant le montant actuel, la meilleure offre, le compte à rebours et le nombre
d'enchérisseurs en ligne.
● Chat Intégré Modéré : Canal d'échange pour les questions et annonces officielles,
modéré en temps réel par les agents AES.
● Archivage & Replay : Enregistrement légal obligatoire du flux vidéo, audio et du journal
complet des offres, disponible pour consultation ultérieure.

5.2. Module Compte Séquestre et Garantie Financière
Dispositif impératif pour éradiquer les enchères fantaisistes et les comportements malveillants.
● Intégration SPI BCEAO : Connexion directe et bidirectionnelle avec le Système de
Paiement Instantané (SPI-UEMOA) de la Banque Centrale.
● Portefeuille Virtuel : Chaque compte participant dispose d'un portefeuille dédié avec
mécanisme de blocage des fonds.
● Dépôt de Garantie Obligatoire : Avant d'avoir le droit de porter une enchère, l'utilisateur
doit consigner une caution minimale ou un pourcentage défini de la valeur estimée du lot.

Exemple concret : Pour un lot évalué à 10 000 000 FCFA avec une garantie exigée de 10
%, le système procède au blocage de 1 000 000 FCFA.
● Validation et Blocage : Le système rejette automatiquement toute offre si le Solde
disponible < Garantie requise. Les fonds correspondants deviennent indisponibles pour
toute autre transaction pendant la durée de l'enchère.
## ● Déblocage Automatique :
○ En cas de perte : Libération et restitution immédiate de la provision sur le compte
de l'enchérisseur.
○ En cas de gain (Adjudicataire) : Transformation de la garantie en acompte,
complétée ensuite pour le règlement final.
● Sécurité anti-fraude : Algorithmes avancés de détection des pratiques de collusion,
multi-comptes ou manipulation de cours.
## 6. MODULES TRANSVERSAUX ET
## INTELLIGENCE
6.1. Paiement, Recouvrement et Adjudication
● Canaux de paiement : Prise en charge du SPI BCEAO, des réseaux bancaires
traditionnels, du Mobile Money et des virements standards.
● Réconciliation : Lettrage et réconciliation comptable 100% automatisés.
● Documents légaux automatisés : Génération automatique des Procès-verbaux
d'adjudication, certificats officiels et bordereaux de retrait des lots, validés par signature

électronique qualifiée (AES et Commissaire-priseur).
6.2. Traçabilité, Audit et Module IA
● Journalisation : Enregistrement immuable (Log) de chaque connexion, consultation,
enchère, paiement et acte d'adjudication avec horodatage qualifié et conservation
minimale de 10 ans.
● Détection IA de la fraude : Analyse comportementale pour intercepter les enchères
artificielles, les comptes liés et les comportements d'utilisateurs suspects.
● Analyse prédictive : Calcul de la valeur probable finale d'un lot, évaluation du risque de
défaut et prédiction du taux de participation.
6.3. Module Statistique et Décisionnel
Mise à disposition de tableaux de bord adaptés selon les prérogatives des acteurs :
● AES : Volume de saisies, indicateurs de valeur totale, statistiques des ventes clôturées.
● Ministère : Total des recettes générées, taux d'écoulement des stocks de biens saisis,
délais moyens de traitement.
● Gouvernement : Consolidation des statistiques nationales avec outils d'exportation de
données aux formats Excel et PDF.
## 7. EXIGENCES DE PERFORMANCE
## TECHNIQUES
Pour assurer un service de niveau gouvernemental, le prestataire devra respecter strictement la
matrice d'engagements de performance suivante :
Paramètre Technique Exigence Requise (SLA)

Disponibilité globale de la plateforme 99,95 %

Paramètre Technique Exigence Requise (SLA)

Temps de réponse de l'API Gateway < 2 secondes
Latence de synchronisation (Enchère Live) < 500 ms
Nombre d'utilisateurs simultanés sur le
système
## 100 000
Nombre d'enchères simultanées actives 1 000
Sessions de flux vidéos simultanées 100
Capacité de traitement des transactions
financières
5 000 / minute
## 8. CYBERSÉCURITÉ &
## RECONNAISSANCE DES NORMES
La sensibilité des données judiciaires et financières impose l'alignement strict de la solution sur
les standards de cybersécurité internationaux :
● Normes et Cadres : ISO 27001 (Gestion de la sécurité de l'information), ISO 27701
(Protection de la vie privée), OWASP (Sécurité des applications Web et Mobiles),
PCI-DSS (Sécurité des transactions par cartes et paiements).
● Mécanismes de Défense Opérationnels : Cryptographie forte avec chiffrement des
données au repos via AES-256 et des flux en transit via TLS 1.3. Déploiement d'un
Pare-feu Applicatif (WAF), de systèmes de détection et de prévention des intrusions
(IDS/IPS) et centralisation des logs au sein d'un SIEM managé.

## 9. LIVRABLES TECHNIQUES ATTENDUS
Le prestataire retenu devra impérativement fournir la documentation et les composants logiciels
suivants :
- Dossier d'architecture technique détaillée.
- Dossier complet d'analyse fonctionnelle.
- Cartographie et modélisation BPMN des processus métiers de l'AES.
- Maquettes UX/UI haute fidélité pour l'ensemble des écrans.
- Code source complet du Développement Web et des applications natives Android et iOS.
- APIs REST documentées selon la spécification OpenAPI.
- Manuels d'administration, guides utilisateurs et manuels d'exploitation.
- Plan de Reprise d'Activité (PRA) et Plan de Continuité d'Activité (PCA).
- Rapports certifiés des tests de montée en charge et d'audits de sécurité intrusifs.