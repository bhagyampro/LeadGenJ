import { NextResponse } from 'next/server'
import { getAuthSecret, getDatabaseUrl, getDirectDatabaseUrl } from '@/lib/env'
import { getGoogleOAuthConfig } from '@/lib/oauth-config'
import { prisma } from '@/lib/prisma'
import { getDatabaseErrorMessage } from '@/lib/server-diagnostics'

export const runtime = 'nodejs'

export async function GET() {
  const googleOAuth = getGoogleOAuthConfig()
  const checks = {
    authSecret: Boolean(getAuthSecret()),
    databaseUrl: Boolean(getDatabaseUrl()),
    directDatabaseUrl: Boolean(getDirectDatabaseUrl()),
    googleOAuth: Boolean(googleOAuth.clientId && googleOAuth.clientSecret),
    database: false,
  }

  let databaseError: string | undefined

  if (checks.databaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.database = true
    } catch (error) {
      databaseError = getDatabaseErrorMessage(error)
    }
  }

  const ok = checks.authSecret && checks.databaseUrl && checks.database

  return NextResponse.json({
    status: ok ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks,
    ...(databaseError ? { databaseError } : {}),
  }, { status: ok ? 200 : 503 })
}
