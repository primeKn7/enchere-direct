import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSessionOrUnauthorized } from '@/lib/api-helpers'
import { canAccessDossier } from '@/lib/dossier-access'
import { Role } from '@prisma/client'

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dossierId: string; filename: string }> }
) {
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { dossierId, filename } = await params

  if (filename.includes('..') || dossierId.includes('..')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Les pièces GED sont des documents judiciaires : on vérifie que l'utilisateur
  // a bien accès à ce dossier (agent/admin, ou magistrat de la juridiction).
  const accessible = await canAccessDossier(session.user.id, session.user.role as Role, dossierId)
  if (!accessible) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const filePath = join(process.cwd(), 'uploads', 'ged', dossierId, filename)

  try {
    const buffer = await readFile(filePath)
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 })
  }
}
