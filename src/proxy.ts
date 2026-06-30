import { auth } from '@/lib/auth'
import { SECURITY_HEADERS } from '@/lib/headers'
import { hasPermission, Role } from '@/types'
import { NextResponse } from 'next/server'

const PUBLIC_API_PREFIXES = ['/api/auth', '/api/audit/log']

function isPublicApi(path: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => path.startsWith(prefix))
}

function isProtectedPath(path: string): boolean {
  return path.startsWith('/dashboard') || path.startsWith('/api')
}

function hasRoutePermission(path: string, role: Role): boolean {
  if (path.startsWith('/dashboard/admin') || path.startsWith('/api/admin')) {
    return hasPermission(role, 'ADMIN_SYSTEME')
  }
  if (path.startsWith('/dashboard/saisies') || path.startsWith('/api/saisies')) {
    return (
      hasPermission(role, 'DOSSIER_LIRE') ||
      hasPermission(role, 'DOSSIER_CREER') ||
      hasPermission(role, 'DOSSIER_MODIFIER')
    )
  }
  if (path.startsWith('/dashboard/encheres') || path.startsWith('/api/encheres')) {
    return hasPermission(role, 'ENCHERE_LIRE') || hasPermission(role, 'ENCHERE_CREER')
  }
  if (path.startsWith('/dashboard/adjudication')) {
    return hasPermission(role, 'ENCHERE_LIRE')
  }
  return true
}

async function logApiRequest(req: Request, userId?: string, action = 'API_REQUEST', statusCode?: number) {
  const url = new URL(req.url)
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? undefined

  try {
    await fetch(`${url.origin}/api/audit/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-audit-secret': process.env.AUDIT_INTERNAL_SECRET ?? '',
      },
      body: JSON.stringify({
        utilisateurId: userId,
        action,
        entite: 'RequeteHTTP',
        entiteId: undefined,
        nouvelleValeur: { path: url.pathname, method: req.method, statusCode },
        adresseIP: ip,
        userAgent,
      }),
    })
  } catch {
    // Le logging ne doit jamais bloquer la requête principale
  }
}

export const proxy = auth((req) => {
  const { nextUrl, auth } = req
  const path = nextUrl.pathname
  const response = NextResponse.next()

  // 1. Appliquer les headers de sécurité sur chaque réponse
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Routes publiques : pas d'authentification requise
  if (!isProtectedPath(path) || isPublicApi(path)) {
    return response
  }

  const userId = auth?.user?.id
  const role = auth?.user?.role as Role | undefined

  // 2 & 3. Vérifier l'authentification
  if (!userId || !role) {
    logApiRequest(req, undefined, 'ACCES_REFUSE', 401)
    if (path.startsWith('/api')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // 4. Vérifier les permissions RBAC
  if (!hasRoutePermission(path, role)) {
    logApiRequest(req, userId, 'ACCES_REFUSE', 403)
    if (path.startsWith('/api')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // 5. Logger les requêtes API protégées
  if (path.startsWith('/api')) {
    logApiRequest(req, userId, 'API_REQUEST')
  }

  return response
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
