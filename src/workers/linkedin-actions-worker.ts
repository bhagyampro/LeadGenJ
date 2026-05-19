import { Worker } from 'bullmq'
import { QUEUE_NAMES, queueConnection } from '@/lib/queue'
import { performLinkedInAction } from '@/services/linkedin-automation-service'

export const linkedinActionsWorker = new Worker(
  QUEUE_NAMES.linkedinActions,
  async (job) => {
    const { actionId } = job.data as {
      actionId: string
    }

    await performLinkedInAction(actionId)
  },
  { connection: queueConnection, concurrency: Number(process.env.LINKEDIN_WORKER_CONCURRENCY || 3) }
)
