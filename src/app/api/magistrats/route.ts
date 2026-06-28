import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import {
  getSessionOrUnauthorized,
  checkApiRateLimit,
  requirePermission,
} from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rateLimit = await checkApiRateLimit(req)
  if (rateLimit) return rateLimit

  if (!requirePermission(session.user.role, 'DOSSIER_CREER')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const magistrats = await prisma.utilisateur.findMany({
    where: { role: Role.MAGISTRAT, compteBloque: false },
    select: {
      id: true,
      nom: true,
      prenom: true,
      jurisdiction: true,
    },
    orderBy: { nom: 'asc' },
  })

  return NextResponse.json({ data: magistrats }, { status: 200 })
}
