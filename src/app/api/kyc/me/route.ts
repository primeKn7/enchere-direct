import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionOrUnauthorized, internalServerError } from '@/lib/api-helpers'

// GET : statut de la demande KYC de l'utilisateur courant (ou null).
export async function GET() {
  try {
    const session = await getSessionOrUnauthorized()
    if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    // On lit compteVerifie en base (le token de session peut être périmé juste
    // après une validation par un administrateur).
    const [demande, utilisateur] = await Promise.all([
      prisma.demandeKYC.findUnique({
        where: { utilisateurId: session.user.id },
        select: { statut: true, motifRejet: true, createdAt: true, dateTraitement: true },
      }),
      prisma.utilisateur.findUnique({
        where: { id: session.user.id },
        select: { compteVerifie: true },
      }),
    ])

    return NextResponse.json({ demande, compteVerifie: utilisateur?.compteVerifie ?? false })
  } catch (err) {
    console.error('Erreur KYC me GET:', err)
    return internalServerError()
  }
}
