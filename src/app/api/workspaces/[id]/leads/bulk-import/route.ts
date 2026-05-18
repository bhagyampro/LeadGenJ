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
    const { leads } = body

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const createdLeads = await prisma.lead.createManyAndReturn({
      data: leads.map((lead: Record<string, string>) => ({
        workspaceId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        title: lead.title,
        company: lead.company,
        industry: lead.industry,
        location: lead.location,
        linkedinProfileUrl: lead.linkedinProfileUrl,
        source: lead.source || 'bulk_import',
        status: 'new',
      })),
    })

    return NextResponse.json({
      imported: createdLeads.length,
      leads: createdLeads,
    })
  } catch (error) {
    console.error('Bulk import leads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}