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
import { hasPermission } from '@/types'

// PATCH : un validateur KYC (ou admin) valide ou rejette une demande.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrUnauthorized()
    if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    const rateRes = await checkApiRateLimit(req)
    if (rateRes) return rateRes

    const role = session.user.role as Role
    if (role !== Role.ADMINISTRATEUR && !hasPermission(role, 'COMPTE_VALIDER')) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { action, motifRejet } = body as { action?: string; motifRejet?: string }

    const demande = await prisma.demandeKYC.findUnique({ where: { id } })
    if (!demande) {
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    }

    if (action === 'valider') {
      // Marque la demande validée ET vérifie le compte de l'utilisateur.
      await prisma.$transaction([
        prisma.demandeKYC.update({
          where: { id },
          data: {
            statut: 'VALIDE',
            motifRejet: null,
            traiteParId: session.user.id,
            dateTraitement: new Date(),
          },
        }),
        prisma.utilisateur.update({
          where: { id: demande.utilisateurId },
          data: { compteVerifie: true },
        }),
      ])
    } else if (action === 'rejeter') {
      if (!motifRejet || !motifRejet.trim()) {
        return NextResponse.json({ error: 'Motif de rejet requis.' }, { status: 400 })
      }
      await prisma.demandeKYC.update({
        where: { id },
        data: {
          statut: 'REJETE',
          motifRejet: motifRejet.trim(),
          traiteParId: session.user.id,
          dateTraitement: new Date(),
        },
      })
    } else {
      return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })
    }

    await logAudit({
      utilisateurId: session.user.id,
      action: action === 'valider' ? 'VALIDATION_KYC' : 'REJET_KYC',
      entite: 'DemandeKYC',
      entiteId: id,
      nouvelleValeur: { statut: action === 'valider' ? 'VALIDE' : 'REJETE' },
      adresseIP: getClientIP(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erreur KYC PATCH:', err)
    return internalServerError()
  }
}
