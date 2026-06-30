import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getSessionOrUnauthorized,
  checkApiRateLimit,
  getClientIP,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { validationRapportSchema } from '@/lib/validators'

// POST : validation OU rejet du rapport, avec notation de l'expert en cas de validation.
// [id] = identifiant de l'affectation.
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

  if (!requirePermission(user.role, 'EXPERTISE_VALIDER')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const affectation = await prisma.affectationExpertise.findUnique({
      where: { id },
      include: { rapport: true },
    })
    if (!affectation || !affectation.rapport) {
      return NextResponse.json({ error: 'Aucun rapport à valider pour cette affectation.' }, { status: 404 })
    }

    const rapport = affectation.rapport
    if (rapport.statutValidation !== 'SOUMIS') {
      return NextResponse.json(
        { error: 'Seul un rapport soumis peut être validé ou rejeté.' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const parsed = validationRapportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const data = parsed.data

    if (data.decision === 'VALIDE') {
      await prisma.$transaction([
        prisma.rapportExpertise.update({
          where: { id: rapport.id },
          data: {
            statutValidation: 'VALIDE',
            valideParId: user.id,
            dateValidation: new Date(),
            motifRejet: null,
          },
        }),
        prisma.notationExpert.upsert({
          where: { rapportId: rapport.id },
          create: {
            rapportId: rapport.id,
            expertId: rapport.expertId,
            noteParId: user.id,
            note: data.note!,
            commentaire: data.commentaire ?? null,
          },
          update: {
            note: data.note!,
            commentaire: data.commentaire ?? null,
            noteParId: user.id,
          },
        }),
      ])
    } else {
      await prisma.$transaction([
        prisma.rapportExpertise.update({
          where: { id: rapport.id },
          data: {
            statutValidation: 'REJETE',
            valideParId: user.id,
            dateValidation: new Date(),
            motifRejet: data.motifRejet ?? null,
          },
        }),
        // Renvoie l'affectation à l'expert pour correction.
        prisma.affectationExpertise.update({
          where: { id: affectation.id },
          data: { statut: 'ACCEPTEE' },
        }),
      ])
    }

    await logAudit({
      utilisateurId: user.id,
      action: data.decision === 'VALIDE' ? 'VALIDATION_RAPPORT' : 'REJET_RAPPORT',
      entite: 'RapportExpertise',
      entiteId: rapport.id,
      nouvelleValeur: { decision: data.decision, note: data.note ?? null },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: { decision: data.decision } }, { status: 200 })
  } catch (err) {
    console.error('POST /api/expertises/[id]/validation error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
