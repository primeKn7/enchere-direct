import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    let portefeuille = await prisma.portefeuille.findUnique({
      where: { utilisateurId: session.user.id },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        garanties: {
          where: { statut: 'ACTIVE' },
          include: { offre: { select: { enchereId: true, montant: true } } },
        },
      },
    })

    if (!portefeuille) {
      portefeuille = await prisma.portefeuille.create({
        data: { utilisateurId: session.user.id },
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
          garanties: {
            where: { statut: 'ACTIVE' },
            include: { offre: { select: { enchereId: true, montant: true } } },
          },
        },
      })
    }

    return NextResponse.json(portefeuille)
  } catch (err) {
    console.error('Erreur portefeuille GET:', err)
    return internalServerError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateRes = await checkApiRateLimit(req)
    if (rateRes) return rateRes

    const session = await getSessionOrUnauthorized()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    const body = await req.json()
    const { montant, canal } = body

    if (!montant || montant <= 0) {
      return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 })
    }

    const canaux = ['SPI_BCEAO', 'MOBILE_MONEY', 'VIREMENT']
    if (!canal || !canaux.includes(canal)) {
      return NextResponse.json({ error: 'Canal de paiement invalide.' }, { status: 400 })
    }

    let portefeuille = await prisma.portefeuille.findUnique({
      where: { utilisateurId: session.user.id },
    })

    if (!portefeuille) {
      portefeuille = await prisma.portefeuille.create({
        data: { utilisateurId: session.user.id },
      })
    }

    const reference = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const [transaction, updated] = await prisma.$transaction([
      prisma.transactionSPI.create({
        data: {
          portefeuilleId: portefeuille.id,
          reference,
          montant,
          type: 'CREDIT',
          statut: 'CONFIRME',
          canal,
        },
      }),
      prisma.portefeuille.update({
        where: { id: portefeuille.id },
        data: { soldeDisponible: { increment: montant } },
      }),
    ])

    await logAudit({
      utilisateurId: session.user.id,
      action: 'CREDIT_PORTEFEUILLE',
      entite: 'Portefeuille',
      entiteId: portefeuille.id,
      nouvelleValeur: { montant, canal, reference },
      adresseIP: getClientIP(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ transaction, soldeDisponible: updated.soldeDisponible }, { status: 201 })
  } catch (err) {
    console.error('Erreur portefeuille POST:', err)
    return internalServerError()
  }
}
