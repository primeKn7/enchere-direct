/**
 * Outil d'estimation automatique de la valeur d'un bien saisi.
 *
 * NOTE : il s'agit d'un estimateur HEURISTIQUE déterministe, et non d'un modèle
 * d'apprentissage automatique entraîné. Il combine la valeur de référence (saisie
 * par l'agent ou un expert) avec des facteurs métier (état général, catégorie,
 * richesse documentaire) pour produire une valeur prédite et un indice de
 * confiance reproductibles. L'architecture (entrées/sorties + champ `parametres`
 * en base) permet de brancher ultérieurement un vrai modèle ML sans changer le
 * reste de l'application.
 */

export interface EstimationInput {
  categorie: string
  sousCategorie?: string | null
  etatGeneral: string
  valeurReference: number // valeur estimée humaine servant d'ancrage
  nbMedias: number
  nbExpertisesValidees: number
}

export interface EstimationResult {
  valeurPredite: number
  indiceConfiance: number // 0 → 1
  parametres: {
    valeurReference: number
    facteurEtat: number
    facteurCategorie: number
    volatiliteCategorie: number
    bonusMedias: number
    bonusExpertise: number
    methode: string
    version: string
  }
}

// Multiplicateur appliqué selon l'état déclaré du bien.
const FACTEURS_ETAT: { motcle: string; facteur: number }[] = [
  { motcle: 'neuf', facteur: 1.1 },
  { motcle: 'excellent', facteur: 1.05 },
  { motcle: 'tres bon', facteur: 1.0 },
  { motcle: 'bon', facteur: 0.92 },
  { motcle: 'moyen', facteur: 0.8 },
  { motcle: 'use', facteur: 0.65 },
  { motcle: 'mauvais', facteur: 0.5 },
  { motcle: 'hors service', facteur: 0.35 },
]

// Ajustement et volatilité (incertitude) par catégorie de bien.
const PROFILS_CATEGORIE: Record<string, { facteur: number; volatilite: number }> = {
  immobilier: { facteur: 1.02, volatilite: 0.15 },
  vehicules: { facteur: 0.95, volatilite: 0.2 },
  machines: { facteur: 0.9, volatilite: 0.25 },
  bijoux: { facteur: 1.0, volatilite: 0.18 },
  art: { facteur: 1.05, volatilite: 0.35 },
  electronique: { facteur: 0.85, volatilite: 0.3 },
  meubles: { facteur: 0.8, volatilite: 0.28 },
}

function normaliser(txt: string): string {
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

function facteurEtat(etatGeneral: string): number {
  const e = normaliser(etatGeneral)
  const match = FACTEURS_ETAT.find((f) => e.includes(f.motcle))
  return match?.facteur ?? 0.85
}

function profilCategorie(categorie: string) {
  const c = normaliser(categorie)
  for (const key of Object.keys(PROFILS_CATEGORIE)) {
    if (c.includes(key)) return PROFILS_CATEGORIE[key]
  }
  return { facteur: 0.9, volatilite: 0.3 }
}

export function estimerValeur(input: EstimationInput): EstimationResult {
  const ref = Math.max(0, input.valeurReference)
  const fEtat = facteurEtat(input.etatGeneral)
  const { facteur: fCat, volatilite } = profilCategorie(input.categorie)

  const valeurPredite = Math.round(ref * fEtat * fCat)

  // Confiance de base inversement proportionnelle à la volatilité de la catégorie,
  // renforcée par la richesse documentaire et les expertises validées existantes.
  const bonusMedias = Math.min(0.2, input.nbMedias * 0.03)
  const bonusExpertise = Math.min(0.15, input.nbExpertisesValidees * 0.075)
  const confianceBrute = 0.55 + (0.3 - volatilite) + bonusMedias + bonusExpertise
  const indiceConfiance = Math.min(0.97, Math.max(0.4, Number(confianceBrute.toFixed(2))))

  return {
    valeurPredite,
    indiceConfiance,
    parametres: {
      valeurReference: ref,
      facteurEtat: fEtat,
      facteurCategorie: fCat,
      volatiliteCategorie: volatilite,
      bonusMedias: Number(bonusMedias.toFixed(3)),
      bonusExpertise: Number(bonusExpertise.toFixed(3)),
      methode: 'heuristique-ancrage-v1',
      version: '1.0.0',
    },
  }
}
