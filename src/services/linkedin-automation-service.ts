import type { InputJsonObject } from '@prisma/client/runtime/client'
import { decrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'
import { enqueueLinkedInAction } from '@/lib/queue'
import { recordAnalyticsEvent } from './activity-service'

const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo'

const SUPPORTED_ACTIONS = new Set([
  'connection_request',
  'message',
  'profile_visit',
  'withdraw_invite',
])

type StoredLinkedInOAuthToken = {
  provider?: string
  accessToken?: string
  expiresAt?: string | null
}

export async function queueLinkedInAction(input: {
  workspaceId: string
  linkedinAccountId: string
  type: string
  payload: InputJsonObject
  messageId?: string
  scheduledAt?: Date
}) {
  if (!SUPPORTED_ACTIONS.has(input.type)) {
    throw new Error(`Unsupported LinkedIn action: ${input.type}`)
  }

  const account = await prisma.linkedInAccount.findFirst({
    where: {
      id: input.linkedinAccountId,
      workspaceId: input.workspaceId,
      isActive: true,
    },
  })

  if (!account) {
    throw new Error('LinkedIn account is not active or does not belong to this workspace')
  }

  const action = await prisma.automationAction.create({
    data: {
      workspaceId: input.workspaceId,
      linkedinAccountId: input.linkedinAccountId,
      messageId: input.messageId,
      type: input.type,
      payload: input.payload,
      scheduledAt: input.scheduledAt || new Date(),
    },
  })

  try {
    await enqueueLinkedInAction({
      actionId: action.id,
      workspaceId: input.workspaceId,
      linkedinAccountId: input.linkedinAccountId,
      actionType: input.type as 'connection_request' | 'message' | 'profile_visit' | 'withdraw_invite',
      payload: input.payload,
    }, action.scheduledAt)
  } catch (error) {
    await prisma.automationAction.update({
      where: { id: action.id },
      data: {
        status: 'queued_no_worker',
        error: error instanceof Error ? error.message : 'Redis queue is not available',
      },
    })
  }

  return action
}

export async function processDueLinkedInActions(limit = 25) {
  const actions = await prisma.automationAction.findMany({
    where: {
      status: { in: ['queued', 'queued_no_worker'] },
      scheduledAt: { lte: new Date() },
    },
    include: {
      message: {
        include: {
          campaign: true,
          lead: true,
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  })

  const results = []
  for (const action of actions) {
    try {
      results.push(await performLinkedInAction(action.id))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'LinkedIn action failed'
      await markActionFailed(action.id, message)
      results.push({ actionId: action.id, status: 'failed', error: message })
    }
  }

  return { processed: results.length, results }
}

export async function performLinkedInAction(actionId: string) {
  const action = await prisma.automationAction.findUnique({
    where: { id: actionId },
    include: {
      message: {
        include: {
          campaign: true,
          lead: true,
        },
      },
    },
  })

  if (!action) {
    throw new Error('LinkedIn action not found')
  }

  await prisma.automationAction.update({
    where: { id: action.id },
    data: { status: 'running', startedAt: new Date(), error: null },
  })

  const provider = process.env.LINKEDIN_ACTION_PROVIDER || 'manual'

  if (provider !== 'demo') {
    const message = 'LinkedIn sending provider is not configured. Use LINKEDIN_ACTION_PROVIDER=demo for local demos, or connect an approved LinkedIn/partner API provider for live sending.'
    await markActionBlocked(action.id, message)
    if (action.message) {
      await prisma.message.update({
        where: { id: action.message.id },
        data: { status: 'blocked' },
      })
      await prisma.campaignLead.update({
        where: {
          campaignId_leadId: {
            campaignId: action.message.campaignId,
            leadId: action.message.leadId,
          },
        },
        data: {
          status: 'blocked_provider',
          lastError: message,
        },
      })
    }
    return { actionId: action.id, status: 'blocked_provider' }
  }

  await prisma.automationAction.update({
    where: { id: action.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  })

  if (action.message) {
    const stepOrder = Number((action.payload as Record<string, unknown>).stepOrder || 1)
    const leadStatus = action.type === 'connection_request'
      ? 'waiting_for_acceptance'
      : 'waiting_for_reply'

    await prisma.message.update({
      where: { id: action.message.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    })

    await prisma.campaignLead.update({
      where: {
        campaignId_leadId: {
          campaignId: action.message.campaignId,
          leadId: action.message.leadId,
        },
      },
      data: {
        status: leadStatus,
        currentStep: stepOrder,
        lastMessageSent: new Date(),
        lastError: null,
      },
    })
  }

  await recordAnalyticsEvent({
    workspaceId: action.workspaceId,
    campaignId: action.message?.campaignId,
    type: `linkedin_action_${action.type}`,
  })

  return { actionId: action.id, status: 'completed' }
}

async function markActionBlocked(actionId: string, error: string) {
  await prisma.automationAction.update({
    where: { id: actionId },
    data: {
      status: 'blocked_provider',
      failedAt: new Date(),
      error,
    },
  })
}

async function markActionFailed(actionId: string, error: string) {
  await prisma.automationAction.update({
    where: { id: actionId },
    data: {
      status: 'failed',
      failedAt: new Date(),
      error,
    },
  })
}

function parseStoredLinkedInToken(encryptedValue: string) {
  try {
    return JSON.parse(decrypt(encryptedValue)) as StoredLinkedInOAuthToken
  } catch {
    return null
  }
}

async function verifyLinkedInAccessToken(accessToken: string) {
  const response = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  return response.ok
}

export async function validateLinkedInSession(linkedinAccountId: string) {
  const account = await prisma.linkedInAccount.findUnique({
    where: { id: linkedinAccountId },
  })

  if (!account) {
    throw new Error('LinkedIn account not found')
  }

  if (!account.sessionCookieEncrypted) {
    return prisma.linkedInAccount.update({
      where: { id: linkedinAccountId },
      data: {
        status: 'needs_reconnect',
        lastUsed: new Date(),
      },
    })
  }

  const storedToken = parseStoredLinkedInToken(account.sessionCookieEncrypted)

  if (storedToken?.provider === 'linkedin_oidc') {
    const tokenExpired = storedToken.expiresAt
      ? new Date(storedToken.expiresAt).getTime() <= Date.now()
      : false
    const tokenValid = Boolean(storedToken.accessToken) && !tokenExpired
      ? await verifyLinkedInAccessToken(storedToken.accessToken as string)
      : false

    return prisma.linkedInAccount.update({
      where: { id: linkedinAccountId },
      data: {
        status: tokenValid ? 'active' : 'needs_reconnect',
        lastUsed: new Date(),
      },
    })
  }

  return prisma.linkedInAccount.update({
    where: { id: linkedinAccountId },
    data: {
      status: 'active',
      lastUsed: new Date(),
    },
  })
}
