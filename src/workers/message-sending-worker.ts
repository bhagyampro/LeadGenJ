import { Worker } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { QUEUE_NAMES, queueConnection } from '@/lib/queue'
import { queueLinkedInAction } from '@/services/linkedin-automation-service'

export const messageSendingWorker = new Worker(
  QUEUE_NAMES.messageSending,
  async (job) => {
    const data = job.data as {
      leadId: string
      campaignId: string
      sequenceId: string
      content: string
      linkedinAccountId: string
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
      select: { workspaceId: true, status: true },
    })

    if (!campaign || campaign.status !== 'active') {
      return
    }

    const message = await prisma.message.create({
      data: {
        campaignId: data.campaignId,
        leadId: data.leadId,
        linkedinAccountId: data.linkedinAccountId,
        sequenceId: data.sequenceId,
        direction: 'outbound',
        content: data.content,
        status: 'queued',
      },
    })

    const action = await queueLinkedInAction({
      workspaceId: campaign.workspaceId,
      linkedinAccountId: data.linkedinAccountId,
      type: 'message',
      payload: {
        leadId: data.leadId,
        messageId: message.id,
        content: data.content,
      },
    })

    await prisma.message.update({
      where: { id: message.id },
      data: { status: 'scheduled' },
    })

    await prisma.automationAction.update({
      where: { id: action.id },
      data: { messageId: message.id },
    })
  },
  { connection: queueConnection, concurrency: Number(process.env.MESSAGE_WORKER_CONCURRENCY || 10) }
)
