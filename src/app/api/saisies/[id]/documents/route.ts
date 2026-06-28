import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkApiRateLimit,
  getClientIP,
  getSessionOrUnauthorized,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { Role } from '@prisma/client'
import { createHash } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const ALLOWED_TYPES = ['PV_SAISIE', 'JUGEMENT', 'ORDONNANCE', 'EXPERTISE'] as const
const ALLOWED_FORMATS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/msword': 'DOCX',
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
}
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

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
  const { id } = await params

  if (!requirePermission(user.role, 'DOSSIER_LIRE')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const dossier = await prisma.dossierSaisie.findUnique({ where: { id } })
  if (!dossier) {
    return NextResponse.json({ error: 'Dossier introuvable.' }, { status: 404 })
  }

  const documents = await prisma.documentGED.findMany({
    where: { dossierId: id, archive: false },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: documents }, { status: 200 })
}

export async function POST(
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
  const { id } = await params
  const ip = getClientIP(request)

  if (!requirePermission(user.role, 'DOSSIER_CREER')) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'DocumentGED',
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const dossier = await prisma.dossierSaisie.findUnique({ where: { id } })
  if (!dossier) {
    return NextResponse.json({ error: 'Dossier introuvable.' }, { status: 404 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const typeDoc = formData.get('type') as string | null

    if (!file || !typeDoc) {
      return NextResponse.json(
        { error: 'Fichier et type de document requis.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(typeDoc as typeof ALLOWED_TYPES[number])) {
      return NextResponse.json(
        { error: `Type invalide. Types autorisés : ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const format = ALLOWED_FORMATS[file.type]
    if (!format) {
      return NextResponse.json(
        { error: `Format de fichier non autorisé : ${file.type}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 50 Mo).' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const hash = createHash('sha256').update(buffer).digest('hex')

    const uploadDir = join(process.cwd(), 'uploads', 'ged', id)
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop() ?? 'bin'
    const safeFilename = `${Date.now()}-${hash.slice(0, 8)}.${ext}`
    const filePath = join(uploadDir, safeFilename)
    await writeFile(filePath, buffer)

    const urlStockage = `/api/uploads/ged/${id}/${safeFilename}`

    const document = await prisma.documentGED.create({
      data: {
        dossierId: id,
        type: typeDoc,
        format,
        urlStockage,
        nomFichier: file.name,
        tailleFichier: file.size,
        hashSHA256: hash,
      },
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'UPLOAD_DOCUMENT',
      entite: 'DocumentGED',
      entiteId: document.id,
      nouvelleValeur: { type: typeDoc, format, nomFichier: file.name },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: document }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
