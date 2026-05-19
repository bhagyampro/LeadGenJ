import { Worker } from 'bullmq'
import { QUEUE_NAMES, queueConnection } from '@/lib/queue'
import { scheduleCampaignRun } from '@/services/campaign-engine'

export const campaignExecutionWorker = new Worker(
  QUEUE_NAMES.campaignExecution,
  async (job) => {
    const { campaignId, runId } = job.data as { campaignId: string; runId?: string }
    await scheduleCampaignRun(campaignId, runId)
  },
  { connection: queueConnection, concurrency: Number(process.env.CAMPAIGN_WORKER_CONCURRENCY || 5) }
)
