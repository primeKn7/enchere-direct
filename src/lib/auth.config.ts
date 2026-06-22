import type { NextAuthConfig } from 'next-auth'
import { Role } from '@prisma/client'

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
    updateAge: 30 * 60,
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role as Role
        token.mfaActif = user.mfaActif
        token.compteVerifie = user.compteVerifie
      }
      return token
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string
      session.user.email = token.email as string
      session.user.role = token.role as Role
      session.user.mfaActif = token.mfaActif as boolean
      session.user.compteVerifie = token.compteVerifie as boolean
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [],
}
