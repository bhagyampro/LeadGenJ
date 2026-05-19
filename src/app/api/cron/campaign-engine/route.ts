import { NextRequest, NextResponse } from 'next/server'
import { processDueLinkedInActions } from '@/services/linkedin-automation-service'

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  const headerSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const querySecret = request.nextUrl.searchParams.get('secret')

  if (expectedSecret && headerSecret !== expectedSecret && querySecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = Number(request.nextUrl.searchParams.get('limit') || 25)
  const result = await processDueLinkedInActions(Math.min(Math.max(limit, 1), 100))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  return GET(request)
}
