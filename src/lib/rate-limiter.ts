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
