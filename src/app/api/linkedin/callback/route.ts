import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'

const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo'

type LinkedInTokenResponse = {
  access_token: string
  expires_in?: number
  id_token?: string
  scope?: string
  token_type?: string
}

type LinkedInUserInfo = {
  sub: string
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
  email?: string
  profile?: string
}

function redirectToDashboard(request: NextRequest, status: string) {
  return NextResponse.redirect(new URL(`/dashboard/linkedin-accounts?linkedin=${status}`, request.url))
}

async function exchangeCodeForToken(code: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI || '',
    client_id: process.env.LINKEDIN_CLIENT_ID || '',
    client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
  })

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    throw new Error(`LinkedIn token exchange failed: ${response.status} ${await response.text()}`)
  }

  return response.json() as Promise<LinkedInTokenResponse>
}

async function getLinkedInUserInfo(accessToken: string) {
  const response = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`LinkedIn profile fetch failed: ${response.status} ${await response.text()}`)
  }

  return response.json() as Promise<LinkedInUserInfo>
}

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const error = request.nextUrl.searchParams.get('error')
  const savedState = request.cookies.get('linkedin_oauth_state')?.value
  const workspaceId = request.cookies.get('linkedin_oauth_workspace')?.value

  if (error) {
    return redirectToDashboard(request, 'denied')
  }

  if (!code || !state || !savedState || state !== savedState || !workspaceId) {
    return redirectToDashboard(request, 'invalid_state')
  }

  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET || !process.env.LINKEDIN_REDIRECT_URI) {
    return redirectToDashboard(request, 'missing_config')
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    select: { id: true },
  })

  if (!workspace) {
    return redirectToDashboard(request, 'no_workspace')
  }

  try {
    const token = await exchangeCodeForToken(code)
    const profile = await getLinkedInUserInfo(token.access_token)
    const displayName = profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ') || 'LinkedIn Account'
    const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null

    await prisma.linkedInAccount.create({
      data: {
        workspaceId: workspace.id,
        name: displayName,
        profileUrl: profile.profile || `linkedin:oidc:${profile.sub}`,
        sessionCookieEncrypted: encrypt(JSON.stringify({
          provider: 'linkedin_oidc',
          accessToken: token.access_token,
          idToken: token.id_token,
          expiresAt,
          scope: token.scope,
          tokenType: token.token_type,
          profile,
        })),
        status: 'active',
        isActive: true,
        dailyLimit: 20,
        lastUsed: new Date(),
      },
    })

    const response = redirectToDashboard(request, 'connected')
    response.cookies.delete('linkedin_oauth_state')
    response.cookies.delete('linkedin_oauth_workspace')
    return response
  } catch (error) {
    console.error('LinkedIn callback error:', error)
    return redirectToDashboard(request, 'failed')
  }
}
