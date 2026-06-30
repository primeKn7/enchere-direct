import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkApiRateLimit,
  getClientIP,
  getSessionOrUnauthorized,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { enchereCreateSchema } from '@/lib/validators'
import { syncEncheresStatuts } from '@/lib/enchere-statut'
import { Role, StatutEnchere } from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rateLimit = await checkApiRateLimit(request)
  if (rateLimit) return rateLimit

  const { user } = session
  const ip = getClientIP(request)

  if (!requirePermission(user.role, 'ENCHERE_LIRE')) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'Enchere',
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    // Met à jour les statuts (démarrage / clôture) avant de lister.
    await syncEncheresStatuts()

    const mine = new URL(request.url).searchParams.get('mine') === 'true'

    let where: Record<string, unknown> = {}

    if (user.role === Role.CITOYEN || user.role === Role.ENTREPRISE) {
      where = mine
        ? // « Mes enchères » : celles où l'utilisateur a déposé au moins une offre.
          { offres: { some: { utilisateurId: user.id } } }
        : { statut: { in: [StatutEnchere.EN_COURS, StatutEnchere.PROLONGEE] }, lot: { publie: true } }
    } else if (user.role === Role.COMMISSAIRE_PRISEUR) {
      where = { commissairePriseurId: user.id }
    }
    // AGENT_AES et ADMINISTRATEUR voient tout

    const encheres = await prisma.enchere.findMany({
      where,
      include: {
        lot: { include: { bien: { select: { description: true, valeurEstimee: true, localisation: true } } } },
        commissairePriseur: { select: { nom: true, prenom: true } },
      },
      orderBy: { dateDebut: 'desc' },
      take: 100,
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'LISTE_ENCHERES',
      entite: 'Enchere',
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: encheres }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rateLimit = await checkApiRateLimit(request)
  if (rateLimit) return rateLimit

  const { user } = session
  const ip = getClientIP(request)

  if (!requirePermission(user.role, 'ENCHERE_CREER')) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'Enchere',
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = enchereCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const lot = await prisma.lot.findUnique({
      where: { id: data.lotId },
      include: { bien: true, enchere: true },
    })

    if (!lot) {
      return NextResponse.json({ error: 'Lot introuvable.' }, { status: 404 })
    }

    if (lot.enchere) {
      return NextResponse.json({ error: 'Une enchère existe déjà pour ce lot.' }, { status: 409 })
    }

    const dateDebut = new Date(data.dateDebut)
    const dateFin = new Date(data.dateFin)
    const reserve = typeof data.montantReserve === 'string' ? parseFloat(data.montantReserve) : data.montantReserve

    const enchere = await prisma.enchere.create({
      data: {
        lotId: data.lotId,
        commissairePriseurId: user.id,
        type: data.type,
        dateDebut,
        dateFin,
        montantActuel: lot.prixDepart,
        montantReserve: reserve,
        pourcentageGarantie: data.pourcentageGarantie,
        antiSnipingDelai: data.antiSnipingDelai,
        statut: dateDebut <= new Date() && dateFin > new Date() ? StatutEnchere.EN_COURS : StatutEnchere.PLANIFIEE,
      },
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'CREATION_ENCHERE',
      entite: 'Enchere',
      entiteId: enchere.id,
      nouvelleValeur: { lotId: enchere.lotId, type: enchere.type },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: enchere }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
