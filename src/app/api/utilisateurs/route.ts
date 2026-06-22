import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import {
  getSessionOrUnauthorized,
  getClientIP,
  logAudit,
  checkApiRateLimit,
  internalServerError,
} from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const rateRes = await checkApiRateLimit(req)
    if (rateRes) return rateRes

    const session = await getSessionOrUnauthorized()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    if ((session.user.role as Role) !== Role.ADMINISTRATEUR) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get('role')
    const search = searchParams.get('q')

    const where: Record<string, unknown> = {}
    if (roleFilter && Object.values(Role).includes(roleFilter as Role)) {
      where.role = roleFilter
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
      ]
    }

    const utilisateurs = await prisma.utilisateur.findMany({
      where,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        compteVerifie: true,
        compteBloque: true,
        mfaActif: true,
        tentativesEchec: true,
        derniereConnexion: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json(utilisateurs)
  } catch (err) {
    console.error('Erreur utilisateurs GET:', err)
    return internalServerError()
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const rateRes = await checkApiRateLimit(req)
    if (rateRes) return rateRes

    const session = await getSessionOrUnauthorized()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    if ((session.user.role as Role) !== Role.ADMINISTRATEUR) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const body = await req.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'ID et action requis.' }, { status: 400 })
    }

    const user = await prisma.utilisateur.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
    }

    if (user.id === session.user.id) {
      return NextResponse.json({ error: 'Impossible de modifier votre propre compte.' }, { status: 400 })
    }

    let data: Record<string, unknown> = {}
    let actionLabel = ''

    switch (action) {
      case 'bloquer':
        data = { compteBloque: true }
        actionLabel = 'BLOCAGE_UTILISATEUR'
        break
      case 'debloquer':
        data = { compteBloque: false, tentativesEchec: 0 }
        actionLabel = 'DEBLOCAGE_UTILISATEUR'
        break
      case 'verifier':
        data = { compteVerifie: true }
        actionLabel = 'VERIFICATION_UTILISATEUR'
        break
      case 'resetMfa':
        data = { mfaActif: false }
        actionLabel = 'RESET_MFA_UTILISATEUR'
        break
      default:
        return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })
    }

    const updated = await prisma.utilisateur.update({ where: { id }, data })

    await logAudit({
      utilisateurId: session.user.id,
      action: actionLabel,
      entite: 'Utilisateur',
      entiteId: id,
      ancienneValeur: { compteBloque: user.compteBloque, compteVerifie: user.compteVerifie, mfaActif: user.mfaActif },
      nouvelleValeur: data as Record<string, string | number | boolean>,
      adresseIP: getClientIP(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      compteBloque: updated.compteBloque,
      compteVerifie: updated.compteVerifie,
      mfaActif: updated.mfaActif,
    })
  } catch (err) {
    console.error('Erreur utilisateurs PATCH:', err)
    return internalServerError()
  }
}
