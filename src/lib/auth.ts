import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { authConfig } from '@/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateSecureToken } from '@/lib/security'
import { loginSchema } from '@/lib/validators'
import { generateOTP, hashOTP, OTP_TTL_SECONDS, sendOTPEmail } from '@/lib/otp'
import { headers } from 'next/headers'
import {
  CredentialsInvalidError,
  MFARequiredError,
  OTPExpiredError,
  OTPInvalidError,
  OTPMaxAttemptsError,
  AccountBlockedError,
  TooManyAttemptsError,
} from '@/lib/auth-errors'
import { peekRateLimit, checkRateLimit } from '@/lib/rate-limiter'

const getRequestMetadata = async () => {
  const h = await headers()
  const ip = h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown'
  const userAgent = h.get('user-agent') ?? undefined
  return { ip, userAgent }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        otp: { label: 'Code OTP', type: 'text' },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        })

        if (!parsed.success) {
          console.log('[LOGIN] Validation échouée:', parsed.error.flatten())
          throw new CredentialsInvalidError()
        }

        const { email, password } = parsed.data
        const emailLc = email.toLowerCase()
        console.log('[LOGIN] Tentative pour:', emailLc)

        // Throttle temporaire (jamais un blocage permanent) : on vérifie d'abord
        // si la limite est atteinte SANS consommer (peek), puis on ne consomme un
        // point que sur un échec. Une connexion réussie ne pénalise rien.
        const { ip } = await getRequestMetadata()
        const keyEmail = `login:${emailLc}`
        const keyIp = `login-ip:${ip}`
        const consumeOnFailure = async () => {
          await Promise.all([
            checkRateLimit(keyEmail, 'authLimiter'),
            checkRateLimit(keyIp, 'authLimiter'),
          ])
        }
        const [peekEmail, peekIp] = await Promise.all([
          peekRateLimit(keyEmail, 'authLimiter'),
          peekRateLimit(keyIp, 'authLimiter'),
        ])
        if (peekEmail.blocked || peekIp.blocked) {
          console.log('[LOGIN] Throttle: trop de tentatives pour', emailLc)
          throw new TooManyAttemptsError()
        }

        const utilisateur = await prisma.utilisateur.findUnique({
          where: { email: emailLc },
        })

        if (!utilisateur) {
          console.log('[LOGIN] Utilisateur non trouvé:', emailLc)
          await consumeOnFailure()
          throw new CredentialsInvalidError()
        }

        console.log('[LOGIN] Utilisateur trouvé, ID:', utilisateur.id, 'compteVerifie:', utilisateur.compteVerifie, 'compteBloque:', utilisateur.compteBloque)

        if (utilisateur.compteBloque) {
          console.log('[LOGIN] Compte bloqué:', utilisateur.id)
          throw new AccountBlockedError()
        }

        const passwordValid = await verifyPassword(password, utilisateur.motDePasseHash)
        console.log('[LOGIN] Mot de passe valide:', passwordValid)

        if (!passwordValid) {
          await consumeOnFailure()
          await prisma.utilisateur.update({
            where: { id: utilisateur.id },
            data: { tentativesEchec: { increment: 1 } },
          })
          throw new CredentialsInvalidError()
        }

        const otpInput = credentials?.otp as string | undefined
        if (utilisateur.mfaActif) {
          if (!otpInput) {
            const otpCode = generateOTP()
            const otpHash = await hashOTP(otpCode)

            await prisma.otpCode.create({
              data: {
                userId: utilisateur.id,
                code: otpHash,
                canal: 'EMAIL',
                expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
                utilise: false,
                tentatives: 0,
              },
            })

            try {
              await sendOTPEmail(utilisateur.email, otpCode)
            } catch {
              console.error("Échec d'envoi OTP à", utilisateur.email)
            }

            throw new MFARequiredError()
          }

          const latestOtp = await prisma.otpCode.findFirst({
            where: {
              userId: utilisateur.id,
              utilise: false,
              expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
          })

          if (!latestOtp) {
            throw new OTPExpiredError()
          }

          if (latestOtp.tentatives >= 3) {
            throw new OTPMaxAttemptsError()
          }

          const { verifyOTP } = await import('@/lib/otp')
          const otpValid = await verifyOTP(otpInput, latestOtp.code)

          if (!otpValid) {
            await prisma.otpCode.update({
              where: { id: latestOtp.id },
              data: { tentatives: { increment: 1 } },
            })
            throw new OTPInvalidError()
          }

          await prisma.otpCode.update({
            where: { id: latestOtp.id },
            data: { utilise: true },
          })
        }

        await prisma.utilisateur.update({
          where: { id: utilisateur.id },
          data: {
            tentativesEchec: 0,
            derniereConnexion: new Date(),
          },
        })

        return {
          id: utilisateur.id,
          email: utilisateur.email,
          name: `${utilisateur.prenom} ${utilisateur.nom}`,
          role: utilisateur.role,
          mfaActif: utilisateur.mfaActif,
          compteVerifie: utilisateur.compteVerifie,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role
        token.mfaActif = user.mfaActif
        token.compteVerifie = user.compteVerifie
        token.refreshToken = generateSecureToken(32)
      }
      return token
    },
  },
  events: {
    signIn: async ({ user, account }) => {
      if (account?.provider !== 'credentials' || !user.id) return

      try {
        const { ip, userAgent } = await getRequestMetadata()
        const refreshToken = generateSecureToken(32)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        await prisma.session.create({
          data: {
            userId: user.id,
            token: refreshToken,
            ipAddress: ip,
            userAgent: userAgent ?? null,
            expiresAt,
          },
        })

        await prisma.journalAudit.create({
          data: {
            utilisateurId: user.id,
            action: 'CONNEXION',
            entite: 'Utilisateur',
            entiteId: user.id,
            adresseIP: ip,
            userAgent: userAgent ?? null,
          },
        })
      } catch (error) {
        console.error('[LOGIN] Échec journalisation post-connexion:', error)
      }
    },
  },
})
