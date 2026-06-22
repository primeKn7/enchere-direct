import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'

export const OTP_LENGTH = 6
export const OTP_TTL_SECONDS = 10 * 60
export const OTP_MAX_ATTEMPTS = 3

export function generateOTP(): string {
  const code = crypto.randomInt(0, 1_000_000)
  return code.toString().padStart(OTP_LENGTH, '0')
}

export async function hashOTP(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

export async function verifyOTP(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  const from = process.env.SMTP_FROM || 'noreply@enchere-direct.bj'

  if (!host || !user || !pass) {
    throw new Error('Configuration SMTP incomplète.')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from,
  })
}

export async function sendOTPEmail(email: string, code: string): Promise<void> {
  const from = process.env.SMTP_FROM || 'noreply@enchere-direct.bj'
  const transporter = createTransporter()

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Votre code de vérification EnchèreDirect',
    text: `Votre code de vérification est : ${code}. Il est valable 10 minutes. Ne le partagez avec personne.`,
    html: `<p>Votre code de vérification est : <strong>${code}</strong></p><p>Il est valable 10 minutes. Ne le partagez avec personne.</p>`,
  })
}

// TODO: intégrer le fournisseur SMS une fois les clés configurées (SMS_API_KEY, SMS_API_URL)
export async function sendOTPSMS(_telephone: string, _code: string): Promise<void> {
  // Placeholder — à implémenter avec le prestataire SMS national
  throw new Error('Canal SMS non configuré.')
}
