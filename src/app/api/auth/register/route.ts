import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function isDatabaseSetupError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1000', 'P1001', 'P1002', 'P1003', 'P1010', 'P2021', 'P2022'].includes(error.code)
  }

  return error instanceof Error && error.message.includes('DATABASE_URL is required')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : undefined

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

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          companyName,
          creditsBalance: 50,
        },
      })

      await tx.creditTransaction.create({
        data: {
          userId: createdUser.id,
          amount: 50,
          transactionType: 'credit',
          featureUsed: 'signup_bonus',
        },
      })

      await tx.workspace.create({
        data: {
          name: 'My Workspace',
          ownerId: createdUser.id,
        },
      })

      return createdUser
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
    if (isDatabaseSetupError(error)) {
      return NextResponse.json(
        { error: 'Database is not ready. Set DATABASE_URL in Vercel and run npx prisma db push, then try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
