import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { enqueueWebhookDelivery } from '@/lib/queue'

export async function triggerWorkspaceWebhooks(input: {
  workspaceId: string
  event: string
  payload: Prisma.InputJsonObject
}) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      workspaceId: input.workspaceId,
      isActive: true,
      events: { has: input.event },
    },
  })

  const deliveries = await Promise.all(
    webhooks.map(async (webhook) => {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: input.event,
          payload: input.payload,
          status: 'pending',
        },
      })

      await enqueueWebhookDelivery({
        deliveryId: delivery.id,
        webhookId: webhook.id,
      })

      return delivery
    })
  )

  return deliveries
}

export async function deliverWebhook(deliveryId: string) {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhook: true },
  })

  if (!delivery) {
    throw new Error('Webhook delivery not found')
  }

  const body = JSON.stringify({
    event: delivery.event,
    deliveryId: delivery.id,
    data: delivery.payload,
  })
  const signature = delivery.webhook.secret
    ? crypto.createHmac('sha256', delivery.webhook.secret).update(body).digest('hex')
    : undefined

  try {
    const response = await fetch(delivery.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature ? { 'X-LeadGen-Signature': signature } : {}),
      },
      body,
    })

    const responseBody = await response.text()

    return prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        attempts: { increment: 1 },
        status: response.ok ? 'delivered' : 'failed',
        responseStatus: response.status,
        responseBody: responseBody.slice(0, 2000),
        deliveredAt: response.ok ? new Date() : null,
        nextAttemptAt: response.ok ? null : nextRetryAt(delivery.attempts + 1),
      },
    })
  } catch (error) {
    return prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        attempts: { increment: 1 },
        status: 'failed',
        error: error instanceof Error ? error.message : 'Webhook delivery failed',
        nextAttemptAt: nextRetryAt(delivery.attempts + 1),
      },
    })
  }
}

function nextRetryAt(attempts: number) {
  const delayMinutes = Math.min(60, 2 ** attempts)
  return new Date(Date.now() + delayMinutes * 60 * 1000)
}
