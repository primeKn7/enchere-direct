const isDev = process.env.NODE_ENV === 'development'

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; " +
    // En dev Next.js injecte des scripts inline pour l'hydratation / HMR.
    // En prod il faudra idéalement utiliser des nonces.
    (isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
      : "script-src 'self'; ") +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}
