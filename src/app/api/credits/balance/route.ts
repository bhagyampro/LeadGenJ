import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        creditsBalance: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get balance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
