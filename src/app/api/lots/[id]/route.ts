import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import {
  getSessionOrUnauthorized,
  getClientIP,
  logAudit,
  checkApiRateLimit,
  internalServerError,
} from '@/lib/api-helpers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateRes = await checkApiRateLimit(req)
    if (rateRes) return rateRes

    const session = await getSessionOrUnauthorized()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    const role = session.user.role as Role
    if (role !== Role.COMMISSAIRE_PRISEUR && role !== Role.ADMINISTRATEUR) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { publie } = body

    const lot = await prisma.lot.findUnique({ where: { id } })
    if (!lot) {
      return NextResponse.json({ error: 'Lot introuvable.' }, { status: 404 })
    }

    const updated = await prisma.lot.update({
      where: { id },
      data: { publie: publie === true },
    })

    await logAudit({
      utilisateurId: session.user.id,
      action: publie ? 'PUBLICATION_LOT' : 'DEPUBLICATION_LOT',
      entite: 'Lot',
      entiteId: id,
      ancienneValeur: { publie: lot.publie },
      nouvelleValeur: { publie: updated.publie },
      adresseIP: getClientIP(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Erreur lot PATCH:', err)
    return internalServerError()
  }
}
