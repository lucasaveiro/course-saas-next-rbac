import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'

export async function startFulfillment(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/orders/:orderId/fulfillment',
      {
        schema: {
          tags: ['Orders'],
          summary: 'Iniciar fulfillment do pedido (simulado)',
          params: z.object({ storeSlug: z.string(), orderId: z.string().uuid() }),
          response: {
            201: z.object({ fulfillmentId: z.string(), status: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { storeSlug, orderId } = request.params

        const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
        if (!store) throw new BadRequestError('Store not found.')

        const order = await prisma.order.findUnique({ where: { id: orderId } })
        if (!order || order.storeId !== store.id) throw new BadRequestError('Invalid order.')

        const fulfillment = await prisma.fulfillment.create({
          data: {
            orderId: order.id,
            status: 'READY',
          },
        })

        await prisma.order.update({ where: { id: order.id }, data: { status: 'FULFILLMENT_READY' } })

        return reply.status(201).send({ fulfillmentId: fulfillment.id, status: 'FULFILLMENT_READY' })
      },
    )
}