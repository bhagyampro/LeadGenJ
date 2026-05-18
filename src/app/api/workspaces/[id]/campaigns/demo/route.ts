import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: workspaceId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const category = String(body.category || 'SaaS')

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const linkedinAccount = await prisma.linkedInAccount.findFirst({
      where: { workspaceId, status: 'active', isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!linkedinAccount) {
      return NextResponse.json({ error: 'Connect and validate LinkedIn before creating a demo campaign.' }, { status: 400 })
    }

    const leads = await prisma.lead.findMany({
      where: {
        workspaceId,
        industry: category,
        source: 'lead_finder_demo',
      },
      orderBy: [{ icpScore: 'desc' }, { createdAt: 'desc' }],
      take: 25,
    })

    if (leads.length === 0) {
      return NextResponse.json({ error: 'Import category leads first, then create a demo campaign.' }, { status: 400 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId,
        name: `${category} LinkedIn Demo Campaign`,
        linkedinAccountId: linkedinAccount.id,
        createdById: session.user.id,
        settings: {
          mode: 'demo',
          dailyLimit: Math.min(20, linkedinAccount.dailyLimit),
          note: 'Review all messages before activating.',
        },
        sequences: {
          create: [
            {
              name: 'Connection request',
              stepOrder: 1,
              waitDays: 0,
              aiAssisted: true,
              messageTemplate: 'Hi {{firstName}}, noticed your work at {{company}} in {{industry}}. Open to connecting?',
              personalizationVariables: { firstName: true, company: true, industry: true },
            },
            {
              name: 'Follow-up',
              stepOrder: 2,
              waitDays: 3,
              aiAssisted: true,
              messageTemplate: 'Thanks for connecting {{firstName}}. Curious if {{company}} is working on outbound or lead generation this quarter?',
              personalizationVariables: { firstName: true, company: true },
            },
          ],
        },
        campaignLeads: {
          create: leads.map((lead) => ({
            leadId: lead.id,
            status: 'pending',
          })),
        },
      },
      include: {
        _count: { select: { sequences: true, campaignLeads: true } },
      },
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Create demo campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
