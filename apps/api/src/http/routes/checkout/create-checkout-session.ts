import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { calculateShipping, calculateTaxes, sumSubtotal } from '@/modules/checkout/pricing'
import { computeRiskScore, isHighRisk } from '@/modules/checkout/antifraud'
import { getPaymentProvider } from '@/lib/payments'

export async function createCheckoutSession(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/checkout/sessions',
      {
        schema: {
          tags: ['Checkout'],
          summary: 'Create checkout session consolidating cart and address',
          headers: z.object({ 'x-cart-id': z.string().uuid() }),
          params: z.object({ storeSlug: z.string() }),
          body: z.object({
            customerEmail: z.string().email().optional(),
            address: z.object({
              line1: z.string(),
              line2: z.string().optional(),
              city: z.string(),
              state: z.string().optional(),
              postalCode: z.string(),
              country: z.string(),
            }),
          }),
          response: {
            201: z.object({
              sessionId: z.string().uuid(),
              subtotal: z.string(),
              taxAmount: z.string(),
              shippingAmount: z.string(),
              total: z.string(),
              riskScore: z.number(),
              paymentIntentClientSecret: z.string().optional(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { storeSlug } = request.params
        const cartId = request.headers['x-cart-id'] as string
        const { address, customerEmail } = request.body

        const store = await prisma.store.findUnique({
          where: { slug: storeSlug },
          select: { id: true, organizationId: true },
        })
        if (!store) throw new BadRequestError('Store not found.')

        const storeSetting = await prisma.storeSetting.findUnique({
          where: { storeId: store.id },
          select: { currency: true },
        })

        const cart = await prisma.cart.findUnique({ where: { id: cartId }, select: { id: true, storeId: true } })
        if (!cart || cart.storeId !== store.id) throw new BadRequestError('Invalid cart.')

        const items = await prisma.cartItem.findMany({
          where: { cartId },
          select: { id: true, quantity: true, unitPrice: true, totalPrice: true },
        })
        if (items.length === 0) throw new BadRequestError('Cart is empty.')

        // Re-check inventory availability before session creation
        const variants = await prisma.cartItem.findMany({
          where: { cartId },
          select: { quantity: true, variantId: true },
        })
        for (const v of variants) {
          if (!v.variantId) continue
          const pv = await prisma.productVariant.findUnique({
            where: { id: v.variantId },
            select: { inventoryQuantity: true },
          })
          if (!pv || pv.inventoryQuantity < v.quantity) {
            return reply.status(409).send({ message: 'Insufficient inventory for one or more items.' })
          }
        }

        const subtotal = sumSubtotal(items.map((i) => ({ totalPrice: i.totalPrice })))

        const taxRate = await prisma.taxRate.findFirst({
          where: { storeId: store.id, OR: [{ country: address.country }, { state: address.state ?? undefined }] },
          select: { percentage: true },
        })
        const taxAmount = calculateTaxes({ subtotal, taxRatePercentage: taxRate?.percentage })
        const shippingAmount = calculateShipping({ country: address.country, state: address.state })
        const total = subtotal.add(taxAmount).add(shippingAmount)

        const riskScore = computeRiskScore({
          subtotal,
          shippingCountry: address.country,
          customerEmail,
          itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
        })
        if (isHighRisk(riskScore)) {
          return reply.status(403).send({ message: 'Checkout blocked by antifraud.' })
        }

        const provider = getPaymentProvider()
        const paymentIntent = await provider.createPaymentIntent({
          amount: Number(total.toString()),
          currency: storeSetting?.currency ?? 'USD',
          metadata: { storeId: store.id, cartId },
        })

        const session = await prisma.checkoutSession.create({
          data: {
            status: 'PENDING',
            riskScore,
            customerEmail: customerEmail ?? null,
            line1: address.line1,
            line2: address.line2 ?? null,
            city: address.city,
            state: address.state ?? null,
            postalCode: address.postalCode,
            country: address.country,
            subtotal,
            taxAmount,
            shippingAmount,
            total,
            organizationId: store.organizationId,
            storeId: store.id,
            cartId,
            paymentIntentId: paymentIntent.id,
          },
          select: { id: true, subtotal: true, taxAmount: true, shippingAmount: true, total: true, riskScore: true },
        })

        return reply.status(201).send({
          sessionId: session.id,
          subtotal: session.subtotal.toString(),
          taxAmount: session.taxAmount.toString(),
          shippingAmount: session.shippingAmount.toString(),
          total: session.total.toString(),
          riskScore: session.riskScore,
          paymentIntentClientSecret: paymentIntent.clientSecret,
        })
      },
    )
}