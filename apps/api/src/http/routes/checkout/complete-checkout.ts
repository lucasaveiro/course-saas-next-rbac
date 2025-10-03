import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { getPaymentProvider } from '@/lib/payments'
import { computeRiskScore, isHighRisk } from '@/modules/checkout/antifraud'

export async function completeCheckout(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/checkout/complete',
      {
        schema: {
          tags: ['Checkout'],
          summary: 'Complete checkout to create order and payment',
          params: z.object({ storeSlug: z.string() }),
          body: z.object({
            sessionId: z.string().uuid(),
            payment: z.object({ method: z.enum(['card', 'pix', 'boleto']), token: z.string() }),
          }),
          response: {
            201: z.object({ orderId: z.string().uuid(), paymentId: z.string().uuid() }),
          },
        },
      },
      async (request, reply) => {
        const { storeSlug } = request.params
        const { sessionId, payment } = request.body

        const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
        if (!store) throw new BadRequestError('Store not found.')

        const session = await prisma.checkoutSession.findUnique({ where: { id: sessionId } })
        if (!session || session.storeId !== store.id) throw new BadRequestError('Invalid session.')
        if (session.status !== 'PENDING') throw new BadRequestError('Session already completed or invalid status.')

        const cart = await prisma.cart.findUnique({ where: { id: session.cartId }, select: { id: true, customerId: true, organizationId: true, storeId: true } })
        if (!cart) throw new BadRequestError('Cart not found.')

        const items = await prisma.cartItem.findMany({ where: { cartId: cart.id }, select: { id: true, productId: true, variantId: true, quantity: true, unitPrice: true, totalPrice: true } })
        if (items.length === 0) throw new BadRequestError('Cart is empty.')

        // Re-validate inventory just before completion
        for (const item of items) {
          if (!item.variantId) continue
          const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId }, select: { inventoryQuantity: true } })
          if (!variant || variant.inventoryQuantity < item.quantity) {
            return reply.status(409).send({ message: 'Insufficient inventory at completion.' })
          }
        }

        // Optional secondary risk evaluation
        const riskScore = computeRiskScore({
          subtotal: session.subtotal,
          shippingCountry: session.country,
          customerEmail: session.customerEmail ?? null,
          itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
        })
        if (isHighRisk(riskScore)) {
          return reply.status(403).send({ message: 'Checkout blocked by antifraud.' })
        }

        const order = await prisma.$transaction(async (tx) => {
          // Create order
          const order = await tx.order.create({
            data: {
              status: 'PENDING',
              total: session.total,
              taxAmount: session.taxAmount,
              organizationId: cart.organizationId,
              storeId: cart.storeId,
              customerId: cart.customerId,
            },
          })

          // Create items
          for (const item of items) {
            await tx.orderItem.create({
              data: {
                orderId: order.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              },
            })
          }

          // Decrement inventory
          for (const item of items) {
            if (!item.variantId) continue
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { inventoryQuantity: { decrement: item.quantity } },
            })
          }

          // Capture payment through adapter
          const provider = getPaymentProvider()
          const intentId = session.paymentIntentId ?? payment.token
          const capture = await provider.capturePayment(intentId)

          const paymentRecord = await tx.payment.create({
            data: {
              orderId: order.id,
              amount: session.total,
              status: capture.status === 'succeeded' ? 'SUCCEEDED' : 'FAILED',
              method: payment.method,
              providerTransactionId: intentId,
            },
          })

          // Update cart and session
          await tx.cart.update({ where: { id: cart.id }, data: { status: 'CONVERTED' } })
          await tx.checkoutSession.update({ where: { id: session.id }, data: { status: 'COMPLETED', paymentIntentId: intentId } })

          return { orderId: order.id, paymentId: paymentRecord.id }
        })

        return reply.status(201).send(order)
      },
    )
}