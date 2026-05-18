import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: campaignId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        workspace: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const sequences = await prisma.sequence.findMany({
      where: { campaignId },
      orderBy: { stepOrder: 'asc' },
    })

    return NextResponse.json(sequences)
  } catch (error) {
    console.error('Get sequences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: campaignId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, stepOrder, waitDays, messageTemplate, aiAssisted, personalizationVariables } = body

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        workspace: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id, role: 'admin' } } },
          ],
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get max step order
    const maxOrder = await prisma.sequence.aggregate({
      where: { campaignId },
      _max: { stepOrder: true },
    })

    const sequence = await prisma.sequence.create({
      data: {
        campaignId,
        name: name || `Step ${(maxOrder._max.stepOrder || 0) + 1}`,
        stepOrder: stepOrder || ((maxOrder._max.stepOrder || 0) + 1),
        waitDays: waitDays || 1,
        messageTemplate,
        aiAssisted: aiAssisted || false,
        personalizationVariables: personalizationVariables || {},
      },
    })

    return NextResponse.json(sequence)
  } catch (error) {
    console.error('Create sequence error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
