import { Role, StatutDossier, StatutEnchere, TypeEnchere, StatutOffre, StatutPaiement, StatutGarantie } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    role: Role
    mfaActif: boolean
    compteVerifie: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: Role
      mfaActif: boolean
      compteVerifie: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: Role
    mfaActif?: boolean
    compteVerifie?: boolean
    refreshToken?: string
  }
}

export type { Role, StatutDossier, StatutEnchere, TypeEnchere, StatutOffre, StatutPaiement, StatutGarantie }

export type Permission =
  | 'DOSSIER_LIRE'
  | 'DOSSIER_CREER'
  | 'DOSSIER_MODIFIER'
  | 'ENCHERE_LIRE'
  | 'ENCHERE_CREER'
  | 'OFFRE_DEPOSER'
  | 'ADMIN_SYSTEME'
  | 'COMPTE_VALIDER'
  | 'FRAUDE_LIRE'
  | 'EXPERTISE_LIRE'
  | 'EXPERTISE_AFFECTER'
  | 'EXPERTISE_REDIGER'
  | 'EXPERTISE_VALIDER'
  | 'ESTIMATION_GENERER'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CITOYEN: ['ENCHERE_LIRE', 'OFFRE_DEPOSER'],
  ENTREPRISE: ['ENCHERE_LIRE', 'OFFRE_DEPOSER'],
  COMMISSAIRE_PRISEUR: ['ENCHERE_LIRE', 'ENCHERE_CREER', 'DOSSIER_LIRE', 'EXPERTISE_LIRE'],
  AGENT_AES: ['DOSSIER_LIRE', 'DOSSIER_CREER', 'DOSSIER_MODIFIER', 'FRAUDE_LIRE', 'EXPERTISE_LIRE', 'EXPERTISE_AFFECTER', 'ESTIMATION_GENERER'],
  MAGISTRAT: ['DOSSIER_LIRE', 'DOSSIER_MODIFIER', 'EXPERTISE_LIRE', 'EXPERTISE_VALIDER'],
  DOUANIER: ['DOSSIER_LIRE'],
  TRESOR_PUBLIC: ['DOSSIER_LIRE'],
  EXPERT: ['EXPERTISE_LIRE', 'EXPERTISE_REDIGER'],
  ADMINISTRATEUR: ['DOSSIER_LIRE', 'DOSSIER_CREER', 'DOSSIER_MODIFIER', 'ENCHERE_LIRE', 'ENCHERE_CREER', 'ADMIN_SYSTEME', 'COMPTE_VALIDER', 'FRAUDE_LIRE', 'EXPERTISE_LIRE', 'EXPERTISE_AFFECTER', 'EXPERTISE_VALIDER', 'ESTIMATION_GENERER'],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
