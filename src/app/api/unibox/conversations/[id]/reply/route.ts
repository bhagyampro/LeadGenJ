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

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const conversation = await prisma.uniboxConversation.findFirst({
      where: {
        id,
        workspace: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Mock sending message - in production, would use LinkedIn API
    const message = await prisma.message.create({
      data: {
        campaignId: '', // Manual reply, no campaign
        leadId: conversation.leadId,
        linkedinAccountId: conversation.linkedinAccountId,
        direction: 'outbound',
        content,
        status: 'sent',
        sentAt: new Date(),
      },
    })

    // Update conversation
    await prisma.uniboxConversation.update({
      where: { id },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Reply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}