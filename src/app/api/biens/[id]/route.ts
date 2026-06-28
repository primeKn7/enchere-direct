import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkApiRateLimit,
  getClientIP,
  getSessionOrUnauthorized,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { updateBienSchema } from '@/lib/validators'

export async function GET(
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

  if (!requirePermission(user.role, 'DOSSIER_LIRE')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const bien = await prisma.bienSaisi.findUnique({
    where: { id },
    include: {
      dossier: { select: { id: true, referenceJudiciaire: true } },
      medias: { orderBy: { createdAt: 'desc' } },
      expertises: { orderBy: { createdAt: 'desc' } },
      estimationIA: true,
      lot: true,
    },
  })

  if (!bien) {
    return NextResponse.json({ error: 'Bien introuvable.' }, { status: 404 })
  }

  return NextResponse.json({ data: bien }, { status: 200 })
}

export async function PATCH(
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

  if (!requirePermission(user.role, 'DOSSIER_CREER')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = updateBienSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const existing = await prisma.bienSaisi.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Bien introuvable.' }, { status: 404 })
    }

    const updated = await prisma.bienSaisi.update({
      where: { id },
      data: parsed.data,
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'MODIFICATION_BIEN',
      entite: 'BienSaisi',
      entiteId: id,
      ancienneValeur: { categorie: existing.categorie, etatGeneral: existing.etatGeneral },
      nouvelleValeur: { categorie: updated.categorie, etatGeneral: updated.etatGeneral },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
