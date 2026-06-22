import { NextRequest, NextResponse } from 'next/server'
import { Prisma, StatutEnchere, StatutOffre, StatutGarantie, StatutPaiement } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  checkApiRateLimit,
  getClientIP,
  getSessionOrUnauthorized,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { offreSchema } from '@/lib/validators'
import { Role } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth + session valide
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { user } = session
  const { id: enchereId } = await params
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') ?? undefined

  if (!requirePermission(user.role, 'OFFRE_DEPOSER')) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'Offre',
      entiteId: enchereId,
      adresseIP: ip,
      userAgent,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // 2. Rate limit offres
  const offreRate = await checkApiRateLimit(request)
  if (offreRate) return offreRate

  const offreByUser = await import('@/lib/rate-limiter').then((m) => m.checkRateLimit(`offre:${user.id}`, 'offreLimiter'))
  if (!offreByUser.allowed) {
    return NextResponse.json({ error: 'Trop d\'offres. Réessayez plus tard.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const parsed = offreSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const montantOffre = new Prisma.Decimal(parsed.data.montant)

    // 3. Enchère existe et statut EN_COURS
    const enchere = await prisma.enchere.findUnique({
      where: { id: enchereId },
      include: { lot: true },
    })

    if (!enchere) {
      return NextResponse.json({ error: 'Enchère introuvable.' }, { status: 404 })
    }

    const now = new Date()
    if (enchere.dateDebut > now || enchere.dateFin < now || enchere.statut !== StatutEnchere.EN_COURS) {
      return NextResponse.json({ error: 'Enchère non active.' }, { status: 400 })
    }

    // 4. Montant > montantActuel
    if (montantOffre.lessThanOrEqualTo(enchere.montantActuel)) {
      return NextResponse.json(
        { error: 'Le montant doit être supérieur au montant actuel.' },
        { status: 400 }
      )
    }

    // 5. Garantie financière suffisante
    const caution = montantOffre.mul(enchere.pourcentageGarantie).div(100)

    const portefeuille = await prisma.portefeuille.findUnique({
      where: { utilisateurId: user.id },
    })

    if (!portefeuille || new Prisma.Decimal(portefeuille.soldeDisponible).lessThan(caution)) {
      return NextResponse.json({ error: 'Garantie financière insuffisante.' }, { status: 402 })
    }

    // 6 & 7. Transaction atomique : bloquer fonds + enregistrer offre
    const offreId = crypto.randomUUID()
    const referenceTransaction = `BLOC-${Date.now()}-${offreId.slice(0, 8)}`

    await prisma.$transaction(async (tx) => {
      // Création de l'offre
      await tx.offre.create({
        data: {
          id: offreId,
          enchereId,
          utilisateurId: user.id,
          montant: montantOffre,
          statut: StatutOffre.EN_ATTENTE,
          adresseIP: ip,
          userAgent,
        },
      })

      // Création de la garantie
      await tx.garantieFinanciere.create({
        data: {
          offreId,
          portefeuilleId: portefeuille.id,
          montantCaution: caution,
          pourcentageExige: enchere.pourcentageGarantie,
          statut: StatutGarantie.ACTIVE,
        },
      })

      // Blocage des fonds
      await tx.portefeuille.update({
        where: { id: portefeuille.id },
        data: {
          soldeDisponible: { decrement: caution },
          soldeBloque: { increment: caution },
        },
      })

      // Transaction de blocage
      await tx.transactionSPI.create({
        data: {
          portefeuilleId: portefeuille.id,
          reference: referenceTransaction,
          montant: caution,
          type: 'BLOCAGE',
          statut: StatutPaiement.BLOQUE,
          canal: 'SPI_BCEAO',
          metadata: { enchereId, offreId },
        },
      })

      // Mise à jour du montant actuel
      await tx.enchere.update({
        where: { id: enchereId },
        data: { montantActuel: montantOffre },
      })

      // Anciennes offres passent OUTBID
      await tx.offre.updateMany({
        where: {
          enchereId,
          id: { not: offreId },
          statut: { in: [StatutOffre.EN_ATTENTE, StatutOffre.ACCEPTEE] },
        },
        data: { statut: StatutOffre.OUTBID },
      })
    })

    // 8. Anti-sniping : si offre dans les 2 dernières minutes, prolonger de 2 min
    const msBeforeEnd = enchere.dateFin.getTime() - now.getTime()
    if (msBeforeEnd <= 2 * 60 * 1000 && msBeforeEnd > 0) {
      await prisma.enchere.update({
        where: { id: enchereId },
        data: {
          dateFin: new Date(enchere.dateFin.getTime() + 2 * 60 * 1000),
          statut: StatutEnchere.PROLONGEE,
        },
      })
    }

    // 9. Log audit complet
    await logAudit({
      utilisateurId: user.id,
      action: 'DEPOT_OFFRE',
      entite: 'Offre',
      entiteId: offreId,
      nouvelleValeur: {
        enchereId,
        montant: montantOffre.toString(),
        caution: caution.toString(),
      },
      adresseIP: ip,
      userAgent,
    })

    return NextResponse.json({ message: 'Offre enregistrée.' }, { status: 201 })
  } catch (error) {
    console.error('Erreur dépôt offre:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
