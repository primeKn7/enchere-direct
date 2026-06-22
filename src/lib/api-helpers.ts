import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, Permission, Role } from '@/types'
import { checkRateLimit } from '@/lib/rate-limiter'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export async function getSessionOrUnauthorized() {
  const session = await auth()
  if (!session?.user?.id || !session.user.role) {
    return null
  }
  return session
}

export function requirePermission(role: Role, permission: Permission) {
  return hasPermission(role, permission)
}

export function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
}

export async function logAudit(params: {
  utilisateurId?: string
  action: string
  entite: string
  entiteId?: string
  ancienneValeur?: Prisma.InputJsonValue
  nouvelleValeur?: Prisma.InputJsonValue
  adresseIP: string
  userAgent?: string
}) {
  try {
    await prisma.journalAudit.create({
      data: {
        ...params,
        ancienneValeur: params.ancienneValeur ?? undefined,
        nouvelleValeur: params.nouvelleValeur ?? undefined,
        userAgent: params.userAgent ?? null,
      },
    })
  } catch (err) {
    console.error('Échec log audit:', err)
  }
}

export async function checkApiRateLimit(req: NextRequest) {
  const ip = getClientIP(req)
  const rate = await checkRateLimit(`api:${ip}`, 'apiLimiter')
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }
  return null
}

export function formatZodError(error: ZodError) {
  return error.flatten()
}

export function internalServerError() {
  return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
}
