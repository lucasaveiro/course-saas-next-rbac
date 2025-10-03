import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getPaymentProvider } from '@/lib/payments'

export async function stripeWebhook(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/webhooks/stripe',
      {
        schema: {
          tags: ['Payments'],
          summary: 'Stripe webhook handler',
          body: z.object({ type: z.string(), data: z.any() }).passthrough(),
        },
      },
      async (request, reply) => {
        const signature = (request.headers['stripe-signature'] || request.headers['x-stripe-signature']) as string | undefined
        const rawBody = JSON.stringify(request.body)
        const provider = getPaymentProvider()

        const isValid = provider.verifyWebhook({ signature, rawBody })
        if (!isValid) {
          return reply.status(400).send({ message: 'Invalid webhook signature' })
        }

        const evt = request.body as any
        const type = evt.type
        const intentId = evt.data?.object?.id || evt.data?.intentId || evt.data?.id
        const status = evt.data?.object?.status || evt.data?.status

        if (type && intentId) {
          // Update payment record if exists
          const payment = await prisma.payment.findFirst({ where: { providerTransactionId: intentId } })
          if (payment) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: status?.toUpperCase?.() ?? 'SUCCEEDED' },
            })
          }
        }

        return reply.status(200).send({ received: true })
      },
    )
}