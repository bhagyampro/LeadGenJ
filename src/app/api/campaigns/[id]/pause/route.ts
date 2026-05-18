import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pauseCampaign } from '@/services/campaign-engine'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updated = await pauseCampaign(id, session.user.id)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Pause campaign error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}
