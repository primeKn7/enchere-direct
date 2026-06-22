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

export async function GET(req: NextRequest) {
  try {
    const rateRes = await checkApiRateLimit(req)
    if (rateRes) return rateRes

    const session = await getSessionOrUnauthorized()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    const role = session.user.role as Role
    if (role !== Role.AGENT_AES && role !== Role.ADMINISTRATEUR) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const nonTraiteesOnly = searchParams.get('nonTraitees') === 'true'

    const alertes = await prisma.alerteFraude.findMany({
      where: nonTraiteesOnly ? { traite: false } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(alertes)
  } catch (err) {
    console.error('Erreur fraude GET:', err)
    return internalServerError()
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const rateRes = await checkApiRateLimit(req)
    if (rateRes) return rateRes

    const session = await getSessionOrUnauthorized()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    const role = session.user.role as Role
    if (role !== Role.AGENT_AES && role !== Role.ADMINISTRATEUR) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis.' }, { status: 400 })
    }

    const alerte = await prisma.alerteFraude.findUnique({ where: { id } })
    if (!alerte) {
      return NextResponse.json({ error: 'Alerte introuvable.' }, { status: 404 })
    }

    const updated = await prisma.alerteFraude.update({
      where: { id },
      data: { traite: true },
    })

    await logAudit({
      utilisateurId: session.user.id,
      action: 'TRAITEMENT_ALERTE_FRAUDE',
      entite: 'AlerteFraude',
      entiteId: id,
      ancienneValeur: { traite: false },
      nouvelleValeur: { traite: true },
      adresseIP: getClientIP(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Erreur fraude PATCH:', err)
    return internalServerError()
  }
}
