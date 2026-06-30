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
import { syncEncheresStatuts } from '@/lib/enchere-statut'

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
  const ip = getClientIP(request)

  if (!requirePermission(user.role, 'ENCHERE_LIRE')) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'Enchere',
      entiteId: id,
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    await syncEncheresStatuts()

    const enchere = await prisma.enchere.findUnique({
      where: { id },
      include: {
        lot: {
          include: {
            bien: {
              select: {
                description: true,
                localisation: true,
                valeurEstimee: true,
                medias: { take: 5 },
              },
            },
          },
        },
        commissairePriseur: { select: { nom: true, prenom: true } },
      },
    })

    if (!enchere) {
      return NextResponse.json({ error: 'Enchère introuvable.' }, { status: 404 })
    }

    // Pour les citoyens/entreprises, l'enchère doit être publiée et active
    if (
      (user.role === Role.CITOYEN || user.role === Role.ENTREPRISE) &&
      (!enchere.lot.publie ||
        (enchere.statut !== 'EN_COURS' && enchere.statut !== 'PROLONGEE'))
    ) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await logAudit({
      utilisateurId: user.id,
      action: 'LECTURE_ENCHERE',
      entite: 'Enchere',
      entiteId: id,
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: enchere }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
