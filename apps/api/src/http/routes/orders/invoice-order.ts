import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'

export async function invoiceOrder(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/orders/:orderId/invoice',
      {
        schema: {
          tags: ['Orders'],
          summary: 'Emitir nota fiscal do pedido (simulado)',
          params: z.object({ storeSlug: z.string(), orderId: z.string().uuid() }),
          response: {
            201: z.object({ invoiceNumber: z.string(), status: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { storeSlug, orderId } = request.params

        const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
        if (!store) throw new BadRequestError('Store not found.')

        const order = await prisma.order.findUnique({ where: { id: orderId } })
        if (!order || order.storeId !== store.id) throw new BadRequestError('Invalid order.')

        const invoiceNumber = `INV-${Math.floor(Math.random() * 1_000_000)}`

        await prisma.order.update({ where: { id: order.id }, data: { status: 'INVOICED' } })

        return reply.status(201).send({ invoiceNumber, status: 'INVOICED' })
      },
    )
}