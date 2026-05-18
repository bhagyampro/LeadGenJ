import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { enrichLead as enrichLeadAI } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

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

    const body = await request.json()
    const { leadData } = body

    const enriched = await enrichLeadAI(leadData)

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
        featureUsed: 'lead_enrichment',
      },
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Enrich lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
