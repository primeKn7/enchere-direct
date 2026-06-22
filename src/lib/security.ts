import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { SECURITY_HEADERS } from '@/lib/headers'

export { SECURITY_HEADERS }

export const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateSecureToken(length = 64): string {
  return crypto.randomBytes(length).toString('hex')
}

export function sanitizeInput(input: string): string {
  // Supprime les caractères de contrôle et les balises script connus
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim()
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 12) errors.push('Au moins 12 caractères.')
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule.')
  if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule.')
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre.')
  if (!/[!@#$%^&*(),.?":{}|<>_\-=+\[\]\\/;'`~]/.test(password)) errors.push('Au moins un caractère spécial.')
  return { valid: errors.length === 0, errors }
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const maskedLocal = local.length > 2 ? local.slice(0, 2) + '***' : '***'
  return `${maskedLocal}@${domain}`
}
