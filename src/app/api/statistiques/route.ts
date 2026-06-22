import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role, StatutDossier, StatutEnchere } from '@prisma/client'
import {
  getSessionOrUnauthorized,
  checkApiRateLimit,
  internalServerError,
} from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const rateRes = await checkApiRateLimit(req)
    if (rateRes) return rateRes

    const session = await getSessionOrUnauthorized()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    const role = session.user.role as Role
    if (
      role !== Role.ADMINISTRATEUR &&
      role !== Role.AGENT_AES &&
      role !== Role.COMMISSAIRE_PRISEUR
    ) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const [
      totalUtilisateurs,
      totalDossiers,
      dossiersParStatut,
      totalBiens,
      totalLots,
      lotsPublies,
      totalEncheres,
      encheresParStatut,
      totalOffres,
      totalAdjudications,
      totalAlertesFraude,
      alertesNonTraitees,
      recettesResult,
    ] = await Promise.all([
      prisma.utilisateur.count(),
      prisma.dossierSaisie.count(),
      prisma.dossierSaisie.groupBy({ by: ['statut'], _count: true }),
      prisma.bienSaisi.count(),
      prisma.lot.count(),
      prisma.lot.count({ where: { publie: true } }),
      prisma.enchere.count(),
      prisma.enchere.groupBy({ by: ['statut'], _count: true }),
      prisma.offre.count(),
      prisma.adjudication.count(),
      prisma.alerteFraude.count(),
      prisma.alerteFraude.count({ where: { traite: false } }),
      prisma.adjudication.aggregate({ _sum: { montantFinal: true } }),
    ])

    const dossiersStatut: Record<string, number> = {}
    for (const g of dossiersParStatut) {
      dossiersStatut[g.statut] = g._count
    }

    const encheresStatut: Record<string, number> = {}
    for (const g of encheresParStatut) {
      encheresStatut[g.statut] = g._count
    }

    const encheresActives =
      (encheresStatut[StatutEnchere.EN_COURS] ?? 0) +
      (encheresStatut[StatutEnchere.PROLONGEE] ?? 0)

    const tauxEcoulement =
      totalLots > 0
        ? ((totalAdjudications / totalLots) * 100).toFixed(1)
        : '0.0'

    return NextResponse.json({
      utilisateurs: totalUtilisateurs,
      dossiers: {
        total: totalDossiers,
        parStatut: dossiersStatut,
        enAttente: dossiersStatut[StatutDossier.EN_ATTENTE] ?? 0,
        valides: dossiersStatut[StatutDossier.VALIDE] ?? 0,
      },
      biens: totalBiens,
      lots: {
        total: totalLots,
        publies: lotsPublies,
        nonPublies: totalLots - lotsPublies,
      },
      encheres: {
        total: totalEncheres,
        parStatut: encheresStatut,
        actives: encheresActives,
        cloturees: encheresStatut[StatutEnchere.CLOTUREE] ?? 0,
      },
      offres: totalOffres,
      adjudications: totalAdjudications,
      recettes: recettesResult._sum.montantFinal?.toString() ?? '0',
      tauxEcoulement,
      fraude: {
        total: totalAlertesFraude,
        nonTraitees: alertesNonTraitees,
      },
    })
  } catch (err) {
    console.error('Erreur statistiques GET:', err)
    return internalServerError()
  }
}
