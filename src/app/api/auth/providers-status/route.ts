import { NextResponse } from 'next/server'
import { getGoogleOAuthConfig } from '@/lib/oauth-config'

export const runtime = 'nodejs'

export async function GET() {
  const googleOAuth = getGoogleOAuthConfig()
  const hasGoogleClientId = Boolean(googleOAuth.clientId)
  const hasGoogleClientSecret = Boolean(googleOAuth.clientSecret)

  return NextResponse.json({
    google: hasGoogleClientId && hasGoogleClientSecret,
    missing: {
      googleClientId: !hasGoogleClientId,
      googleClientSecret: !hasGoogleClientSecret,
    },
  })
}
