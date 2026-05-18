import { prisma } from '@/lib/prisma'
import { enqueueCampaignExecution, scheduleMessage } from '@/lib/queue'
import { recordActivity, recordAnalyticsEvent } from './activity-service'

export async function activateCampaign(campaignId: string, actorId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      workspace: {
        OR: [
          { ownerId: actorId },
          { members: { some: { userId: actorId, role: 'admin' } } },
        ],
      },
    },
    include: {
      sequences: { orderBy: { stepOrder: 'asc' } },
      campaignLeads: { where: { status: 'pending' }, include: { lead: true } },
      linkedinAccount: true,
    },
  })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  if (campaign.sequences.length === 0) {
    throw new Error('Campaign must have at least one sequence step')
  }

  if (!campaign.linkedinAccount) {
    throw new Error('Campaign must have a LinkedIn account')
  }

  const run = await prisma.campaignRun.create({
    data: {
      campaignId,
      status: 'queued',
      totals: {
        leads: campaign.campaignLeads.length,
        steps: campaign.sequences.length,
      },
    },
  })

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'active' },
  })

  await enqueueCampaignExecution({
    campaignId,
    workspaceId: campaign.workspaceId,
    runId: run.id,
  })

  await recordActivity({
    workspaceId: campaign.workspaceId,
    actorId,
    action: 'campaign.activated',
    entityType: 'campaign',
    entityId: campaignId,
    metadata: { runId: run.id },
  })

  await recordAnalyticsEvent({
    workspaceId: campaign.workspaceId,
    campaignId,
    type: 'campaign_activated',
  })

  return updated
}

export async function pauseCampaign(campaignId: string, actorId: string) {
  const campaign = await assertCampaignAdmin(campaignId, actorId)
  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'paused' },
  })

  await recordActivity({
    workspaceId: campaign.workspaceId,
    actorId,
    action: 'campaign.paused',
    entityType: 'campaign',
    entityId: campaignId,
  })

  return updated
}

export async function resumeCampaign(campaignId: string, actorId: string) {
  await assertCampaignAdmin(campaignId, actorId)
  return activateCampaign(campaignId, actorId)
}

export async function scheduleCampaignLeadStep(input: {
  campaignId: string
  leadId: string
  sequenceId: string
  content: string
  linkedinAccountId: string
  scheduledAt: Date
}) {
  await scheduleMessage(
    input.leadId,
    input.campaignId,
    input.sequenceId,
    input.content,
    input.linkedinAccountId,
    input.scheduledAt
  )

  return prisma.campaignLead.update({
    where: {
      campaignId_leadId: {
        campaignId: input.campaignId,
        leadId: input.leadId,
      },
    },
    data: {
      status: 'scheduled',
      nextMessageDate: input.scheduledAt,
    },
  })
}

async function assertCampaignAdmin(campaignId: string, actorId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      workspace: {
        OR: [
          { ownerId: actorId },
          { members: { some: { userId: actorId, role: 'admin' } } },
        ],
      },
    },
  })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  return campaign
}
