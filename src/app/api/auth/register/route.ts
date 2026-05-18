import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, companyName } = body

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        companyName,
        creditsBalance: 50, // Free credits on signup
      },
    })

    // Create credit transaction for signup bonus
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 50,
        transactionType: 'credit',
        featureUsed: 'signup_bonus',
      },
    })

    // Create default workspace
    await prisma.workspace.create({
      data: {
        name: 'My Workspace',
        ownerId: user.id,
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientInitializationError
    ) {
      return NextResponse.json(
        { error: 'Database is not ready. Start Postgres and run npx prisma db push, then try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
