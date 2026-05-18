import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        workspace: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      },
      include: {
        sequences: { orderBy: { stepOrder: 'asc' } },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Create duplicate
    const duplicate = await prisma.campaign.create({
      data: {
        workspaceId: campaign.workspaceId,
        name: `${campaign.name} (Copy)`,
        linkedinAccountId: campaign.linkedinAccountId,
        settings: campaign.settings ?? Prisma.JsonNull,
        createdById: session.user.id,
        status: 'draft',
      },
    })

    // Copy sequences
    for (const seq of campaign.sequences) {
      await prisma.sequence.create({
        data: {
          campaignId: duplicate.id,
          name: seq.name,
          stepOrder: seq.stepOrder,
          waitDays: seq.waitDays,
          messageTemplate: seq.messageTemplate,
          aiAssisted: seq.aiAssisted,
          personalizationVariables: seq.personalizationVariables ?? Prisma.JsonNull,
        },
      })
    }

    return NextResponse.json(duplicate)
  } catch (error) {
    console.error('Duplicate campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
