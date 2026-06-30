import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role, Prisma } from '@prisma/client'
import {
  getSessionOrUnauthorized,
  getClientIP,
  logAudit,
  checkApiRateLimit,
  internalServerError,
} from '@/lib/api-helpers'
import { adminCreateUserSchema } from '@/lib/validators'
import { hashPassword } from '@/lib/security'
import { hasPermission } from '@/types'

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

export async function POST(req: NextRequest) {
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
    const parsed = adminCreateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const email = data.email.toLowerCase()

    const existing = await prisma.utilisateur.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Cette adresse email est déjà utilisée.' }, { status: 400 })
    }

    const motDePasseHash = await hashPassword(data.password)

    const user = await prisma.utilisateur.create({
      data: {
        email,
        motDePasseHash,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        role: data.role,
        numeroCNI: data.numeroCNI,
        numeroRCCM: data.numeroRCCM,
        raisonSociale: data.raisonSociale,
        numeroAgrement: data.numeroAgrement,
        jurisdiction: data.jurisdiction,
        posteAffectation: data.posteAffectation,
        compteVerifie: data.compteVerifie ?? true,
        mfaActif: false,
      },
      select: { id: true, email: true, role: true },
    })

    await logAudit({
      utilisateurId: session.user.id,
      action: 'CREATION_UTILISATEUR',
      entite: 'Utilisateur',
      entiteId: user.id,
      nouvelleValeur: { email: user.email, role: user.role },
      adresseIP: getClientIP(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'Cette adresse email est déjà utilisée.' }, { status: 400 })
    }
    console.error('Erreur utilisateurs POST:', err)
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

    const role = session.user.role as Role
    const isAdmin = role === Role.ADMINISTRATEUR
    const canValidate = hasPermission(role, 'COMPTE_VALIDER')

    // L'admin gère tout ; un détenteur de COMPTE_VALIDER (validateur KYC) ne peut que vérifier.
    if (!isAdmin && !canValidate) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const body = await req.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'ID et action requis.' }, { status: 400 })
    }

    if (!isAdmin && action !== 'verifier') {
      return NextResponse.json({ error: 'Action réservée à un administrateur.' }, { status: 403 })
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
