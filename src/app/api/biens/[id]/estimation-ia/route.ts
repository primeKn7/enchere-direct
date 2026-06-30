import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getSessionOrUnauthorized,
  checkApiRateLimit,
  getClientIP,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { estimerValeur } from '@/lib/estimation-ia'

// POST : génère (ou régénère) l'estimation automatique de la valeur du bien.
// [id] = identifiant du bien.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rateLimit = await checkApiRateLimit(request)
  if (rateLimit) return rateLimit

  const { user } = session
  const { id } = await params
  const ip = getClientIP(request)

  if (!requirePermission(user.role, 'ESTIMATION_GENERER')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const bien = await prisma.bienSaisi.findUnique({
      where: { id },
      include: {
        _count: { select: { medias: true } },
        expertises: { where: { statutValidation: 'VALIDE' }, select: { id: true } },
      },
    })
    if (!bien) {
      return NextResponse.json({ error: 'Bien introuvable.' }, { status: 404 })
    }

    const resultat = estimerValeur({
      categorie: bien.categorie,
      sousCategorie: bien.sousCategorie,
      etatGeneral: bien.etatGeneral,
      valeurReference: Number(bien.valeurEstimee),
      nbMedias: bien._count.medias,
      nbExpertisesValidees: bien.expertises.length,
    })

    const estimation = await prisma.estimationIA.upsert({
      where: { bienId: id },
      create: {
        bienId: id,
        valeurPredite: resultat.valeurPredite,
        indiceConfiance: resultat.indiceConfiance,
        parametres: resultat.parametres,
      },
      update: {
        valeurPredite: resultat.valeurPredite,
        indiceConfiance: resultat.indiceConfiance,
        parametres: resultat.parametres,
      },
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'ESTIMATION_IA',
      entite: 'EstimationIA',
      entiteId: estimation.id,
      nouvelleValeur: {
        valeurPredite: resultat.valeurPredite,
        indiceConfiance: resultat.indiceConfiance,
      },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: estimation }, { status: 200 })
  } catch (err) {
    console.error('POST /api/biens/[id]/estimation-ia error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
