import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { getPaymentProvider } from '@/lib/payments'

export async function refundOrder(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/payments/refund',
      {
        schema: {
          tags: ['Payments'],
          summary: 'Refund order payment via provider',
          params: z.object({ storeSlug: z.string() }),
          body: z.object({ orderId: z.string().uuid(), amount: z.number().optional() }),
          response: {
            201: z.object({ refundId: z.string(), status: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { storeSlug } = request.params
        const { orderId, amount } = request.body

        const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
        if (!store) throw new BadRequestError('Store not found.')

        const order = await prisma.order.findUnique({ where: { id: orderId } })
        if (!order || order.storeId !== store.id) throw new BadRequestError('Invalid order.')

        const payment = await prisma.payment.findUnique({ where: { orderId } })
        if (!payment || !payment.providerTransactionId) throw new BadRequestError('Payment not found or invalid.')

        const provider = getPaymentProvider()
        const result = await provider.refund({ transactionId: payment.providerTransactionId, amount })

        await prisma.payment.update({ where: { id: payment.id }, data: { status: result.status === 'succeeded' ? 'REFUNDED' : 'FAILED' } })

        return reply.status(201).send({ refundId: result.id, status: result.status })
      },
    )
}