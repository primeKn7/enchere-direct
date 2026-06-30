import { NextRequest, NextResponse } from 'next/server'
import {
  Prisma,
  StatutEnchere,
  StatutOffre,
  StatutGarantie,
  StatutPaiement,
  TypeEnchere,
  Role,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  checkApiRateLimit,
  getClientIP,
  getSessionOrUnauthorized,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { offreSchema } from '@/lib/validators'
import { prixDescendant } from '@/lib/encheres'
import { syncEncheresStatuts } from '@/lib/enchere-statut'

const D = (v: Prisma.Decimal | number | string) => new Prisma.Decimal(v)

/**
 * Cascade de surenchères automatiques (proxy bidding) pour une enchère ascendante.
 * Tant qu'un mandataire automatique d'un autre utilisateur a un plafond supérieur
 * au montant courant, il contre-enchérit d'un incrément (plafonné), fonds bloqués.
 */
async function resoudreSurencheres(
  enchereId: string,
  pourcentageGarantie: number,
  leaderInitial: string
) {
  let leader = leaderInitial
  for (let i = 0; i < 20; i++) {
    const enchere = await prisma.enchere.findUnique({ where: { id: enchereId } })
    if (!enchere) break
    const current = D(enchere.montantActuel)

    const autos = await prisma.surenchereAuto.findMany({
      where: {
        actif: true,
        plafondMaximal: { gt: current },
        offre: {
          enchereId,
          utilisateurId: { not: leader },
          statut: { in: [StatutOffre.OUTBID, StatutOffre.EN_ATTENTE] },
        },
      },
      include: { offre: true },
      orderBy: { plafondMaximal: 'desc' },
      take: 1,
    })
    if (autos.length === 0) break

    const top = autos[0]
    const proposition = Prisma.Decimal.min(D(top.plafondMaximal), current.add(D(top.increment)))
    if (proposition.lessThanOrEqualTo(current)) break

    const caution = proposition.mul(pourcentageGarantie).div(100)
    const pf = await prisma.portefeuille.findUnique({
      where: { utilisateurId: top.offre.utilisateurId },
    })
    if (!pf || D(pf.soldeDisponible).lessThan(caution)) {
      // Mandataire insolvable : on le désactive et on continue.
      await prisma.surenchereAuto.update({ where: { id: top.id }, data: { actif: false } })
      continue
    }

    const offreId = crypto.randomUUID()
    await prisma.$transaction(async (tx) => {
      await tx.offre.create({
        data: {
          id: offreId,
          enchereId,
          utilisateurId: top.offre.utilisateurId,
          montant: proposition,
          statut: StatutOffre.EN_ATTENTE,
          adresseIP: 'auto',
          userAgent: 'surenchere-auto',
        },
      })
      await tx.garantieFinanciere.create({
        data: {
          offreId,
          portefeuilleId: pf.id,
          montantCaution: caution,
          pourcentageExige: pourcentageGarantie,
          statut: StatutGarantie.ACTIVE,
        },
      })
      await tx.portefeuille.update({
        where: { id: pf.id },
        data: { soldeDisponible: { decrement: caution }, soldeBloque: { increment: caution } },
      })
      await tx.transactionSPI.create({
        data: {
          portefeuilleId: pf.id,
          reference: `BLOC-AUTO-${Date.now()}-${offreId.slice(0, 8)}`,
          montant: caution,
          type: 'BLOCAGE',
          statut: StatutPaiement.BLOQUE,
          canal: 'SPI_BCEAO',
          metadata: { enchereId, offreId, auto: true },
        },
      })
      await tx.enchere.update({ where: { id: enchereId }, data: { montantActuel: proposition } })
      await tx.offre.updateMany({
        where: {
          enchereId,
          id: { not: offreId },
          statut: { in: [StatutOffre.EN_ATTENTE, StatutOffre.ACCEPTEE] },
        },
        data: { statut: StatutOffre.OUTBID },
      })
    })

    await logAudit({
      utilisateurId: top.offre.utilisateurId,
      action: 'SURENCHERE_AUTO',
      entite: 'Offre',
      entiteId: offreId,
      nouvelleValeur: { enchereId, montant: proposition.toString() },
      adresseIP: 'auto',
      userAgent: 'surenchere-auto',
    })

    leader = top.offre.utilisateurId
  }
}

// ─── GET : historique d'audit nominatif des offres ───────────────────────────
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
  const { id: enchereId } = await params

  if (!requirePermission(user.role, 'ENCHERE_LIRE')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const enchere = await prisma.enchere.findUnique({ where: { id: enchereId } })
  if (!enchere) {
    return NextResponse.json({ error: 'Enchère introuvable.' }, { status: 404 })
  }

  const estSuperviseur =
    user.role === Role.ADMINISTRATEUR ||
    user.role === Role.AGENT_AES ||
    (user.role === Role.COMMISSAIRE_PRISEUR && enchere.commissairePriseurId === user.id)

  // Offres scellées : tant que l'enchère n'est pas clôturée, seuls les
  // superviseurs voient les montants ; chaque enchérisseur ne voit que les siens.
  const scelleeMasquee =
    enchere.type === TypeEnchere.SCELLEE && enchere.statut !== StatutEnchere.CLOTUREE

  const offres = await prisma.offre.findMany({
    where: estSuperviseur ? { enchereId } : { enchereId, utilisateurId: user.id },
    include: { utilisateur: { select: { nom: true, prenom: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const data = offres.map((o) => {
    const propre = o.utilisateurId === user.id
    const masquer = scelleeMasquee && !estSuperviseur && !propre
    return {
      id: o.id,
      encherisseur: estSuperviseur || propre ? `${o.utilisateur.prenom} ${o.utilisateur.nom}` : 'Enchérisseur',
      montant: masquer ? null : o.montant.toString(),
      statut: o.statut,
      adresseIP: estSuperviseur ? o.adresseIP : propre ? o.adresseIP : null,
      auto: o.userAgent === 'surenchere-auto',
      createdAt: o.createdAt,
    }
  })

  return NextResponse.json({ data, supervision: estSuperviseur }, { status: 200 })
}

// ─── POST : dépôt d'une offre (selon le type d'enchère) ──────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const offreRate = await checkApiRateLimit(request)
  if (offreRate) return offreRate

  const offreByUser = await import('@/lib/rate-limiter').then((m) =>
    m.checkRateLimit(`offre:${user.id}`, 'offreLimiter')
  )
  if (!offreByUser.allowed) {
    return NextResponse.json({ error: "Trop d'offres. Réessayez plus tard." }, { status: 429 })
  }

  try {
    // Synchronise les statuts (démarrage / clôture) avant de traiter l'offre.
    await syncEncheresStatuts()

    const body = await request.json()
    const parsed = offreSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const montant = D(parsed.data.montant)
    const auto = parsed.data.surenchereAuto

    const enchere = await prisma.enchere.findUnique({
      where: { id: enchereId },
      include: { lot: true },
    })
    if (!enchere) {
      return NextResponse.json({ error: 'Enchère introuvable.' }, { status: 404 })
    }

    // Conflit d'intérêts : le commissaire-priseur de l'enchère ne peut pas y enchérir.
    if (enchere.commissairePriseurId === user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas enchérir sur une enchère que vous gérez." },
        { status: 403 }
      )
    }

    // KYC obligatoire pour enchérir + compte non bloqué (lu en base, pas dans le token).
    const enicherisseur = await prisma.utilisateur.findUnique({
      where: { id: user.id },
      select: { compteVerifie: true, compteBloque: true },
    })
    if (!enicherisseur || enicherisseur.compteBloque) {
      return NextResponse.json({ error: 'Compte bloqué.' }, { status: 403 })
    }
    if (!enicherisseur.compteVerifie) {
      return NextResponse.json(
        { error: 'Vous devez vérifier votre identité (KYC) avant d’enchérir.' },
        { status: 403 }
      )
    }

    const now = new Date()
    if (
      enchere.dateDebut > now ||
      enchere.dateFin < now ||
      (enchere.statut !== StatutEnchere.EN_COURS && enchere.statut !== StatutEnchere.PROLONGEE)
    ) {
      return NextResponse.json({ error: 'Enchère non active.' }, { status: 400 })
    }

    // ── Validation du montant selon le type ──────────────────────────────────
    let cloture = false // descendante / vente directe : l'offre clôture l'enchère
    let majMontantActuel = true // scellée : on ne révèle pas le montant courant
    let outbidAutres = true // scellée : pas d'OUTBID (offres indépendantes)

    switch (enchere.type) {
      case TypeEnchere.ASCENDANTE: {
        if (montant.lessThanOrEqualTo(D(enchere.montantActuel))) {
          return NextResponse.json(
            { error: 'Le montant doit être supérieur au montant actuel.' },
            { status: 400 }
          )
        }
        break
      }
      case TypeEnchere.SCELLEE: {
        if (montant.lessThan(D(enchere.montantReserve))) {
          return NextResponse.json(
            { error: 'Le montant doit atteindre le prix de réserve.' },
            { status: 400 }
          )
        }
        majMontantActuel = false
        outbidAutres = false
        break
      }
      case TypeEnchere.DESCENDANTE: {
        const prixCourant = prixDescendant({
          prixDepart: enchere.lot.prixDepart,
          montantReserve: enchere.montantReserve,
          dateDebut: enchere.dateDebut,
          dateFin: enchere.dateFin,
          now,
        })
        if (montant.lessThan(D(prixCourant))) {
          return NextResponse.json(
            { error: `Le montant doit atteindre le prix courant au cadran (${prixCourant.toLocaleString('fr-FR')} FCFA).` },
            { status: 400 }
          )
        }
        cloture = true
        break
      }
      case TypeEnchere.VENTE_DIRECTE: {
        const prixFixe = D(enchere.lot.prixDepart)
        if (montant.lessThan(prixFixe)) {
          return NextResponse.json(
            { error: `Le prix d'achat est de ${prixFixe.toNumber().toLocaleString('fr-FR')} FCFA.` },
            { status: 400 }
          )
        }
        cloture = true
        break
      }
    }

    // ── Garantie financière ──────────────────────────────────────────────────
    const caution = montant.mul(enchere.pourcentageGarantie).div(100)
    const portefeuille = await prisma.portefeuille.findUnique({
      where: { utilisateurId: user.id },
    })
    if (!portefeuille || D(portefeuille.soldeDisponible).lessThan(caution)) {
      return NextResponse.json({ error: 'Garantie financière insuffisante.' }, { status: 402 })
    }

    const offreId = crypto.randomUUID()
    const reference = `BLOC-${Date.now()}-${offreId.slice(0, 8)}`

    await prisma.$transaction(async (tx) => {
      await tx.offre.create({
        data: {
          id: offreId,
          enchereId,
          utilisateurId: user.id,
          montant,
          statut: cloture ? StatutOffre.GAGNANTE : StatutOffre.EN_ATTENTE,
          adresseIP: ip,
          userAgent,
        },
      })
      await tx.garantieFinanciere.create({
        data: {
          offreId,
          portefeuilleId: portefeuille.id,
          montantCaution: caution,
          pourcentageExige: enchere.pourcentageGarantie,
          statut: StatutGarantie.ACTIVE,
        },
      })
      await tx.portefeuille.update({
        where: { id: portefeuille.id },
        data: { soldeDisponible: { decrement: caution }, soldeBloque: { increment: caution } },
      })
      await tx.transactionSPI.create({
        data: {
          portefeuilleId: portefeuille.id,
          reference,
          montant: caution,
          type: 'BLOCAGE',
          statut: StatutPaiement.BLOQUE,
          canal: 'SPI_BCEAO',
          metadata: { enchereId, offreId },
        },
      })

      if (majMontantActuel) {
        await tx.enchere.update({ where: { id: enchereId }, data: { montantActuel: montant } })
      }
      if (outbidAutres) {
        await tx.offre.updateMany({
          where: {
            enchereId,
            id: { not: offreId },
            statut: { in: [StatutOffre.EN_ATTENTE, StatutOffre.ACCEPTEE] },
          },
          data: { statut: StatutOffre.OUTBID },
        })
      }
      if (cloture) {
        await tx.enchere.update({ where: { id: enchereId }, data: { statut: StatutEnchere.CLOTUREE } })
      }
      // Surenchère automatique (mandat de l'utilisateur)
      if (auto) {
        await tx.surenchereAuto.create({
          data: {
            offreId,
            plafondMaximal: D(auto.plafondMaximal),
            increment: D(auto.increment),
            actif: true,
          },
        })
      }
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'DEPOT_OFFRE',
      entite: 'Offre',
      entiteId: offreId,
      nouvelleValeur: {
        enchereId,
        type: enchere.type,
        montant: montant.toString(),
        caution: caution.toString(),
        surenchereAuto: auto ? { plafond: String(auto.plafondMaximal), increment: String(auto.increment) } : null,
      },
      adresseIP: ip,
      userAgent,
    })

    // ── Surenchères automatiques + anti-sniping (enchères ouvertes seulement) ──
    if (!cloture && enchere.type === TypeEnchere.ASCENDANTE) {
      await resoudreSurencheres(enchereId, enchere.pourcentageGarantie, user.id)
    }

    if (!cloture) {
      // Anti-sniping : prolongation si l'offre arrive dans les dernières secondes.
      const delaiMs = (enchere.antiSnipingDelai ?? 120) * 1000
      const restantMs = enchere.dateFin.getTime() - now.getTime()
      if (restantMs > 0 && restantMs <= delaiMs) {
        await prisma.enchere.update({
          where: { id: enchereId },
          data: {
            dateFin: new Date(enchere.dateFin.getTime() + delaiMs),
            statut: StatutEnchere.PROLONGEE,
          },
        })
        await logAudit({
          utilisateurId: user.id,
          action: 'ANTI_SNIPING_PROLONGATION',
          entite: 'Enchere',
          entiteId: enchereId,
          nouvelleValeur: { delaiSecondes: enchere.antiSnipingDelai ?? 120 },
          adresseIP: ip,
          userAgent,
        })
      }
    }

    return NextResponse.json(
      { message: cloture ? 'Lot adjugé.' : 'Offre enregistrée.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur dépôt offre:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
