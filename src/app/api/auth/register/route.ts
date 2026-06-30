import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/security'
import { registerSchema } from '@/lib/validators'
import { Role, Prisma } from '@prisma/client'
import { checkRateLimit } from '@/lib/rate-limiter'

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  console.log('[REGISTER] Requête reçue depuis IP:', ip)

  const rate = await checkRateLimit(`register:${ip}`, 'authLimiter')
  if (!rate.allowed) {
    console.log('[REGISTER] Rate limit dépassé pour IP:', ip)
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    console.log('[REGISTER] Body reçu:', JSON.stringify({ ...body, password: '***' }))

    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      console.log('[REGISTER] Échec validation Zod:', JSON.stringify(parsed.error.flatten()))
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Sécurité : l'inscription publique ne peut créer que des comptes "grand public".
    // Tous les rôles internes (agent, magistrat, expert, admin…) passent obligatoirement
    // par la création d'utilisateur réservée à l'administrateur.
    const ROLES_PUBLICS: Role[] = [Role.CITOYEN, Role.ENTREPRISE]
    if (!ROLES_PUBLICS.includes(data.role as Role)) {
      console.warn('[REGISTER] Tentative de création de rôle non public:', data.role)
      return NextResponse.json(
        { error: "Ce rôle ne peut pas être créé via l'inscription. Contactez un administrateur." },
        { status: 403 }
      )
    }

    console.log('[REGISTER] Données validées pour:', data.email.toLowerCase())

    const existing = await prisma.utilisateur.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (existing) {
      console.log('[REGISTER] Email déjà existant:', data.email.toLowerCase())
      return NextResponse.json({ error: "L'inscription a échoué." }, { status: 400 })
    }

    const passwordHash = await hashPassword(data.password)
    console.log('[REGISTER] Hash mot de passe généré')

    console.log('[REGISTER] Appel prisma.utilisateur.create...')
    const user = await prisma.utilisateur.create({
      data: {
        email: data.email.toLowerCase(),
        motDePasseHash: passwordHash,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        role: data.role as Role,
        numeroCNI: data.numeroCNI,
        numeroRCCM: data.numeroRCCM,
        raisonSociale: data.raisonSociale,
        numeroAgrement: data.numeroAgrement,
        jurisdiction: data.jurisdiction,
        posteAffectation: data.posteAffectation,
        compteVerifie: false,
        mfaActif: false,
      },
    })
    console.log('[REGISTER] Utilisateur créé avec ID:', user.id)

    await prisma.journalAudit.create({
      data: {
        utilisateurId: user.id,
        action: 'INSCRIPTION',
        entite: 'Utilisateur',
        entiteId: user.id,
        nouvelleValeur: { role: user.role },
        adresseIP: ip,
        userAgent: request.headers.get('user-agent') ?? null,
      },
    })
    console.log('[REGISTER] Journal audit créé')

    return NextResponse.json(
      { message: 'Inscription réussie.', userId: user.id, email: user.email },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REGISTER] Erreur inscription:', error)

    let errorMessage = 'Erreur interne.'
    let errorCode = 'UNKNOWN'

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorCode = error.code
      if (error.code === 'P2002') {
        errorMessage = 'Cette adresse email est déjà utilisée.'
      } else if (error.code === 'P2025') {
        errorMessage = 'Enregistrement non trouvé.'
      } else {
        errorMessage = `Erreur base de données (${error.code}): ${error.message}`
      }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      errorCode = 'VALIDATION_ERROR'
      errorMessage = `Erreur de validation Prisma: ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json({ error: errorMessage, code: errorCode }, { status: 500 })
  }
}
