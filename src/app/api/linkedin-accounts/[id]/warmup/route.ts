import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const account = await prisma.linkedInAccount.findFirst({
      where: {
        id,
        workspace: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id, role: 'admin' } } },
          ],
        },
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Simulate warmup progress
    // In production, this would run actual LinkedIn actions to build trust
    const newProgress = Math.min(account.warmupProgress + 10, 100)

    await prisma.linkedInAccount.update({
      where: { id },
      data: {
        warmupProgress: newProgress,
        status: newProgress >= 100 ? 'active' : 'warming_up',
      },
    })

    return NextResponse.json({
      success: true,
      warmupProgress: newProgress,
      message: `Warmup progress: ${newProgress}%`,
    })
  } catch (error) {
    console.error('Warmup LinkedIn account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}