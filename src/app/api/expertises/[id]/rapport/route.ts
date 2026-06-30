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
import { rapportExpertiseSchema } from '@/lib/validators'

// POST : l'expert rédige (ou re-soumet après rejet) son rapport d'expertise.
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

  if (!requirePermission(user.role, 'EXPERTISE_REDIGER')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const affectation = await prisma.affectationExpertise.findUnique({
      where: { id },
      include: { rapport: true },
    })
    if (!affectation) {
      return NextResponse.json({ error: 'Affectation introuvable.' }, { status: 404 })
    }

    // Seul l'expert affecté (ou un administrateur) peut rédiger ce rapport.
    if (affectation.expertId !== user.id && user.role !== Role.ADMINISTRATEUR) {
      return NextResponse.json({ error: 'Affectation non assignée à cet expert.' }, { status: 403 })
    }

    // Un rapport déjà validé est verrouillé.
    if (affectation.rapport?.statutValidation === 'VALIDE') {
      return NextResponse.json({ error: 'Rapport déjà validé, modification impossible.' }, { status: 409 })
    }

    const body = await request.json()
    const parsed = rapportExpertiseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const data = parsed.data

    const rapport = await prisma.rapportExpertise.upsert({
      where: { affectationId: affectation.id },
      create: {
        bienId: affectation.bienId,
        expertId: affectation.expertId,
        affectationId: affectation.id,
        valeurEstimee: data.valeurEstimee,
        methodologie: data.methodologie ?? null,
        contenu: data.contenu,
        statutValidation: 'SOUMIS',
      },
      update: {
        valeurEstimee: data.valeurEstimee,
        methodologie: data.methodologie ?? null,
        contenu: data.contenu,
        statutValidation: 'SOUMIS',
        motifRejet: null,
        valideParId: null,
        dateValidation: null,
      },
    })

    await prisma.affectationExpertise.update({
      where: { id: affectation.id },
      data: { statut: 'TERMINEE' },
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'SOUMISSION_RAPPORT',
      entite: 'RapportExpertise',
      entiteId: rapport.id,
      nouvelleValeur: { valeurEstimee: data.valeurEstimee.toString() },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: rapport }, { status: 201 })
  } catch (err) {
    console.error('POST /api/expertises/[id]/rapport error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
