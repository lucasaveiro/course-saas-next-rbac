import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getPaymentProvider } from '@/lib/payments'

export async function pagarmeWebhook(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/webhooks/pagarme',
      {
        schema: {
          tags: ['Payments'],
          summary: 'Pagar.me webhook handler',
          body: z.object({ type: z.string().optional(), data: z.any() }).passthrough(),
        },
      },
      async (request, reply) => {
        const signature = (request.headers['x-pagarme-signature'] || request.headers['pagarme-signature']) as string | undefined
        const rawBody = JSON.stringify(request.body)
        const provider = getPaymentProvider()

        const isValid = provider.verifyWebhook({ signature, rawBody })
        if (!isValid) {
          return reply.status(400).send({ message: 'Invalid webhook signature' })
        }

        const evt = request.body as any
        const intentId = evt.data?.id || evt.data?.transactionId
        const status = evt.data?.status || 'paid'

        if (intentId) {
          const payment = await prisma.payment.findFirst({ where: { providerTransactionId: intentId } })
          if (payment) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: status.toUpperCase?.() ?? 'SUCCEEDED' },
            })
          }
        }

        return reply.status(200).send({ received: true })
      },
    )
}