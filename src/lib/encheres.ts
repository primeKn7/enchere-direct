import { Prisma } from '@prisma/client'

/**
 * Prix courant d'une enchère DESCENDANTE (au cadran).
 * Interpolation linéaire de `prixDepart` (haut, à dateDebut) vers
 * `montantReserve` (plancher, à dateFin). Le prix baisse avec le temps ;
 * le premier enchérisseur qui accepte le prix courant remporte le lot.
 */
export function prixDescendant(opts: {
  prixDepart: Prisma.Decimal | number | string
  montantReserve: Prisma.Decimal | number | string
  dateDebut: Date
  dateFin: Date
  now?: Date
}): number {
  const haut = Number(opts.prixDepart)
  const bas = Number(opts.montantReserve)
  const now = opts.now ?? new Date()
  const total = opts.dateFin.getTime() - opts.dateDebut.getTime()
  if (total <= 0) return bas
  const ecoule = Math.min(Math.max(now.getTime() - opts.dateDebut.getTime(), 0), total)
  const ratio = ecoule / total
  return Math.round(haut - (haut - bas) * ratio)
}

export const TYPE_ENCHERE_LABELS: Record<string, string> = {
  ASCENDANTE: 'Ascendante',
  DESCENDANTE: 'Descendante (au cadran)',
  SCELLEE: 'Scellée (offres cachées)',
  VENTE_DIRECTE: 'Vente directe (prix fixe)',
}
