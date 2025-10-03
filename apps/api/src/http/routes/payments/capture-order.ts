import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { getPaymentProvider } from '@/lib/payments'

export async function captureOrderPayment(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/payments/capture',
      {
        schema: {
          tags: ['Payments'],
          summary: 'Capturar pagamento de um pedido',
          params: z.object({ storeSlug: z.string() }),
          body: z.object({ orderId: z.string().uuid() }),
          response: {
            201: z.object({ status: z.string(), transactionId: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { storeSlug } = request.params
        const { orderId } = request.body

        const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
        if (!store) throw new BadRequestError('Store not found.')

        const order = await prisma.order.findUnique({ where: { id: orderId } })
        if (!order || order.storeId !== store.id) throw new BadRequestError('Invalid order.')

        const payment = await prisma.payment.findUnique({ where: { orderId } })
        if (!payment || !payment.providerTransactionId) throw new BadRequestError('Payment not found or invalid.')

        const provider = getPaymentProvider()
        const capture = await provider.capturePayment(payment.providerTransactionId)

        const updated = await prisma.payment.update({
          where: { id: payment.id },
          data: { status: capture.status === 'succeeded' ? 'SUCCEEDED' : 'FAILED' },
        })

        return reply.status(201).send({ status: updated.status, transactionId: payment.providerTransactionId })
      },
    )
}