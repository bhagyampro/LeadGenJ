import { NextResponse } from 'next/server'

export async function GET() {
  const hasGoogleClientId = Boolean(
    process.env.GOOGLE_CLIENT_ID ||
    process.env.AUTH_GOOGLE_ID ||
    process.env.GOOGLE_AUTH_CLIENT_ID
  )
  const hasGoogleClientSecret = Boolean(
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.AUTH_GOOGLE_SECRET ||
    process.env.GOOGLE_AUTH_CLIENT_SECRET
  )

  return NextResponse.json({
    google: hasGoogleClientId && hasGoogleClientSecret,
    missing: {
      googleClientId: !hasGoogleClientId,
      googleClientSecret: !hasGoogleClientSecret,
    },
  })
}
