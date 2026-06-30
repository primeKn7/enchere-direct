import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  getSessionOrUnauthorized,
  getClientIP,
  logAudit,
  checkApiRateLimit,
  internalServerError,
} from '@/lib/api-helpers'

// Rechargement : montant strictement positif, 2 décimales max, plafonné.
const rechargeSchema = z.object({
  montant: z
    .number()
    .positive('Montant invalide.')
    .max(1_000_000_000, 'Montant trop élevé.')
    .refine((v) => Number.isFinite(v) && Math.round(v * 100) === v * 100, '2 décimales maximum.'),
  canal: z.enum(['SPI_BCEAO', 'MOBILE_MONEY', 'VIREMENT']),
})

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

    const body = await req.json().catch(() => ({}))
    const parsed = rechargeSchema.safeParse(body)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      return NextResponse.json({ error: first ?? 'Données invalides.' }, { status: 400 })
    }
    const { montant, canal } = parsed.data

    let portefeuille = await prisma.portefeuille.findUnique({
      where: { utilisateurId: session.user.id },
    })

    if (!portefeuille) {
      portefeuille = await prisma.portefeuille.create({
        data: { utilisateurId: session.user.id },
      })
    }

    const reference = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // SÉCURITÉ : on n'effectue AUCUN crédit ici. On crée seulement une intention
    // de paiement EN_ATTENTE. Le solde n'est crédité que lorsque le prestataire
    // (MoMo / banque / SPI) confirme le paiement via le webhook signé
    // (POST /api/portefeuille/webhook), de façon idempotente.
    const transaction = await prisma.transactionSPI.create({
      data: {
        portefeuilleId: portefeuille.id,
        reference,
        montant,
        type: 'CREDIT',
        statut: 'EN_ATTENTE',
        canal,
      },
    })

    await logAudit({
      utilisateurId: session.user.id,
      action: 'INITIATION_RECHARGE',
      entite: 'TransactionSPI',
      entiteId: transaction.id,
      nouvelleValeur: { montant, canal, reference, statut: 'EN_ATTENTE' },
      adresseIP: getClientIP(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    // `reference` est ce que le prestataire renverra dans son webhook de confirmation.
    return NextResponse.json(
      {
        transaction,
        reference,
        statut: 'EN_ATTENTE',
        message: 'Paiement initié. Le solde sera crédité après confirmation du prestataire.',
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Erreur portefeuille POST:', err)
    return internalServerError()
  }
}
