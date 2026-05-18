import { Queue, type JobsOptions } from 'bullmq'
import IORedis from 'ioredis'

export const QUEUE_NAMES = {
  linkedinActions: 'linkedin-actions',
  campaignExecution: 'campaign-execution',
  messageSending: 'message-sending',
  leadScraping: 'lead-scraping',
  analyticsProcessing: 'analytics-processing',
  webhookDelivery: 'webhook-delivery',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

export interface CampaignExecutionJob {
  campaignId: string
  workspaceId: string
  runId?: string
}

export interface MessageSendingJob {
  leadId: string
  campaignId: string
  sequenceId: string
  content: string
  linkedinAccountId: string
}

export interface LinkedInActionJob {
  actionId: string
  workspaceId: string
  linkedinAccountId: string
  actionType: 'connection_request' | 'message' | 'profile_visit' | 'withdraw_invite'
  payload: Record<string, unknown>
}

export interface LeadScrapingJob {
  workspaceId: string
  source: 'csv_import' | 'official_api_import' | 'manual_import'
  payload: Record<string, unknown>
}

export interface AnalyticsProcessingJob {
  workspaceId: string
  campaignId?: string
  eventType: string
  value?: number
  dimensions?: Record<string, unknown>
}

export interface WebhookDeliveryJob {
  deliveryId: string
  webhookId: string
}

export const queueConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 100, 2000),
})

queueConnection.on('error', () => {
  // Queue commands surface their own errors; keep imports/builds from noisy Redis event logs.
})

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: 500,
  removeOnFail: false,
}

function createQueue<DataType>(name: QueueName) {
  return new Queue<DataType>(name, {
    connection: queueConnection,
    defaultJobOptions,
  })
}

let campaignExecutionQueue: Queue<CampaignExecutionJob> | undefined
let messageSendingQueue: Queue<MessageSendingJob> | undefined
let linkedinActionsQueue: Queue<LinkedInActionJob> | undefined
let leadScrapingQueue: Queue<LeadScrapingJob> | undefined
let analyticsProcessingQueue: Queue<AnalyticsProcessingJob> | undefined
let webhookDeliveryQueue: Queue<WebhookDeliveryJob> | undefined

export function getCampaignExecutionQueue() {
  campaignExecutionQueue ||= createQueue<CampaignExecutionJob>(QUEUE_NAMES.campaignExecution)
  return campaignExecutionQueue
}

export function getMessageSendingQueue() {
  messageSendingQueue ||= createQueue<MessageSendingJob>(QUEUE_NAMES.messageSending)
  return messageSendingQueue
}

export function getLinkedinActionsQueue() {
  linkedinActionsQueue ||= createQueue<LinkedInActionJob>(QUEUE_NAMES.linkedinActions)
  return linkedinActionsQueue
}

export function getLeadScrapingQueue() {
  leadScrapingQueue ||= createQueue<LeadScrapingJob>(QUEUE_NAMES.leadScraping)
  return leadScrapingQueue
}

export function getAnalyticsProcessingQueue() {
  analyticsProcessingQueue ||= createQueue<AnalyticsProcessingJob>(QUEUE_NAMES.analyticsProcessing)
  return analyticsProcessingQueue
}

export function getWebhookDeliveryQueue() {
  webhookDeliveryQueue ||= createQueue<WebhookDeliveryJob>(QUEUE_NAMES.webhookDelivery)
  return webhookDeliveryQueue
}

export async function enqueueCampaignExecution(data: CampaignExecutionJob, options?: JobsOptions) {
  return getCampaignExecutionQueue().add('execute-campaign', data, options)
}

export async function scheduleMessage(
  leadId: string,
  campaignId: string,
  sequenceId: string,
  content: string,
  linkedinAccountId: string,
  scheduledAt: Date
) {
  return getMessageSendingQueue().add(
    'send-message',
    {
      leadId,
      campaignId,
      sequenceId,
      content,
      linkedinAccountId,
    },
    {
      delay: Math.max(0, scheduledAt.getTime() - Date.now()),
    }
  )
}

export async function enqueueLinkedInAction(data: LinkedInActionJob, scheduledAt = new Date()) {
  return getLinkedinActionsQueue().add('perform-linkedin-action', data, {
    delay: Math.max(0, scheduledAt.getTime() - Date.now()),
  })
}

export async function enqueueAnalyticsEvent(data: AnalyticsProcessingJob) {
  return getAnalyticsProcessingQueue().add('record-analytics-event', data)
}

export async function enqueueWebhookDelivery(data: WebhookDeliveryJob, scheduledAt = new Date()) {
  return getWebhookDeliveryQueue().add('deliver-webhook', data, {
    delay: Math.max(0, scheduledAt.getTime() - Date.now()),
  })
}

export async function cancelScheduledMessages(leadId: string, campaignId: string) {
  const jobs = await getMessageSendingQueue().getJobs(['waiting', 'delayed'])
  for (const job of jobs) {
    if (job && job.data.leadId === leadId && job.data.campaignId === campaignId) {
      await job.remove()
    }
  }
}
