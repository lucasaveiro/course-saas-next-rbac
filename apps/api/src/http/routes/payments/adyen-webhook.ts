import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getPaymentProvider } from '@/lib/payments'

export async function adyenWebhook(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/webhooks/adyen',
      {
        schema: {
          tags: ['Payments'],
          summary: 'Adyen webhook handler',
          body: z.object({ eventCode: z.string().optional(), data: z.any() }).passthrough(),
        },
      },
      async (request, reply) => {
        const signature = (request.headers['x-adyen-signature'] || request.headers['adyen-signature']) as string | undefined
        const rawBody = JSON.stringify(request.body)
        const provider = getPaymentProvider()

        const isValid = provider.verifyWebhook({ signature, rawBody })
        if (!isValid) {
          return reply.status(400).send({ message: 'Invalid webhook signature' })
        }

        const evt = request.body as any
        const intentId = evt.data?.pspReference || evt.data?.paymentPspReference || evt.data?.id
        const success = evt.success ?? evt.data?.success ?? true

        if (intentId) {
          const payment = await prisma.payment.findFirst({ where: { providerTransactionId: intentId } })
          if (payment) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: success ? 'SUCCEEDED' : 'FAILED' },
            })
          }
        }

        return reply.status(200).send({ received: true })
      },
    )
}