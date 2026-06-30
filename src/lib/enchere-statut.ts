import { prisma } from '@/lib/prisma'
import { StatutEnchere } from '@prisma/client'

/**
 * Bascule « paresseuse » des statuts d'enchère en fonction de l'heure courante.
 *
 * Il n'y a pas de planificateur (cron) : cette fonction est appelée au moment
 * des lectures (liste des enchères, catalogue, fiche enchère, dépôt d'offre)
 * pour que les statuts reflètent le temps réel :
 *   - PLANIFIEE  → EN_COURS   dès que la date de début est atteinte (et la fin non dépassée)
 *   - * (active) → CLOTUREE   dès que la date de fin est dépassée
 *
 * L'adjudication finale (désignation de l'adjudicataire) reste gérée séparément
 * dans le flux des offres / le module d'adjudication.
 */
export async function syncEncheresStatuts(): Promise<void> {
  const now = new Date()

  // Démarrage automatique.
  await prisma.enchere.updateMany({
    where: {
      statut: StatutEnchere.PLANIFIEE,
      dateDebut: { lte: now },
      dateFin: { gt: now },
    },
    data: { statut: StatutEnchere.EN_COURS },
  })

  // Clôture automatique à l'échéance.
  await prisma.enchere.updateMany({
    where: {
      statut: {
        in: [StatutEnchere.PLANIFIEE, StatutEnchere.EN_COURS, StatutEnchere.PROLONGEE],
      },
      dateFin: { lte: now },
    },
    data: { statut: StatutEnchere.CLOTUREE },
  })
}
