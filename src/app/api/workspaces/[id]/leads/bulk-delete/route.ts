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

    const body = await request.json()
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string') : []
    const deleteAll = Boolean(body.deleteAll)

    if (!deleteAll && ids.length === 0) {
      return NextResponse.json({ error: 'No leads selected' }, { status: 400 })
    }

    const deleted = await prisma.lead.deleteMany({
      where: {
        workspaceId,
        ...(deleteAll ? {} : { id: { in: ids } }),
      },
    })

    return NextResponse.json({ deleted: deleted.count })
  } catch (error) {
    console.error('Bulk delete leads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
