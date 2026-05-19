import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { recordCampaignLeadEvent } from '@/services/campaign-engine'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; leadId: string }> }
) {
  try {
    const session = await auth()
    const { id, leadId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const event = body.event as 'accepted' | 'replied' | 'failed'

    if (!['accepted', 'replied', 'failed'].includes(event)) {
      return NextResponse.json({ error: 'Invalid lead event' }, { status: 400 })
    }

    const updated = await recordCampaignLeadEvent({
      campaignId: id,
      leadId,
      actorId: session.user.id,
      event,
      note: body.note,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update campaign lead status error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: message.includes('not found') ? 404 : 500 })
  }
}
