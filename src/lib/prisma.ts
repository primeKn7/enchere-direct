import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined')
  }
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  // Logs SQL bruts désactivés par défaut (bruités dans la console + léger surcoût).
  // Mettre PRISMA_LOG_QUERIES=true dans .env pour les réactiver ponctuellement.
  const log: ('query' | 'error' | 'warn')[] =
    process.env.NODE_ENV === 'development'
      ? process.env.PRISMA_LOG_QUERIES === 'true'
        ? ['query', 'error', 'warn']
        : ['error', 'warn']
      : ['error']
  return new PrismaClient({ adapter, log })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
