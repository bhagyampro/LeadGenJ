import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const sequence = await prisma.sequence.findFirst({
      where: {
        id,
        campaign: {
          workspace: {
            OR: [
              { ownerId: session.user.id },
              { members: { some: { userId: session.user.id, role: 'admin' } } },
            ],
          },
        },
      },
    })

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    const updated = await prisma.sequence.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update sequence error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sequence = await prisma.sequence.findFirst({
      where: {
        id,
        campaign: {
          workspace: {
            OR: [
              { ownerId: session.user.id },
              { members: { some: { userId: session.user.id, role: 'admin' } } },
            ],
          },
        },
      },
    })

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    await prisma.sequence.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete sequence error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}