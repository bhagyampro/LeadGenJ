import { Prisma } from '@prisma/client'

export function isDatabaseError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true
  }

  if (!(error instanceof Error)) {
    return false
  }

  return [
    'DATABASE_URL',
    'POSTGRES_PRISMA_URL',
    'connect',
    'connection',
    'database',
    'password',
    'prepared statement',
    'relation',
    'schema',
    'tenant',
    'timeout',
  ].some((keyword) => error.message.toLowerCase().includes(keyword.toLowerCase()))
}

export function getDatabaseErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (['P2021', 'P2022'].includes(error.code)) {
      return 'Database schema is not ready. Run npx prisma db push against the production database, then redeploy.'
    }

    if (['P1000', 'P1001', 'P1002', 'P1003', 'P1010'].includes(error.code)) {
      return 'Database connection failed. Check the production database URL and credentials in Vercel.'
    }
  }

  if (error instanceof Error && error.message.includes('DATABASE_URL')) {
    return 'Database URL is missing. Set DATABASE_URL or POSTGRES_PRISMA_URL in Vercel Environment Variables.'
  }

  return 'Database is not ready. Check Vercel database environment variables and run npx prisma db push.'
}
