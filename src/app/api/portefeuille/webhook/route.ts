import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { logAudit, getClientIP } from '@/lib/api-helpers'
import { StatutPaiement } from '@prisma/client'

/**
 * Webhook de confirmation de paiement.
 *
 * C'est le SEUL endroit qui crédite réellement le solde. Il est destiné à être
 * appelé par le prestataire de paiement (MoMo / banque / SPI-BCEAO) — jamais par
 * l'utilisateur. Il est protégé par un secret partagé et est idempotent
 * (un même paiement ne peut pas créditer deux fois).
 *
 * Auth : en-tête `x-webhook-secret` == process.env.PAYMENT_WEBHOOK_SECRET.
 */
const webhookSchema = z.object({
  reference: z.string().min(1),
  statut: z.enum(['CONFIRME', 'ECHOUE']),
})

export async function POST(req: NextRequest) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) {
    console.error('[WEBHOOK] PAYMENT_WEBHOOK_SECRET non configuré.')
    return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 })
  }

  // Comparaison directe (le secret n'est jamais exposé au client).
  if (req.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  let parsed
  try {
    parsed = webhookSchema.safeParse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
  }
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
  }
  const { reference, statut } = parsed.data

  try {
    const tx = await prisma.transactionSPI.findUnique({
      where: { reference },
      select: { id: true, portefeuilleId: true, montant: true, type: true, statut: true },
    })
    if (!tx) {
      return NextResponse.json({ error: 'Transaction introuvable.' }, { status: 404 })
    }

    // Idempotence : si déjà traitée, on ne refait rien (pas de double crédit).
    if (tx.statut !== StatutPaiement.EN_ATTENTE) {
      return NextResponse.json({ ok: true, statut: tx.statut, deja: true })
    }

    if (statut === 'ECHOUE') {
      await prisma.transactionSPI.update({
        where: { id: tx.id },
        data: { statut: StatutPaiement.ECHOUE },
      })
      return NextResponse.json({ ok: true, statut: 'ECHOUE' })
    }

    // Paiement confirmé : on crédite le solde ET on confirme la transaction,
    // de façon atomique. La clause `statut: EN_ATTENTE` dans le where garantit
    // qu'un seul appel concurrent peut effectuer le crédit (anti double-crédit).
    await prisma.$transaction(async (t) => {
      const res = await t.transactionSPI.updateMany({
        where: { id: tx.id, statut: StatutPaiement.EN_ATTENTE },
        data: { statut: StatutPaiement.CONFIRME },
      })
      if (res.count === 0) return // déjà traité par un appel concurrent

      if (tx.type === 'CREDIT') {
        await t.portefeuille.update({
          where: { id: tx.portefeuilleId },
          data: { soldeDisponible: { increment: tx.montant } },
        })
      }
    })

    await logAudit({
      action: 'CONFIRMATION_PAIEMENT',
      entite: 'TransactionSPI',
      entiteId: tx.id,
      nouvelleValeur: { reference, statut: 'CONFIRME' },
      adresseIP: getClientIP(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ ok: true, statut: 'CONFIRME' })
  } catch (err) {
    console.error('Erreur webhook paiement:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
