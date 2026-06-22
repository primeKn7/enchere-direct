# EnchèreDirect.com — Description des Diagrammes UML

> **Document** : Diagrammes UML — Cas d'utilisation, Classes, Séquence & Activité  
> **Projet** : Plateforme Nationale de Gestion des Saisies et Enchères Électroniques (EnchèreDirect.com)  
> **Source** : Termes de Référence Techniques (TDR) — Février 2026  
> **Auteur** : WCC SARL  

---

## Table des matières

- [Introduction](#introduction)
- [Partie 1 — Diagrammes de Cas d'Utilisation](#partie-1--diagrammes-de-cas-dutilisation)
  - [Figure 1 : IAM & Gestion des Saisies](#figure-1--cas-dutilisation--iam--gestion-des-saisies)
  - [Figure 2 : Inventaire & Catalogue](#figure-2--cas-dutilisation--inventaire--catalogue)
  - [Figure 3 : Enchères Électroniques](#figure-3--cas-dutilisation--enchères-électroniques)
  - [Figure 4 : Enchère Vidéo en Direct](#figure-4--cas-dutilisation--enchère-vidéo-en-direct)
  - [Figure 5 : Paiement & Garantie](#figure-5--cas-dutilisation--paiement--garantie)
  - [Figure 6 : Adjudication & Traçabilité](#figure-6--cas-dutilisation--adjudication--traçabilité)
- [Partie 2 — Diagrammes de Classes](#partie-2--diagrammes-de-classes)
  - [Figure 7 : Gestion des Utilisateurs (IAM)](#figure-7--diagramme-de-classes--gestion-des-utilisateurs-iam)
  - [Figure 8 : Saisies & Inventaire](#figure-8--diagramme-de-classes--saisies--inventaire)
  - [Figure 9 : Enchères & Live Auction](#figure-9--diagramme-de-classes--enchères--live-auction)
  - [Figure 10 : Paiement & Garantie](#figure-10--diagramme-de-classes--paiement--garantie)
  - [Figure 11 : Adjudication & Traçabilité](#figure-11--diagramme-de-classes--adjudication--traçabilité)
- [Partie 3 — Diagrammes de Séquence](#partie-3--diagrammes-de-séquence)
  - [Figure 12 : Authentification Multi-Facteurs](#figure-12--diagramme-de-séquence--authentification-multi-facteurs)
  - [Figure 13 : Dépôt d'une Offre avec Garantie](#figure-13--diagramme-de-séquence--dépôt-dune-offre-avec-garantie)
  - [Figure 14 : Adjudication et Paiement Final](#figure-14--diagramme-de-séquence--adjudication-et-paiement-final)
- [Partie 4 — Diagrammes d'Activité](#partie-4--diagrammes-dactivité)
  - [Figure 15 : Cycle de Vie d'une Saisie (Partie A)](#figure-15--diagramme-dactivité--cycle-de-vie-dune-saisie-partie-a)
  - [Figure 16 : Cycle de Vie d'une Saisie (Partie B)](#figure-16--diagramme-dactivité--cycle-de-vie-dune-saisie-partie-b)
  - [Figure 17 : Cycle de Vie d'une Enchère (Partie A)](#figure-17--diagramme-dactivité--cycle-de-vie-dune-enchère-partie-a)
  - [Figure 18 : Cycle de Vie d'une Enchère (Partie B)](#figure-18--diagramme-dactivité--cycle-de-vie-dune-enchère-partie-b)

---

## Introduction

Ce document présente la modélisation UML de la plateforme **EnchèreDirect.com** sous quatre angles complémentaires :

1. **Diagrammes de cas d'utilisation** — Décrivent les interactions entre les acteurs et le système.
2. **Diagrammes de classes** — Modélisent la structure des données et des objets métier.
3. **Diagrammes de séquence** — Détaillent la chronologie des échanges pour des scénarios clés.
4. **Diagrammes d'activité** — Décrivent le flux de travail des processus métier centraux.

Compte tenu du nombre élevé d'acteurs (**8**) et de cas d'utilisation (**28**) identifiés dans les Termes de Référence Techniques, chaque ensemble de diagrammes est découpé par domaine fonctionnel afin de préserver la lisibilité :

- **IAM & Saisies**
- **Inventaire & Catalogue**
- **Enchères Électroniques**
- **Enchère Vidéo en Direct**
- **Paiement & Garantie**
- **Adjudication & Traçabilité**

Pour les diagrammes de séquence, **trois scénarios représentatifs** ont été retenus :
- L'authentification multi-facteurs.
- Le dépôt d'une offre avec garantie financière.
- Le processus d'adjudication suivi du paiement final.

Pour les diagrammes d'activité, **deux processus métier centraux** sont détaillés :
- Le cycle de vie d'une saisie.
- Le cycle de vie d'une enchère.

---

## Partie 1 — Diagrammes de Cas d'Utilisation

---

### Figure 1 — Cas d'utilisation : IAM & Gestion des Saisies

**Domaine fonctionnel** : Gestion des Utilisateurs (IAM) & Gestion des Saisies

**Description** :  
Ce diagramme couvre l'**authentification multi-facteurs** et la **gestion des habilitations RBAC** (Role-Based Access Control), ainsi que la **création des dossiers de saisie judiciaire** et la **centralisation des documents associés** (GED — Gestion Électronique de Documents).

**Acteurs concernés** :
- Citoyen
- Entreprise
- Agent AES
- Magistrat
- Douanier

**Cas d'utilisation principaux** :
- Authentification MFA (Multi-Factor Authentication)
- Gestion des rôles et permissions (RBAC)
- Création de dossiers de saisie
- Centralisation et archivage documentaire (GED)

**Relations entre cas d'utilisation** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| `<<include>>` | Créer dossier de saisie | Authentification MFA | Toute création de dossier requiert une authentification préalable |
| `<<include>>` | Gérer habilitations RBAC | Authentification MFA | La gestion des droits nécessite une authentification renforcée |
| `<<include>>` | Centraliser documents GED | Authentification MFA | L'accès au GED est sécurisé par MFA |
| `<<extend>>` | Gérer habilitations RBAC | Créer dossier de saisie | La création de dossier peut déclencher une mise à jour des rôles |

**Relations entre acteurs** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| Généralisation | Citoyen | Utilisateur | Le Citoyen est un type d'utilisateur de la plateforme |
| Généralisation | Entreprise | Utilisateur | L'Entreprise est un type d'utilisateur de la plateforme |
| Généralisation | Agent AES | Agent Public | L'Agent AES est un agent de l'administration |
| Généralisation | Magistrat | Agent Public | Le Magistrat est un agent de l'administration |
| Généralisation | Douanier | Agent Public | Le Douanier est un agent de l'administration |

---

### Figure 2 — Cas d'utilisation : Inventaire & Catalogue

**Domaine fonctionnel** : Inventaire des Biens & Catalogue National

**Description** :  
Ce diagramme modélise la **création des fiches biens**, l'**intégration de médias haute définition**, la **génération de codes d'identification physique** (QR Code, RFID), l'**affectation d'experts**, ainsi que la **consultation publique du catalogue national**. L'estimation de la valeur d'un bien peut être assistée par le module d'**Intelligence Artificielle**.

**Acteurs concernés** :
- Agent AES
- Expert
- Citoyen / Enchérisseur (consultation publique)
- Système d'IA (EstimationIA)

**Cas d'utilisation principaux** :
- Création et enrichissement de fiches biens
- Upload de médias HD
- Génération d'identifiants physiques (QR Code, RFID)
- Affectation d'experts et rédaction de rapports d'expertise
- Estimation automatique par IA
- Consultation publique du catalogue

**Relations entre cas d'utilisation** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| `<<include>>` | Créer fiche bien | Upload médias HD | Toute fiche bien inclut obligatoirement des médias |
| `<<include>>` | Créer fiche bien | Générer identifiants physiques | QR Code / RFID obligatoires pour l'identification physique |
| `<<extend>>` | Affecter expert | Créer fiche bien | L'expertise optionnelle enrichit la fiche |
| `<<extend>>` | Estimer par IA | Créer fiche bien | L'estimation IA est une extension optionnelle de la fiche |
| `<<include>>` | Consultation publique | Authentification MFA | L'accès au catalogue public requiert une authentification légère |

**Relations entre acteurs** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| Généralisation | Enchérisseur | Citoyen | Le Citoyen est un enchérisseur potentiel |
| Généralisation | Enchérisseur | Entreprise | L'Entreprise est un enchérisseur potentiel |

### Figure 3 — Cas d'utilisation : Enchères Électroniques

**Domaine fonctionnel** : Enchères Électroniques (Classiques)

**Description** :  
Ce diagramme modélise le **mécanisme central des enchères en ligne** : lancement par le commissaire-priseur, dépôt d'offres par les enchérisseurs, paramétrage de la **surenchère automatique**, prolongation **anti-sniping**, et consignation obligatoire d'un **dépôt de garantie** avant toute participation.

**Acteurs concernés** :
- Commissaire-Priseur
- Citoyen / Enchérisseur
- Entreprise / Enchérisseur
- Système (gestion anti-sniping, surenchère automatique)

**Cas d'utilisation principaux** :
- Lancement d'une enchère par le commissaire-priseur
- Dépôt d'offres par les enchérisseurs
- Configuration de la surenchère automatique
- Gestion de la prolongation anti-sniping
- Consignation du dépôt de garantie

**Relations entre cas d'utilisation** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| `<<include>>` | Lancer enchère | Authentification MFA | Le commissaire-priseur doit être authentifié |
| `<<include>>` | Dépôt d'offres | Consignation garantie | Aucune offre acceptée sans garantie financière bloquée |
| `<<include>>` | Configuration surenchère auto | Dépôt d'offres | La surenchère s'appuie sur une offre initiale |
| `<<extend>>` | Gestion anti-sniping | Dépôt d'offres | Prolongation déclenchée par une offre en fin de compte à rebours |
| `<<include>>` | Dépôt d'offres | Authentification MFA | L'enchérisseur doit être authentifié |

**Relations entre acteurs** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| Généralisation | Enchérisseur | Citoyen | Le Citoyen est un enchérisseur |
| Généralisation | Enchérisseur | Entreprise | L'Entreprise est un enchérisseur |
| Généralisation | Utilisateur | Commissaire-Priseur | Le CP est un utilisateur authentifié |

---

### Figure 4 — Cas d'utilisation : Enchère Vidéo en Direct

**Domaine fonctionnel** : Enchère Vidéo en Direct (Live Auction)

**Description** :  
Sous-système critique permettant aux **commissaires-priseurs** de diriger des **ventes retransmises en vidéo HD**, avec **salle virtuelle à haute capacité**, **chat modéré par les agents AES**, et **archivage légal** du flux pour consultation ultérieure (replay).

**Acteurs concernés** :
- Commissaire-Priseur (animateur de la vente)
- Citoyen / Enchérisseur (spectateur/participant)
- Entreprise / Enchérisseur
- Agent AES (modération du chat)

**Cas d'utilisation principaux** :
- Diffusion vidéo HD en direct
- Participation à la salle virtuelle
- Déposer des offres en direct
- Modération du chat par les agents AES
- Archivage légal du flux vidéo (replay)

**Relations entre cas d'utilisation** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| `<<include>>` | Déposer offres en direct | Consignation garantie | Même en direct, une garantie est requise |
| `<<include>>` | Déposer offres en direct | Authentification MFA | Authentification obligatoire pour participer |
| `<<include>>` | Modération chat | Diffusion vidéo HD | La modération est liée à la session live |
| `<<extend>>` | Archivage légal | Diffusion vidéo HD | L'archivage est déclenché après la fin du live |
| `<<include>>` | Participation salle virtuelle | Authentification MFA | Spectateur ou participant doit être authentifié |

**Relations entre acteurs** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| Généralisation | Enchérisseur | Citoyen | Le Citoyen est un participant potentiel |
| Généralisation | Enchérisseur | Entreprise | L'Entreprise est un participant potentiel |
| Généralisation | Agent Public | Agent AES | L'Agent AES est un agent public de modération |

### Figure 5 — Cas d'utilisation : Paiement & Garantie

**Domaine fonctionnel** : Paiement & Garantie Financière

**Description** :  
Ce diagramme couvre la **consignation du dépôt de garantie**, le **blocage et déblocage des fonds**, le **paiement des lots adjugés** et la **réconciliation comptable**, en intégration directe avec le **Système de Paiement Instantané (SPI BCEAO)**.

**Acteurs concernés** :
- Enchérisseur (Citoyen / Entreprise)
- Trésor Public
- Système bancaire / SPI BCEAO
- Administrateur Système (réconciliation)

**Cas d'utilisation principaux** :
- Consignation du dépôt de garantie
- Blocage des fonds sur le portefeuille virtuel
- Déblocage des fonds (perdants ou gagnant après paiement final)
- Paiement des lots adjugés
- Réconciliation comptable avec le SPI BCEAO

**Relations entre cas d'utilisation** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| `<<include>>` | Consignation garantie | Blocage fonds | La consignation implique obligatoirement le blocage sur le portefeuille |
| `<<include>>` | Paiement lots adjugés | Déblocage fonds | Le paiement final libère la garantie et débloque les fonds |
| `<<include>>` | Réconciliation comptable | Blocage fonds | La réconciliation vérifie les transactions bloquées/débloquées |
| `<<extend>>` | Déblocage fonds | Paiement lots adjugés | Le déblocage des perdants suit l'adjudication |
| `<<include>>` | Réconciliation comptable | Authentification MFA | L'administrateur doit être authentifié |

**Relations entre acteurs** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| Généralisation | Enchérisseur | Citoyen | Le Citoyen est un payeur potentiel |
| Généralisation | Enchérisseur | Entreprise | L'Entreprise est un payeur potentiel |
| Généralisation | Agent Public | Trésor Public | Le Trésor Public est un agent public financier |

---

### Figure 6 — Cas d'utilisation : Adjudication & Traçabilité

**Domaine fonctionnel** : Adjudication, Traçabilité & Statistiques

**Description** :  
Ce dernier diagramme regroupe l'**attribution des lots aux gagnants** et la **génération automatique des procès-verbaux d'adjudication** signés électroniquement, ainsi que la **consultation des journaux d'audit**, la **détection de fraude assistée par IA**, et les **tableaux de bord décisionnels**.

**Acteurs concernés** :
- Commissaire-Priseur
- Magistrat
- Administrateur Système
- Agent AES (audit)

**Cas d'utilisation principaux** :
- Attribution des lots aux gagnants
- Génération et signature électronique des procès-verbaux
- Consultation des journaux d'audit
- Détection de fraude (module IA)
- Consultation des tableaux de bord décisionnels

**Relations entre cas d'utilisation** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| `<<include>>` | Attribution lots | Génération PV | L'attribution génère automatiquement le procès-verbal |
| `<<include>>` | Génération PV | Signature électronique | Le PV doit être signé pour valeur légale |
| `<<extend>>` | Détection fraude IA | Consultation journaux audit | L'IA analyse les journaux pour détecter les anomalies |
| `<<include>>` | Consultation tableaux de bord | Authentification MFA | L'accès aux dashboards est sécurisé |
| `<<extend>>` | Attribution lots | Déblocage fonds | L'attribution déclenche le déblocage des fonds des perdants |

**Relations entre acteurs** :

| Relation | Source | Cible | Description |
|----------|--------|-------|-------------|
| Généralisation | Agent Public | Commissaire-Priseur | Le CP est un officier ministériel |
| Généralisation | Agent Public | Magistrat | Le Magistrat est un agent de l'autorité judiciaire |
| Généralisation | Agent Public | Agent AES | L'Agent AES est un agent administratif |

---

## Partie 2 — Diagrammes de Classes

### Figure 7 — Diagramme de classes : Gestion des Utilisateurs (IAM)

**Domaine fonctionnel** : Gestion des Utilisateurs & Authentification

**Description** :  
La classe abstraite **`Utilisateur`** centralise l'**authentification** et les **attributs communs** à tous les profils. Chaque profil métier en hérite :

- Citoyen
- Entreprise
- Commissaire-Priseur
- Agent AES
- Magistrat
- Douanier
- Trésor Public
- Administrateur Système

Le **modèle RBAC** est représenté par les classes **`Role`** et **`Permission`**. Chaque utilisateur dispose d'un **`Portefeuille Virtuel`** pour la gestion financière.

**Classes principales** :
- `Utilisateur` (classe abstraite)
- `Citoyen`, `Entreprise`, `CommissairePriseur`, `AgentAES`, `Magistrat`, `Douanier`, `TresorPublic`, `AdministrateurSysteme`
- `Role`
- `Permission`
- `PortefeuilleVirtuel`

**Relations entre classes** :

| Relation | Source | Cardinalité | Cible | Cardinalité | Description |
|----------|--------|-------------|-------|-------------|-------------|
| Héritage | `Citoyen` | — | `Utilisateur` | — | Spécialisation de l'utilisateur citoyen |
| Héritage | `Entreprise` | — | `Utilisateur` | — | Spécialisation de l'utilisateur entreprise |
| Héritage | `CommissairePriseur` | — | `Utilisateur` | — | Spécialisation de l'utilisateur CP |
| Héritage | `AgentAES` | — | `Utilisateur` | — | Spécialisation de l'utilisateur agent |
| Héritage | `Magistrat` | — | `Utilisateur` | — | Spécialisation de l'utilisateur magistrat |
| Héritage | `Douanier` | — | `Utilisateur` | — | Spécialisation de l'utilisateur douanier |
| Héritage | `TresorPublic` | — | `Utilisateur` | — | Spécialisation de l'utilisateur trésor |
| Héritage | `AdministrateurSysteme` | — | `Utilisateur` | — | Spécialisation de l'utilisateur admin |
| Association | `Utilisateur` | 1 | `PortefeuilleVirtuel` | 1 | Un utilisateur possède exactement un portefeuille |
| Association | `Utilisateur` | * | `Role` | * | Un utilisateur a plusieurs rôles ; un rôle peut être partagé (N-N) |
| Association | `Role` | * | `Permission` | * | Un rôle regroupe plusieurs permissions ; une permission peut appartenir à plusieurs rôles (N-N) |

---

### Figure 8 — Diagramme de classes : Saisies & Inventaire

**Domaine fonctionnel** : Saisies Judiciaires & Inventaire des Biens

**Description** :  
Le **`DossierSaisie`** centralise les **documents légaux** (GED) et référence un ou plusieurs **`BienSaisi`**. Chaque bien peut être :
- Enrichi de **médias HD** (photos, vidéos)
- Évalué par un **Expert** via un **`RapportExpertise`**
- Estimé automatiquement par le module **`EstimationIA`**

Après expertise et estimation, le bien devient un **`Lot`** publiable dans le catalogue national.

**Classes principales** :
- `DossierSaisie`
- `BienSaisi`
- `MediaHD`
- `Expert`
- `RapportExpertise`
- `EstimationIA`
- `Lot`

**Relations entre classes** :

| Relation | Source | Cardinalité | Cible | Cardinalité | Description |
|----------|--------|-------------|-------|-------------|-------------|
| Composition | `DossierSaisie` | 1 | `BienSaisi` | 1..* | Un dossier de saisie regroupe un ou plusieurs biens saisis |
| Association | `BienSaisi` | 1 | `MediaHD` | 0..* | Un bien peut être enrichi de zéro à plusieurs médias HD |
| Association | `BienSaisi` | 1 | `RapportExpertise` | 0..1 | Un bien peut avoir au maximum un rapport d'expertise |
| Association | `Expert` | 1 | `RapportExpertise` | 0..* | Un expert peut rédiger plusieurs rapports d'expertise |
| Association | `BienSaisi` | 1 | `EstimationIA` | 0..1 | Un bien peut avoir une estimation IA optionnelle |
| Association | `BienSaisi` | 1 | `Lot` | 0..1 | Un bien saisi devient un lot publiable (transformation) |

---

### Figure 9 — Diagramme de classes : Enchères & Live Auction

**Domaine fonctionnel** : Enchères Électroniques & Enchère Vidéo en Direct

**Description** :  
Un **`Lot`** fait l'objet d'une **`Enchère`** qui reçoit plusieurs **`Offre`** déposées par les utilisateurs, avec possibilité de **`SurenchereAutomatique`**. Une enchère peut être retransmise via une **`VenteLive`**, qui intègre un **`ChatModere`** et génère une **`Archive`** du flux et du journal des offres.

**Classes principales** :
- `Lot`
- `Enchere`
- `Offre`
- `SurenchereAutomatique`
- `VenteLive`
- `ChatModere`
- `Archive`

**Relations entre classes** :

| Relation | Source | Cardinalité | Cible | Cardinalité | Description |
|----------|--------|-------------|-------|-------------|-------------|
| Association | `Lot` | 1 | `Enchere` | 1 | Un lot donne lieu à exactement une enchère |
| Association | `Enchere` | 1 | `Offre` | 0..* | Une enchère reçoit zéro à plusieurs offres |
| Association | `Offre` | 1 | `SurenchereAutomatique` | 0..1 | Une offre peut activer une surenchère automatique (optionnelle) |
| Association | `Enchere` | 1 | `VenteLive` | 0..1 | Une enchère peut être retransmise en direct (optionnel) |
| Composition | `VenteLive` | 1 | `ChatModere` | 1 | Une vente live intègre un chat modéré |
| Composition | `VenteLive` | 1 | `Archive` | 1 | Une vente live génère une archive légale |
| Association | `Archive` | 1 | `Offre` | 0..* | L'archive conserve l'historique des offres |

---

### Figure 10 — Diagramme de classes : Paiement & Garantie

**Domaine fonctionnel** : Paiement & Garantie Financière

**Description** :  
Chaque **`Offre`** exige une **`GarantieFinanciere`** qui **bloque les fonds** correspondants dans le **`PortefeuilleVirtuel`** de l'utilisateur, via des **`TransactionSPI`** vers la banque centrale. L'**`Adjudication`** génère ensuite les **`Paiement`**, réconciliés par le **Trésor Public**.

**Classes principales** :
- `Offre`
- `GarantieFinanciere`
- `PortefeuilleVirtuel`
- `TransactionSPI`
- `Adjudication`
- `Paiement`
- `TresorPublic`

**Relations entre classes** :

| Relation | Source | Cardinalité | Cible | Cardinalité | Description |
|----------|--------|-------------|-------|-------------|-------------|
| Association | `Offre` | 1 | `GarantieFinanciere` | 1 | Chaque offre est couverte par une garantie financière |
| Association | `GarantieFinanciere` | 1 | `PortefeuilleVirtuel` | 1 | La garantie bloque les fonds sur un portefeuille |
| Association | `GarantieFinanciere` | 1 | `TransactionSPI` | 1..* | Une garantie génère une ou plusieurs transactions SPI |
| Association | `Adjudication` | 1 | `Paiement` | 1..* | Une adjudication produit un ou plusieurs paiements |
| Association | `Paiement` | 1 | `TransactionSPI` | 1..* | Un paiement est réalisé via une ou plusieurs transactions SPI |
| Association | `Adjudication` | 1 | `GarantieFinanciere` | 1 | L'adjudication transforme la garantie du gagnant en acompte |

---

### Figure 11 — Diagramme de classes : Adjudication & Traçabilité

**Domaine fonctionnel** : Adjudication, Audit & Traçabilité

**Description** :  
La clôture d'une **`Enchere`** produit une **`Adjudication`**, qui génère les **`DocumentLegal`** signés par le **Commissaire-Priseur**. Chaque action utilisateur alimente un **`JournalAudit`**, analysé par le **`ModuleDetectionFraude`** ; les administrateurs consultent des **`TableauDeBord`** décisionnels.

**Classes principales** :
- `Enchere`
- `Adjudication`
- `DocumentLegal`
- `CommissairePriseur`
- `JournalAudit`
- `ModuleDetectionFraude`
- `TableauDeBord`

**Relations entre classes** :

| Relation | Source | Cardinalité | Cible | Cardinalité | Description |
|----------|--------|-------------|-------|-------------|-------------|
| Association | `Enchere` | 1 | `Adjudication` | 1 | Une enchère produit exactement une adjudication à sa clôture |
| Association | `Adjudication` | 1 | `DocumentLegal` | 1..* | Une adjudication génère un ou plusieurs documents légaux (PV, bordereaux) |
| Association | `Adjudication` | 1 | `CommissairePriseur` | 1 | Le PV est signé par le commissaire-priseur responsable |
| Association | `Utilisateur` | 1 | `JournalAudit` | 0..* | Chaque action utilisateur génère une entrée dans le journal d'audit |
| Association | `JournalAudit` | 1 | `ModuleDetectionFraude` | 1 | Le module d'IA analyse le journal pour détecter les fraudes |
| Association | `AdministrateurSysteme` | 1 | `TableauDeBord` | 0..* | Un administrateur peut consulter plusieurs tableaux de bord |
| Association | `ModuleDetectionFraude` | 1 | `TableauDeBord` | 1 | Les alertes de fraude remontent dans le tableau de bord |

---

## Partie 3 — Diagrammes de Séquence

### Figure 12 — Diagramme de séquence : Authentification Multi-Facteurs

**Scénario** : Authentification Multi-Facteurs (MFA)

**Description** :  
Ce scénario illustre la chronologie des échanges entre l'utilisateur, le **Service IAM**, et les canaux de notification (SMS/Email) :

1. L'utilisateur saisit ses identifiants.
2. Le **Service IAM** vérifie les identifiants.
3. Le système génère un **code OTP** (One-Time Password).
4. Le code est envoyé via un canal **SMS** ou **Email**.
5. L'utilisateur saisit le code OTP pour validation.
6. Le Service IAM valide le code.
7. Le système émet un **jeton de session** porteur du profil RBAC de l'utilisateur.

**Acteurs / Objets impliqués** :
- Utilisateur
- Service IAM
- Service de notification (SMS/Email)

---

### Figure 13 — Diagramme de séquence : Dépôt d'une Offre avec Garantie

**Scénario** : Dépôt d'une Offre avec Garantie Financière

**Description** :  
Avant toute participation à une enchère, le système vérifie et bloque la garantie financière requise auprès du **portefeuille virtuel** de l'enchérisseur, via une **transaction avec le SPI BCEAO**, avant d'accepter l'offre et d'appliquer si nécessaire la **prolongation anti-sniping**.

**Flux principal** :
1. L'enchérisseur demande à déposer une offre.
2. Le système vérifie la disponibilité de la garantie financière.
3. Le système bloque les fonds via le **SPI BCEAO**.
4. L'offre est enregistrée.
5. Si une offre est déposée dans les dernières secondes, le système applique la **prolongation anti-sniping** (ex. +2 minutes).
6. Confirmation du dépôt à l'enchérisseur.

**Acteurs / Objets impliqués** :
- Enchérisseur
- Système d'enchères
- Portefeuille Virtuel
- SPI BCEAO

---

### Figure 14 — Diagramme de séquence : Adjudication et Paiement Final

**Scénario** : Processus complet d'Adjudication et Paiement Final

**Description** :  
Ce scénario couvre l'ensemble du processus de clôture d'une enchère, de la détermination du gagnant jusqu'au retrait du lot.

**Flux principal** :
1. **Clôture de l'enchère** et détermination du gagnant.
2. **Déblocage des fonds** des enchérisseurs perdants.
3. **Transformation de la garantie du gagnant en acompte**.
4. **Génération et signature électronique** du procès-verbal d'adjudication.
5. **Paiement du solde final** par l'adjudicataire.
6. **Remise du bordereau de retrait** et libération du lot.

**Acteurs / Objets impliqués** :
- Système d'enchères
- Enchérisseurs (perdants et gagnant)
- Commissaire-Priseur
- SPI BCEAO / Trésor Public
- Système de signature électronique

---

## Partie 4 — Diagrammes d'Activité

### Figure 15 — Diagramme d'activité : Cycle de Vie d'une Saisie (Partie A)

**Processus** : Cycle de Vie d'une Saisie — Partie A (Judiciaire → Conformité)

**Description** :  
Ce processus débute par la **réception de l'ordonnance judiciaire** et la **création du dossier** par l'**Agent AES**. Après **contrôle de conformité** et **validation par le Magistrat**, le bien est enregistré et expertisé.

**Activités principales (Partie A)** :
1. Réception de l'ordonnance judiciaire
2. Création du dossier de saisie par l'Agent AES
3. Contrôle de conformité des documents
4. Validation par le Magistrat
5. Enregistrement du bien saisi
6. Expertise du bien (évaluation par un expert)

> **Connecteur** : Le flux se poursuit à la **Partie B** (Figure 16) pour la phase physique, l'estimation et la publication.

---

### Figure 16 — Diagramme d'activité : Cycle de Vie d'une Saisie (Partie B)

**Processus** : Cycle de Vie d'une Saisie — Partie B (Suite de A)

**Description** :  
Suite de la Partie A. Après l'expertise, le bien subit les étapes de **identification physique**, **estimation** et **publication au catalogue national** sous forme de lot.

**Activités principales (Partie B)** :
1. Identification physique du bien (QR Code, RFID)
2. Estimation de la valeur (expertise ou IA)
3. Création de la fiche bien et enrichissement média
4. Validation du lot par le Commissaire-Priseur
5. Publication au catalogue national
6. Notification aux potentiels enchérisseurs

> **Connecteur** : Ce processus est relié à la Partie A via le connecteur **(A)**.

---

### Figure 17 — Diagramme d'activité : Cycle de Vie d'une Enchère (Partie A)

**Processus** : Cycle de Vie d'une Enchère — Partie A (Participation)

**Description** :  
Ce processus modélise la **boucle de participation** des enchérisseurs : consignation de la garantie, dépôt d'offres successives avec **prolongation anti-sniping** tant que l'enchère reste active.

**Activités principales (Partie A)** :
1. Publication du lot en catalogue
2. Consignation de la garantie par l'enchérisseur
3. Vérification et blocage des fonds (SPI BCEAO)
4. Ouverture de l'enchère
5. Dépôt d'offres par les enchérisseurs
6. Activation de la surenchère automatique (optionnel)
7. Vérification de la prolongation anti-sniping
8. Tant que l'enchère est active → retour au dépôt d'offres

> **Connecteur** : Le flux se poursuit à la **Partie B** (Figure 18) pour la clôture et le paiement.

---

### Figure 18 — Diagramme d'activité : Cycle de Vie d'une Enchère (Partie B)

**Processus** : Cycle de Vie d'une Enchère — Partie B (Suite de A — Clôture & Paiement)

**Description** :  
Suite de la Partie A. À la clôture de l'enchère, le système procède au **déblocage des fonds des perdants**, transforme la **garantie du gagnant en acompte**, génère le **procès-verbal** et règle le **paiement final**.

**Activités principales (Partie B)** :
1. Clôture de l'enchère (fin du compte à rebours)
2. Détermination du gagnant (meilleure offre)
3. Déblocage des fonds des enchérisseurs perdants
4. Transformation de la garantie du gagnant en acompte
5. Génération du procès-verbal d'adjudication
6. Signature électronique par le Commissaire-Priseur
7. Paiement du solde final par l'adjudicataire
8. Remise du bordereau de retrait
9. Libération du lot et notification de retrait

> **Connecteur** : Ce processus est relié à la Partie A via le connecteur **(B)**.

---

## Récapitulatif des diagrammes

| N° | Type | Titre | Domaine |
|----|------|-------|---------|
| 1 | Cas d'utilisation | IAM & Gestion des Saisies | Authentification, RBAC, GED |
| 2 | Cas d'utilisation | Inventaire & Catalogue | Biens, médias, QR/RFID, estimation IA |
| 3 | Cas d'utilisation | Enchères Électroniques | Offres, surenchère, anti-sniping, garantie |
| 4 | Cas d'utilisation | Enchère Vidéo en Direct | Live HD, salle virtuelle, chat modéré, replay |
| 5 | Cas d'utilisation | Paiement & Garantie | Consignation, blocage, paiement, SPI BCEAO |
| 6 | Cas d'utilisation | Adjudication & Traçabilité | PV, audit, détection fraude, dashboards |
| 7 | Classes | Gestion des Utilisateurs (IAM) | Utilisateur, RBAC, PortefeuilleVirtuel |
| 8 | Classes | Saisies & Inventaire | DossierSaisie, BienSaisi, Expertise, EstimationIA |
| 9 | Classes | Enchères & Live Auction | Lot, Enchere, Offre, Surenchere, VenteLive |
| 10 | Classes | Paiement & Garantie | GarantieFinanciere, TransactionSPI, Paiement |
| 11 | Classes | Adjudication & Traçabilité | Adjudication, DocumentLegal, JournalAudit, Fraude |
| 12 | Séquence | Authentification Multi-Facteurs | IAM, OTP, jeton de session RBAC |
| 13 | Séquence | Dépôt d'une Offre avec Garantie | Blocage fonds, SPI BCEAO, anti-sniping |
| 14 | Séquence | Adjudication et Paiement Final | Clôture, PV, paiement, bordereau |
| 15 | Activité | Cycle de Vie d'une Saisie (A) | Ordonnance → Conformité → Expertise |
| 16 | Activité | Cycle de Vie d'une Saisie (B) | ID physique → Estimation → Publication |
| 17 | Activité | Cycle de Vie d'une Enchère (A) | Garantie → Offres → Anti-sniping |
| 18 | Activité | Cycle de Vie d'une Enchère (B) | Clôture → Paiement → Retrait |

---

> **Document généré automatiquement** à partir de l'analyse du PDF *EnchereDirect_Diagrammes_UML.pdf* (WCC SARL, Fév 2026).
