import { Worker } from 'bullmq'
import { QUEUE_NAMES, queueConnection } from '@/lib/queue'
import { deliverWebhook } from '@/services/webhook-service'

export const webhookDeliveryWorker = new Worker(
  QUEUE_NAMES.webhookDelivery,
  async (job) => {
    const { deliveryId } = job.data as { deliveryId: string }
    await deliverWebhook(deliveryId)
  },
  { connection: queueConnection, concurrency: Number(process.env.WEBHOOK_WORKER_CONCURRENCY || 10) }
)
