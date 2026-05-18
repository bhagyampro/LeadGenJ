import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateLinkedInSession } from '@/services/linkedin-automation-service'

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

    const updated = await validateLinkedInSession(id)
    const isValid = updated.status === 'active'

    if (isValid) {
      return NextResponse.json({ valid: true, message: 'Account validated successfully' })
    }

    return NextResponse.json(
      { valid: false, message: 'Reconnect required before this account can send campaign actions' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Validate LinkedIn account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
