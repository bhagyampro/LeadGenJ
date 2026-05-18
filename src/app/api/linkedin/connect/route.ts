import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'

function getLinkedInRedirectUri(request: NextRequest) {
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || request.nextUrl.origin
  return process.env.LINKEDIN_REDIRECT_URI || `${appUrl.replace(/\/$/, '')}/api/linkedin/callback`
}

async function getWorkspaceId(userId: string, requestedWorkspaceId: string | null) {
  if (requestedWorkspaceId) {
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: requestedWorkspaceId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    })

    if (workspace) return workspace.id
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  return workspace?.id
}

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!process.env.LINKEDIN_CLIENT_ID) {
    return NextResponse.redirect(new URL('/dashboard/linkedin-accounts?linkedin=missing_config', request.url))
  }

  const workspaceId = await getWorkspaceId(
    session.user.id,
    request.nextUrl.searchParams.get('workspaceId')
  )

  if (!workspaceId) {
    return NextResponse.redirect(new URL('/dashboard/linkedin-accounts?linkedin=no_workspace', request.url))
  }

  const state = crypto.randomBytes(24).toString('hex')
  const authUrl = new URL(LINKEDIN_AUTH_URL)

  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', process.env.LINKEDIN_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', getLinkedInRedirectUri(request))
  authUrl.searchParams.set('scope', 'openid profile email')
  authUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('linkedin_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60,
    path: '/',
  })
  response.cookies.set('linkedin_oauth_workspace', workspaceId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60,
    path: '/',
  })

  return response
}
