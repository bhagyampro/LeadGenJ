import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateICPScore } from '@/lib/openai'

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.creditsBalance < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Need at least 1 credit.' },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.findFirst({
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

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const result = await calculateICPScore({
      title: lead.title,
      company: lead.company,
      industry: lead.industry,
      location: lead.location,
    })

    await prisma.lead.update({
      where: { id },
      data: {
        icpScore: result.score,
        icpBreakdown: result.breakdown,
      },
    })

    // Deduct credit
    await prisma.user.update({
      where: { id: session.user.id },
      data: { creditsBalance: { decrement: 1 } },
    })

    await prisma.creditTransaction.create({
      data: {
        userId: session.user.id,
        amount: -1,
        transactionType: 'debit',
        featureUsed: 'icp_scoring',
        metadata: { leadId: id },
      },
    })

    return NextResponse.json({
      score: result.score,
      breakdown: result.breakdown,
    })
  } catch (error) {
    console.error('Calculate ICP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}