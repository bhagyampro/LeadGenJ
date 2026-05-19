import { prisma } from '@/lib/prisma'
import { recordActivity, recordAnalyticsEvent } from './activity-service'
import { queueLinkedInAction } from './linkedin-automation-service'

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

  await scheduleCampaignRun(campaignId, run.id)

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

export async function scheduleCampaignRun(campaignId: string, runId?: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      sequences: { orderBy: { stepOrder: 'asc' } },
      campaignLeads: {
        where: { status: { in: ['pending', 'queued'] } },
        include: { lead: true },
      },
      linkedinAccount: true,
    },
  })

  if (!campaign || campaign.status !== 'active' || !campaign.linkedinAccount) {
    return { scheduled: 0 }
  }

  if (runId) {
    await prisma.campaignRun.update({
      where: { id: runId },
      data: { status: 'running', startedAt: new Date() },
    })
  }

  const firstStep = campaign.sequences[0]
  if (!firstStep) {
    return { scheduled: 0 }
  }

  let scheduled = 0
  for (const campaignLead of campaign.campaignLeads) {
    const scheduledAt = addDays(new Date(), firstStep.waitDays)
    await scheduleCampaignLeadStep({
      campaignId,
      workspaceId: campaign.workspaceId,
      leadId: campaignLead.leadId,
      lead: campaignLead.lead,
      sequenceId: firstStep.id,
      stepOrder: firstStep.stepOrder,
      actionType: firstStep.stepOrder === 1 && firstStep.actionType === 'message'
        ? 'connection_request'
        : firstStep.actionType || 'connection_request',
      content: firstStep.messageTemplate,
      linkedinAccountId: campaign.linkedinAccount.id,
      scheduledAt,
    })
    scheduled += 1
  }

  await recordAnalyticsEvent({
    workspaceId: campaign.workspaceId,
    campaignId,
    type: 'campaign_jobs_scheduled',
    value: scheduled,
  })

  if (runId) {
    await prisma.campaignRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        totals: {
          scheduled,
          leads: campaign.campaignLeads.length,
          steps: campaign.sequences.length,
        },
      },
    })
  }

  return { scheduled }
}

export async function scheduleCampaignLeadStep(input: {
  campaignId: string
  workspaceId: string
  leadId: string
  lead?: {
    firstName: string | null
    lastName: string | null
    title: string | null
    company: string | null
    industry: string | null
    location: string | null
    customAttributes: unknown
    linkedinProfileUrl: string | null
  }
  sequenceId: string
  stepOrder: number
  actionType: string
  content: string
  linkedinAccountId: string
  scheduledAt: Date
}) {
  const lead = input.lead || await prisma.lead.findUnique({
    where: { id: input.leadId },
  })

  if (!lead) {
    throw new Error('Lead not found')
  }

  const content = renderLeadTemplate(input.content, lead)

  const message = await prisma.message.create({
    data: {
      campaignId: input.campaignId,
      leadId: input.leadId,
      linkedinAccountId: input.linkedinAccountId,
      sequenceId: input.sequenceId,
      direction: 'outbound',
      content,
      status: 'scheduled',
    },
  })

  await queueLinkedInAction({
    workspaceId: input.workspaceId,
    linkedinAccountId: input.linkedinAccountId,
    type: input.actionType,
    messageId: message.id,
    payload: {
      campaignId: input.campaignId,
      leadId: input.leadId,
      sequenceId: input.sequenceId,
      stepOrder: input.stepOrder,
      linkedinProfileUrl: lead.linkedinProfileUrl,
      content,
    },
    scheduledAt: input.scheduledAt,
  })

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
      lastError: null,
    },
  })
}

export async function recordCampaignLeadEvent(input: {
  campaignId: string
  leadId: string
  actorId: string
  event: 'accepted' | 'replied' | 'failed'
  note?: string
}) {
  const campaign = await assertCampaignAdmin(input.campaignId, input.actorId)
  const campaignLead = await prisma.campaignLead.findUnique({
    where: {
      campaignId_leadId: {
        campaignId: input.campaignId,
        leadId: input.leadId,
      },
    },
    include: { lead: true },
  })

  if (!campaignLead) {
    throw new Error('Lead is not assigned to this campaign')
  }

  if (input.event === 'replied') {
    return prisma.campaignLead.update({
      where: {
        campaignId_leadId: {
          campaignId: input.campaignId,
          leadId: input.leadId,
        },
      },
      data: {
        status: 'replied',
        completedAt: new Date(),
        notes: input.note || campaignLead.notes,
      },
    })
  }

  if (input.event === 'failed') {
    return prisma.campaignLead.update({
      where: {
        campaignId_leadId: {
          campaignId: input.campaignId,
          leadId: input.leadId,
        },
      },
      data: {
        status: 'failed',
        lastError: input.note || 'Marked failed',
      },
    })
  }

  const nextStep = await prisma.sequence.findFirst({
    where: {
      campaignId: input.campaignId,
      stepOrder: { gt: campaignLead.currentStep },
    },
    orderBy: { stepOrder: 'asc' },
  })

  if (!nextStep || !campaign.linkedinAccountId) {
    return prisma.campaignLead.update({
      where: {
        campaignId_leadId: {
          campaignId: input.campaignId,
          leadId: input.leadId,
        },
      },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })
  }

  await prisma.campaignLead.update({
    where: {
      campaignId_leadId: {
        campaignId: input.campaignId,
        leadId: input.leadId,
      },
    },
    data: {
      status: 'accepted',
      notes: input.note || campaignLead.notes,
    },
  })

  return scheduleCampaignLeadStep({
    campaignId: input.campaignId,
    workspaceId: campaign.workspaceId,
    leadId: input.leadId,
    lead: campaignLead.lead,
    sequenceId: nextStep.id,
    stepOrder: nextStep.stepOrder,
    actionType: nextStep.actionType || 'message',
    content: nextStep.messageTemplate,
    linkedinAccountId: campaign.linkedinAccountId,
    scheduledAt: addDays(new Date(), nextStep.waitDays),
  })
}

export function renderLeadTemplate(template: string, lead: {
  firstName: string | null
  lastName: string | null
  title: string | null
  company: string | null
  industry: string | null
  location: string | null
  customAttributes?: unknown
}) {
  const customAttributes = isRecord(lead.customAttributes) ? lead.customAttributes : {}
  const values: Record<string, string> = {
    firstName: lead.firstName || 'there',
    lastName: lead.lastName || '',
    title: lead.title || 'your role',
    company: lead.company || 'your company',
    industry: lead.industry || 'your industry',
    location: lead.location || '',
  }

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const customValue = customAttributes[key]
    if (typeof customValue === 'string' || typeof customValue === 'number') {
      return String(customValue)
    }
    return values[key] || ''
  })
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + Math.max(0, days || 0))
  return next
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
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
