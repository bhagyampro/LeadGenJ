import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    google:
      Boolean(process.env.GOOGLE_CLIENT_ID) &&
      Boolean(process.env.GOOGLE_CLIENT_SECRET),
  })
}
