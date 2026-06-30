import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'

const createLimiter = (points: number, duration: number, blockDuration = 0) =>
  new RateLimiterMemory({
    keyPrefix: 'enchere_direct',
    points,
    duration,
    blockDuration: blockDuration || duration,
  })

export const authLimiter = createLimiter(5, 15 * 60) // 5 tentatives par IP sur 15 min
export const otpLimiter = createLimiter(3, 10 * 60) // 3 tentatives OTP par userId sur 10 min
export const apiLimiter = createLimiter(100, 60) // 100 req par IP par minute
export const offreLimiter = createLimiter(10, 60) // 10 offres par userId par minute

export type LimiterName = 'authLimiter' | 'otpLimiter' | 'apiLimiter' | 'offreLimiter'

const limiters: Record<LimiterName, RateLimiterMemory> = {
  authLimiter,
  otpLimiter,
  apiLimiter,
  offreLimiter,
}

export async function checkRateLimit(
  key: string,
  limiterName: LimiterName
): Promise<{ allowed: boolean; msBeforeNext?: number }> {
  const limiter = limiters[limiterName]
  try {
    await limiter.consume(key, 1)
    return { allowed: true }
  } catch (rej) {
    if (rej instanceof RateLimiterRes) {
      return { allowed: false, msBeforeNext: rej.msBeforeNext }
    }
    // En cas d'erreur interne du rate limiter, on refuse par principe de précaution
    return { allowed: false }
  }
}

/**
 * Consulte l'état d'une clé SANS consommer de point.
 * Utile pour throttler les connexions : on ne pénalise que les échecs (consume),
 * mais on vérifie le blocage à chaque tentative (peek). Ainsi une connexion
 * réussie ne décompte rien, et le throttle est temporaire (jamais un blocage
 * permanent du compte).
 */
export async function peekRateLimit(
  key: string,
  limiterName: LimiterName
): Promise<{ blocked: boolean; msBeforeNext?: number }> {
  const limiter = limiters[limiterName]
  const res = await limiter.get(key)
  if (res && res.remainingPoints <= 0) {
    return { blocked: true, msBeforeNext: res.msBeforeNext }
  }
  return { blocked: false }
}
