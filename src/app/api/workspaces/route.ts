import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                linkedinAccounts: true,
                campaigns: true,
                leads: true,
              },
            },
          },
        },
      },
    })

    const workspaces = memberships.map((m) => m.workspace)

    // Also get owned workspaces
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: {
          select: {
            members: true,
            linkedinAccounts: true,
            campaigns: true,
            leads: true,
          },
        },
      },
    })

    const allWorkspaces = [...ownedWorkspaces, ...workspaces.filter(
      (w) => !ownedWorkspaces.some((o) => o.id === w.id)
    )]

    return NextResponse.json(allWorkspaces)
  } catch (error) {
    console.error('Get workspaces error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, settings } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        ownerId: session.user.id,
        settings: settings || {},
      },
      include: {
        _count: {
          select: {
            members: true,
            linkedinAccounts: true,
            campaigns: true,
            leads: true,
          },
        },
      },
    })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Create workspace error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
