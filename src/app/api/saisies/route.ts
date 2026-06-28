import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkApiRateLimit,
  getClientIP,
  getSessionOrUnauthorized,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { dossierSaisieSchema } from '@/lib/validators'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = await getSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rateLimit = await checkApiRateLimit(request)
  if (rateLimit) return rateLimit

  const { user } = session
  const ip = getClientIP(request)

  if (!requirePermission(user.role, 'DOSSIER_LIRE')) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'DossierSaisie',
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    let where: Record<string, unknown> = {}

    if (user.role === Role.MAGISTRAT) {
      const utilisateur = await prisma.utilisateur.findUnique({
        where: { id: user.id },
        select: { jurisdiction: true },
      })
      where = {
        OR: [
          { magistratId: user.id },
          ...(utilisateur?.jurisdiction
            ? [{ jurisdictionCompetente: { equals: utilisateur.jurisdiction, mode: 'insensitive' } }]
            : []),
        ],
      }
    } else if (user.role === Role.CITOYEN || user.role === Role.ENTREPRISE) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const dossiers = await prisma.dossierSaisie.findMany({
      where,
      include: { agentAes: { select: { nom: true, prenom: true } }, biens: { take: 10 } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'LISTE_DOSSIERS',
      entite: 'DossierSaisie',
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: dossiers }, { status: 200 })
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

  if (!requirePermission(user.role, 'DOSSIER_CREER')) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'DossierSaisie',
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = dossierSaisieSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const existing = await prisma.dossierSaisie.findUnique({
      where: { referenceJudiciaire: data.referenceJudiciaire },
    })

    if (existing) {
      return NextResponse.json({ error: 'Référence judiciaire déjà utilisée.' }, { status: 409 })
    }

    const dossier = await prisma.dossierSaisie.create({
      data: {
        referenceJudiciaire: data.referenceJudiciaire,
        jurisdictionCompetente: data.jurisdictionCompetente,
        dateSaisie: new Date(data.dateSaisie),
        identiteProprietaire: data.identiteProprietaire,
        creancier: data.creancier,
        huissierInstrumentaire: data.huissierInstrumentaire,
        agentAesId: user.id,
        magistratId: data.magistratId,
      },
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'CREATION_DOSSIER',
      entite: 'DossierSaisie',
      entiteId: dossier.id,
      nouvelleValeur: { referenceJudiciaire: dossier.referenceJudiciaire },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: dossier }, { status: 201 })
  } catch (err) {
    console.error('POST /api/saisies error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
