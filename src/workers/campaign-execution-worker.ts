import { Worker } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { QUEUE_NAMES, queueConnection } from '@/lib/queue'
import { scheduleCampaignLeadStep } from '@/services/campaign-engine'
import { recordAnalyticsEvent } from '@/services/activity-service'

export const campaignExecutionWorker = new Worker(
  QUEUE_NAMES.campaignExecution,
  async (job) => {
    const { campaignId, runId } = job.data as { campaignId: string; runId?: string }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        sequences: { orderBy: { stepOrder: 'asc' } },
        campaignLeads: { where: { status: { in: ['pending', 'scheduled'] } } },
        linkedinAccount: true,
      },
    })

    if (!campaign || campaign.status !== 'active' || !campaign.linkedinAccount) {
      return
    }

    if (runId) {
      await prisma.campaignRun.update({
        where: { id: runId },
        data: { status: 'running', startedAt: new Date() },
      })
    }

    const firstStep = campaign.sequences[0]
    if (!firstStep) return

    for (const campaignLead of campaign.campaignLeads) {
      const scheduledAt = new Date(Date.now() + firstStep.waitDays * 24 * 60 * 60 * 1000)
      await scheduleCampaignLeadStep({
        campaignId,
        leadId: campaignLead.leadId,
        sequenceId: firstStep.id,
        content: firstStep.messageTemplate,
        linkedinAccountId: campaign.linkedinAccount.id,
        scheduledAt,
      })
    }

    await recordAnalyticsEvent({
      workspaceId: campaign.workspaceId,
      campaignId,
      type: 'campaign_jobs_scheduled',
      value: campaign.campaignLeads.length,
    })

    if (runId) {
      await prisma.campaignRun.update({
        where: { id: runId },
        data: {
          status: 'completed',
          finishedAt: new Date(),
          totals: {
            scheduled: campaign.campaignLeads.length,
          },
        },
      })
    }
  },
  { connection: queueConnection, concurrency: Number(process.env.CAMPAIGN_WORKER_CONCURRENCY || 5) }
)
