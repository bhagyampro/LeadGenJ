export function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]
    if (value) return value
  }

  return undefined
}

export function getDatabaseUrl() {
  return firstEnv(
    'DATABASE_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL',
    'POSTGRES_URL_NON_POOLING',
    'DIRECT_URL'
  )
}

export function getDirectDatabaseUrl() {
  return firstEnv(
    'DIRECT_URL',
    'POSTGRES_URL_NON_POOLING',
    'POSTGRES_URL',
    'DATABASE_URL',
    'POSTGRES_PRISMA_URL'
  )
}

export function getAuthSecret() {
  return firstEnv('AUTH_SECRET', 'NEXTAUTH_SECRET')
}

export function getAppUrl() {
  return firstEnv('AUTH_URL', 'NEXTAUTH_URL', 'APP_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'VERCEL_URL')
}
