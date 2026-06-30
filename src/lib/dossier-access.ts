import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

/**
 * Détermine si un utilisateur peut accéder à un dossier de saisie (et donc à ses
 * pièces : documents GED, etc.).
 *
 *  - AGENT_AES et ADMINISTRATEUR : accès complet.
 *  - MAGISTRAT : uniquement les dossiers de sa juridiction.
 *  - Les autres rôles : aucun accès.
 */
export async function canAccessDossier(
  userId: string,
  role: Role,
  dossierId: string
): Promise<boolean> {
  const dossier = await prisma.dossierSaisie.findUnique({
    where: { id: dossierId },
    select: { jurisdictionCompetente: true },
  })
  if (!dossier) return false

  if (role === Role.AGENT_AES || role === Role.ADMINISTRATEUR) return true

  if (role === Role.MAGISTRAT) {
    const magistrat = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { jurisdiction: true },
    })
    return magistrat?.jurisdiction === dossier.jurisdictionCompetente
  }

  return false
}
