import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkApiRateLimit,
  getClientIP,
  getSessionOrUnauthorized,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { bienSaisiSchema } from '@/lib/validators'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'
import { Role } from '@prisma/client'

function generateBarcode(): string {
  const prefix = 'ENC'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export async function GET(request: NextRequest) {
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rateLimit = await checkApiRateLimit(request)
  if (rateLimit) return rateLimit

  const { user } = session

  if (!requirePermission(user.role, 'DOSSIER_LIRE')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const url = new URL(request.url)
  const dossierId = url.searchParams.get('dossierId')

  const where = dossierId ? { dossierId } : {}

  const biens = await prisma.bienSaisi.findMany({
    where,
    include: {
      dossier: { select: { referenceJudiciaire: true } },
      lot: { select: { publie: true } },
      medias: { select: { id: true, type: true } },
      _count: { select: { medias: true, expertises: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ data: biens }, { status: 200 })
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

  const canCreateBien =
    requirePermission(user.role, 'DOSSIER_CREER') || user.role === Role.COMMISSAIRE_PRISEUR
  if (!canCreateBien) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'BienSaisi',
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = bienSaisiSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const dossier = await prisma.dossierSaisie.findUnique({
      where: { id: data.dossierId },
    })
    if (!dossier) {
      return NextResponse.json({ error: 'Dossier introuvable.' }, { status: 404 })
    }

    const bienId = uuidv4()
    const codeBarre = generateBarcode()
    const qrCodeId = `QR-${bienId.slice(0, 8).toUpperCase()}`

    const qrPayload = JSON.stringify({
      id: bienId,
      ref: dossier.referenceJudiciaire,
      cat: data.categorie,
    })
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H',
    })

    const bien = await prisma.bienSaisi.create({
      data: {
        id: bienId,
        dossierId: data.dossierId,
        categorie: data.categorie,
        sousCategorie: data.sousCategorie,
        description: data.description,
        valeurEstimee: data.valeurEstimee,
        localisation: data.localisation,
        etatGeneral: data.etatGeneral,
        qrCode: qrCodeId,
        qrCodeDataUrl,
        codeBarre,
        rfid: data.rfid || null,
      },
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'CREATION_BIEN',
      entite: 'BienSaisi',
      entiteId: bien.id,
      nouvelleValeur: { categorie: bien.categorie, codeBarre },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: bien }, { status: 201 })
  } catch (err) {
    console.error('POST /api/biens error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
