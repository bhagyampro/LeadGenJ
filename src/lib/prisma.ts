import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  if (databaseUrl.startsWith('prisma+postgres://')) {
    return new PrismaClient({ accelerateUrl: databaseUrl })
  }

  return new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
  })
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }

  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient()
    const value = client[property as keyof PrismaClient]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
