import type { InputJsonObject } from '@prisma/client/runtime/client'
import { prisma } from '@/lib/prisma'

export async function recordActivity(input: {
  workspaceId: string
  actorId?: string
  action: string
  entityType: string
  entityId?: string
  metadata?: InputJsonObject
}) {
  return prisma.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata || {},
    },
  })
}

export async function recordAnalyticsEvent(input: {
  workspaceId: string
  campaignId?: string
  type: string
  value?: number
  dimensions?: InputJsonObject
}) {
  return prisma.analyticsEvent.create({
    data: {
      workspaceId: input.workspaceId,
      campaignId: input.campaignId,
      type: input.type,
      value: input.value ?? 1,
      dimensions: input.dimensions || {},
    },
  })
}
