import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkApiRateLimit,
  getClientIP,
  getSessionOrUnauthorized,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const MEDIA_TYPES = ['PHOTO', 'VIDEO', 'VUE_360', 'VISITE_VIRTUELLE'] as const

const ALLOWED_MIME: Record<string, typeof MEDIA_TYPES[number][]> = {
  'image/jpeg': ['PHOTO', 'VUE_360'],
  'image/png': ['PHOTO', 'VUE_360'],
  'image/webp': ['PHOTO', 'VUE_360'],
  'video/mp4': ['VIDEO', 'VISITE_VIRTUELLE'],
  'video/webm': ['VIDEO', 'VISITE_VIRTUELLE'],
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB for video

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

  const { id } = await params

  const medias = await prisma.mediaHD.findMany({
    where: { bienId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: medias }, { status: 200 })
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
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const bien = await prisma.bienSaisi.findUnique({ where: { id } })
  if (!bien) {
    return NextResponse.json({ error: 'Bien introuvable.' }, { status: 404 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mediaType = formData.get('type') as string | null

    if (!file || !mediaType) {
      return NextResponse.json(
        { error: 'Fichier et type de média requis.' },
        { status: 400 }
      )
    }

    if (!MEDIA_TYPES.includes(mediaType as typeof MEDIA_TYPES[number])) {
      return NextResponse.json(
        { error: `Type invalide. Types autorisés : ${MEDIA_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const allowedTypes = ALLOWED_MIME[file.type]
    if (!allowedTypes || !allowedTypes.includes(mediaType as typeof MEDIA_TYPES[number])) {
      return NextResponse.json(
        { error: `Format ${file.type} non autorisé pour le type ${mediaType}.` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 100 Mo).' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const uploadDir = join(process.cwd(), 'uploads', 'medias', id)
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop() ?? 'bin'
    const safeFilename = `${Date.now()}-${mediaType.toLowerCase()}.${ext}`
    const filePath = join(uploadDir, safeFilename)
    await writeFile(filePath, buffer)

    const url = `/api/uploads/medias/${id}/${safeFilename}`

    const media = await prisma.mediaHD.create({
      data: {
        bienId: id,
        type: mediaType,
        url,
        vue360: mediaType === 'VUE_360',
      },
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'UPLOAD_MEDIA',
      entite: 'MediaHD',
      entiteId: media.id,
      nouvelleValeur: { type: mediaType, bienId: id },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: media }, { status: 201 })
  } catch (err) {
    console.error('[UPLOAD_MEDIA] Échec upload média pour bien', id, ':', err)
    const detail = err instanceof Error ? err.message : 'Erreur inconnue.'
    return NextResponse.json(
      { error: `Échec de l'enregistrement du média : ${detail}` },
      { status: 500 }
    )
  }
}
