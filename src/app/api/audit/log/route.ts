import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const auditLogSchema = z.object({
  utilisateurId: z.string().uuid().optional(),
  action: z.string().min(1).max(100),
  entite: z.string().min(1).max(100),
  entiteId: z.string().uuid().optional(),
  ancienneValeur: z.record(z.string(), z.unknown()).optional(),
  nouvelleValeur: z.record(z.string(), z.unknown()).optional(),
  adresseIP: z.string().max(45).default('unknown'),
  userAgent: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Endpoint réservé aux appels internes (middleware). Protégé par un secret
    // partagé pour empêcher la falsification du journal d'audit depuis l'extérieur.
    const secret = process.env.AUDIT_INTERNAL_SECRET
    if (!secret || request.headers.get('x-audit-secret') !== secret) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = auditLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
    }

    const data = parsed.data

    await prisma.journalAudit.create({
      data: {
        utilisateurId: data.utilisateurId,
        action: data.action,
        entite: data.entite,
        entiteId: data.entiteId,
        ancienneValeur: (data.ancienneValeur ?? undefined) as Prisma.InputJsonValue | undefined,
        nouvelleValeur: (data.nouvelleValeur ?? undefined) as Prisma.InputJsonValue | undefined,
        adresseIP: data.adresseIP,
        userAgent: data.userAgent ?? null,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
