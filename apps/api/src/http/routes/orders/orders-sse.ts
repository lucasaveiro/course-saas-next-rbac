import type { FastifyInstance } from 'fastify'

import { prisma } from '@/lib/prisma'

export async function ordersSSE(app: FastifyInstance) {
  app.get('/stores/:storeSlug/orders/stream', async (request, reply) => {
    const { storeSlug } = request.params as { storeSlug: string }

    const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
    if (!store) {
      reply.code(404).send({ message: 'Store not found.' })
      return
    }

    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.flushHeaders()

    const sendSnapshot = async () => {
      const orders = await prisma.order.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true },
        take: 50,
      })
      reply.raw.write(`data: ${JSON.stringify({ type: 'orders:update', orders })}\n\n`)
    }

    await sendSnapshot()

    const interval = setInterval(sendSnapshot, 5000)

    request.raw.on('close', () => {
      clearInterval(interval)
    })
  })
}