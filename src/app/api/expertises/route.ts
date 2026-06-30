import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import {
  getSessionOrUnauthorized,
  checkApiRateLimit,
  getClientIP,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { affectationSchema } from '@/lib/validators'

// POST : affecter un bien à un expert agréé.
export async function POST(request: NextRequest) {
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rateLimit = await checkApiRateLimit(request)
  if (rateLimit) return rateLimit

  const { user } = session
  const ip = getClientIP(request)

  if (!requirePermission(user.role, 'EXPERTISE_AFFECTER')) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'AffectationExpertise',
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = affectationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const data = parsed.data

    const bien = await prisma.bienSaisi.findUnique({ where: { id: data.bienId } })
    if (!bien) {
      return NextResponse.json({ error: 'Bien introuvable.' }, { status: 404 })
    }

    const expert = await prisma.utilisateur.findUnique({ where: { id: data.expertId } })
    if (!expert || expert.role !== Role.EXPERT) {
      return NextResponse.json({ error: 'Expert agréé introuvable.' }, { status: 404 })
    }

    // Empêche une affectation active en double pour le même bien/expert.
    const existante = await prisma.affectationExpertise.findFirst({
      where: {
        bienId: data.bienId,
        expertId: data.expertId,
        statut: { in: ['PROPOSEE', 'ACCEPTEE'] },
      },
    })
    if (existante) {
      return NextResponse.json(
        { error: 'Une affectation en cours existe déjà pour cet expert et ce bien.' },
        { status: 409 }
      )
    }

    const affectation = await prisma.affectationExpertise.create({
      data: {
        bienId: data.bienId,
        expertId: data.expertId,
        assigneParId: user.id,
        dateLimite: data.dateLimite ? new Date(data.dateLimite) : null,
        consigne: data.consigne ?? null,
      },
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'AFFECTATION_EXPERTISE',
      entite: 'AffectationExpertise',
      entiteId: affectation.id,
      nouvelleValeur: { bienId: data.bienId, expertId: data.expertId },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: affectation }, { status: 201 })
  } catch (err) {
    console.error('POST /api/expertises error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
