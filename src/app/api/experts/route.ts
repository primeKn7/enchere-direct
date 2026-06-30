import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import {
  getSessionOrUnauthorized,
  checkApiRateLimit,
  requirePermission,
} from '@/lib/api-helpers'

// Liste des experts agréés (pour l'affectation) avec leur note moyenne.
export async function GET(req: NextRequest) {
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rateLimit = await checkApiRateLimit(req)
  if (rateLimit) return rateLimit

  if (!requirePermission(session.user.role, 'EXPERTISE_AFFECTER')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const experts = await prisma.utilisateur.findMany({
    where: { role: Role.EXPERT, compteBloque: false },
    select: {
      id: true,
      nom: true,
      prenom: true,
      numeroAgrement: true,
      notationsRecues: { select: { note: true } },
      _count: { select: { affectationsExpert: true } },
    },
    orderBy: { nom: 'asc' },
  })

  const data = experts.map((e) => {
    const notes = e.notationsRecues.map((n) => n.note)
    const noteMoyenne =
      notes.length > 0 ? Number((notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1)) : null
    return {
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      numeroAgrement: e.numeroAgrement,
      noteMoyenne,
      nbNotations: notes.length,
      nbAffectations: e._count.affectationsExpert,
    }
  })

  return NextResponse.json({ data }, { status: 200 })
}
