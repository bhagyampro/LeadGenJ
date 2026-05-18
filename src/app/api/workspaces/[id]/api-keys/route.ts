import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiKey, hashApiKey } from '@/lib/utils'

export async function GET(
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
          { members: { some: { userId: session.user.id, role: 'admin' } } },
        ],
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const keys = await prisma.apiKey.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        permissions: true,
        lastUsed: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(keys)
  } catch (error) {
    console.error('Get API keys error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const body = await request.json()
    const { name, permissions, expiresAt } = body

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: 'admin' } } },
        ],
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const apiKey = generateApiKey()
    const hashedKey = hashApiKey(apiKey)

    const key = await prisma.apiKey.create({
      data: {
        workspaceId,
        name: name || 'API Key',
        keyHashed: hashedKey,
        permissions: permissions || { read: true },
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({
      id: key.id,
      name: key.name,
      key: apiKey, // Only returned once!
      permissions: key.permissions,
      createdAt: key.createdAt,
    })
  } catch (error) {
    console.error('Create API key error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}