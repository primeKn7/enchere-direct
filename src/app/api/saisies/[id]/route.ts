import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkApiRateLimit,
  getClientIP,
  getSessionOrUnauthorized,
  logAudit,
  requirePermission,
} from '@/lib/api-helpers'
import { updateDossierSchema } from '@/lib/validators'
import { transitionsAutorisees } from '@/lib/dossier-statuts'
import { Role } from '@prisma/client'

async function canAccessDossier(userId: string, role: Role, dossierId: string): Promise<boolean> {
  const dossier = await prisma.dossierSaisie.findUnique({
    where: { id: dossierId },
    select: { jurisdictionCompetente: true },
  })

  if (!dossier) return false

  if (role === Role.AGENT_AES || role === Role.ADMINISTRATEUR) return true

  if (role === Role.MAGISTRAT) {
    const magistrat = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { jurisdiction: true },
    })
    return magistrat?.jurisdiction === dossier.jurisdictionCompetente
  }

  return false
}

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

  if (!requirePermission(user.role, 'DOSSIER_LIRE')) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'DossierSaisie',
      entiteId: id,
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const accessible = await canAccessDossier(user.id, user.role, id)
    if (!accessible) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const dossier = await prisma.dossierSaisie.findUnique({
      where: { id },
      include: {
        agentAes: { select: { nom: true, prenom: true } },
        documents: true,
        biens: { include: { medias: true, estimationIA: true } },
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier introuvable.' }, { status: 404 })
    }

    await logAudit({
      utilisateurId: user.id,
      action: 'LECTURE_DOSSIER',
      entite: 'DossierSaisie',
      entiteId: id,
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: dossier }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

export async function PATCH(
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

  if (!requirePermission(user.role, 'DOSSIER_MODIFIER')) {
    await logAudit({
      utilisateurId: user.id,
      action: 'ACCES_REFUSE',
      entite: 'DossierSaisie',
      entiteId: id,
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const accessible = await canAccessDossier(user.id, user.role, id)
    if (!accessible) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateDossierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const ancien = await prisma.dossierSaisie.findUnique({
      where: { id },
      select: { statut: true },
    })
    if (!ancien) {
      return NextResponse.json({ error: 'Dossier introuvable.' }, { status: 404 })
    }

    // Transition de statut non autorisée pour ce rôle depuis le statut courant.
    if (
      parsed.data.statut !== ancien.statut &&
      !transitionsAutorisees(user.role, ancien.statut).includes(parsed.data.statut)
    ) {
      await logAudit({
        utilisateurId: user.id,
        action: 'TRANSITION_REFUSEE',
        entite: 'DossierSaisie',
        entiteId: id,
        ancienneValeur: { statut: ancien.statut },
        nouvelleValeur: { statut: parsed.data.statut },
        adresseIP: ip,
        userAgent: request.headers.get('user-agent') ?? undefined,
      })
      return NextResponse.json({ error: 'Transition de statut non autorisée.' }, { status: 403 })
    }

    const updated = await prisma.dossierSaisie.update({
      where: { id },
      data: { statut: parsed.data.statut },
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'MODIFICATION_STATUT_DOSSIER',
      entite: 'DossierSaisie',
      entiteId: id,
      ancienneValeur: { statut: ancien?.statut },
      nouvelleValeur: { statut: updated.statut },
      adresseIP: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
