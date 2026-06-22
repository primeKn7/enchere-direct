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

    const { searchParams } = new URL(req.url)
    const publieOnly = searchParams.get('publie') === 'true'

    const lots = await prisma.lot.findMany({
      where: publieOnly ? { publie: true } : {},
      include: {
        bien: {
          select: {
            description: true,
            categorie: true,
            localisation: true,
            valeurEstimee: true,
            medias: { take: 1, select: { url: true } },
          },
        },
        enchere: { select: { id: true, statut: true, montantActuel: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(lots)
  } catch (err) {
    console.error('Erreur lots GET:', err)
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

    const role = session.user.role as Role
    if (role !== Role.AGENT_AES && role !== Role.COMMISSAIRE_PRISEUR && role !== Role.ADMINISTRATEUR) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const body = await req.json()
    const { bienId, prixDepart, typeEnchere } = body

    if (!bienId || !prixDepart || !typeEnchere) {
      return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
    }

    const typesValides = ['ASCENDANTE', 'DESCENDANTE', 'SCELLEE', 'VENTE_DIRECTE']
    if (!typesValides.includes(typeEnchere)) {
      return NextResponse.json({ error: 'Type d\'enchère invalide.' }, { status: 400 })
    }

    const bien = await prisma.bienSaisi.findUnique({
      where: { id: bienId },
      include: { lot: true, dossier: { select: { statut: true } } },
    })

    if (!bien) {
      return NextResponse.json({ error: 'Bien introuvable.' }, { status: 404 })
    }

    if (bien.lot) {
      return NextResponse.json({ error: 'Ce bien a déjà un lot associé.' }, { status: 409 })
    }

    if (bien.dossier.statut !== 'VALIDE') {
      return NextResponse.json({ error: 'Le dossier de saisie doit être validé.' }, { status: 400 })
    }

    const count = await prisma.lot.count()
    const numeroLot = `LOT-${String(count + 1).padStart(6, '0')}`

    const lot = await prisma.lot.create({
      data: {
        bienId,
        numeroLot,
        prixDepart,
        typeEnchere,
        publie: false,
      },
    })

    await logAudit({
      utilisateurId: session.user.id,
      action: 'CREATION_LOT',
      entite: 'Lot',
      entiteId: lot.id,
      nouvelleValeur: { numeroLot, bienId, prixDepart, typeEnchere },
      adresseIP: getClientIP(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json(lot, { status: 201 })
  } catch (err) {
    console.error('Erreur lots POST:', err)
    return internalServerError()
  }
}
