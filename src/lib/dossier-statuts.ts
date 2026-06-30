import { Role, StatutDossier } from '@prisma/client'

/** Libellés lisibles des statuts de dossier (FR). */
export const STATUT_DOSSIER_LABELS: Record<StatutDossier, string> = {
  EN_ATTENTE: 'En attente',
  CONFORME: 'Conforme',
  NON_CONFORME: 'Non conforme',
  VALIDE: 'Validé',
  CLOTURE: 'Clôturé',
}

/** Classe de badge associée à chaque statut. */
export const STATUT_DOSSIER_BADGE: Record<StatutDossier, string> = {
  EN_ATTENTE: 'badge-warning',
  CONFORME: 'badge-subtle',
  NON_CONFORME: 'badge-danger',
  VALIDE: 'badge-success',
  CLOTURE: 'badge-subtle',
}

const TOUS_LES_STATUTS: StatutDossier[] = [
  'EN_ATTENTE',
  'CONFORME',
  'NON_CONFORME',
  'VALIDE',
  'CLOTURE',
]

/**
 * Transitions de statut autorisées par rôle, en fonction du statut courant.
 *
 * Logique métier :
 *  - Le MAGISTRAT instruit la conformité judiciaire puis valide le dossier.
 *    Lui seul peut prononcer le statut VALIDE.
 *  - L'AGENT_AES ne peut que clôturer un dossier une fois la procédure aboutie.
 *  - L'ADMINISTRATEUR peut corriger n'importe quel statut.
 */
const TRANSITIONS: Partial<Record<Role, Partial<Record<StatutDossier, StatutDossier[]>>>> = {
  MAGISTRAT: {
    EN_ATTENTE: ['CONFORME', 'NON_CONFORME'],
    CONFORME: ['VALIDE', 'NON_CONFORME'],
    NON_CONFORME: ['CONFORME'],
  },
  AGENT_AES: {
    VALIDE: ['CLOTURE'],
    NON_CONFORME: ['CLOTURE'],
  },
}

/** Liste des statuts cibles autorisés pour `role` depuis `current`. */
export function transitionsAutorisees(role: Role, current: StatutDossier): StatutDossier[] {
  if (role === Role.ADMINISTRATEUR) {
    return TOUS_LES_STATUTS.filter((s) => s !== current)
  }
  return TRANSITIONS[role]?.[current] ?? []
}
