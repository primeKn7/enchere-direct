import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSessionOrUnauthorized } from '@/lib/api-helpers'
import { hasPermission } from '@/types'
import { Role } from '@prisma/client'

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

// Sert les pièces KYC. Strictement réservé au propriétaire ou à un validateur KYC.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string; filename: string }> }
) {
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { userId, filename } = await params

  if (filename.includes('..') || userId.includes('..')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const role = session.user.role as Role
  const isOwner = session.user.id === userId
  const canReview = role === Role.ADMINISTRATEUR || hasPermission(role, 'COMPTE_VALIDER')
  if (!isOwner && !canReview) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const filePath = join(process.cwd(), 'uploads', 'kyc', userId, filename)

  try {
    const buffer = await readFile(filePath)
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 })
  }
}
