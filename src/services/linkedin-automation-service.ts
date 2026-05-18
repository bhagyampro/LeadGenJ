import type { InputJsonObject } from '@prisma/client/runtime/client'
import { prisma } from '@/lib/prisma'
import { enqueueLinkedInAction } from '@/lib/queue'

const SUPPORTED_ACTIONS = new Set([
  'connection_request',
  'message',
  'profile_visit',
  'withdraw_invite',
])

export async function queueLinkedInAction(input: {
  workspaceId: string
  linkedinAccountId: string
  type: string
  payload: InputJsonObject
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
      type: input.type,
      payload: input.payload,
      scheduledAt: input.scheduledAt || new Date(),
    },
  })

  await enqueueLinkedInAction({
    actionId: action.id,
    workspaceId: input.workspaceId,
    linkedinAccountId: input.linkedinAccountId,
    actionType: input.type as 'connection_request' | 'message' | 'profile_visit' | 'withdraw_invite',
    payload: input.payload,
  }, action.scheduledAt)

  return action
}

export async function validateLinkedInSession(linkedinAccountId: string) {
  const account = await prisma.linkedInAccount.findUnique({
    where: { id: linkedinAccountId },
  })

  if (!account) {
    throw new Error('LinkedIn account not found')
  }

  return prisma.linkedInAccount.update({
    where: { id: linkedinAccountId },
    data: {
      status: account.sessionCookieEncrypted ? 'active' : 'needs_reconnect',
      lastUsed: new Date(),
    },
  })
}
