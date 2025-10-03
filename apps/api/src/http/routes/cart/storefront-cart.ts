import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'

export async function storefrontCart(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/cart',
      {
        schema: {
          tags: ['Cart'],
          summary: 'Create or get a cart for the store',
          headers: z.object({
            'x-cart-id': z.string().uuid().optional(),
            authorization: z.string().optional(),
          }).partial(),
          params: z.object({
            storeSlug: z.string(),
          }),
          response: {
            201: z.object({
              cartId: z.string().uuid(),
              items: z.array(
                z.object({
                  id: z.string().uuid(),
                  productId: z.string().uuid(),
                  variantId: z.string().uuid().nullable(),
                  quantity: z.number().int(),
                  unitPrice: z.string(),
                  totalPrice: z.string(),
                  inventoryQuantity: z.number().int().nullable(),
                  name: z.string(),
                }),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { storeSlug } = request.params
        const cartIdFromHeader = request.headers['x-cart-id'] as string | undefined

        const store = await prisma.store.findUnique({
          where: { slug: storeSlug },
          select: { id: true, organizationId: true },
        })

        if (!store) {
          throw new BadRequestError('Store not found.')
        }

        let cart = null as Awaited<ReturnType<typeof prisma.cart.findUnique>> | null

        if (cartIdFromHeader) {
          cart = await prisma.cart.findUnique({ where: { id: cartIdFromHeader } })
        }

        if (!cart) {
          cart = await prisma.cart.create({
            data: {
              organizationId: store.organizationId,
              storeId: store.id,
              status: 'OPEN',
            },
          })
        }

        const items = await prisma.cartItem.findMany({
          where: { cartId: cart.id },
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            productId: true,
            variantId: true,
            product: { select: { name: true } },
            variant: { select: { inventoryQuantity: true } },
          },
        })

        return reply.status(201).send({
          cartId: cart.id,
          items: items.map((i) => ({
            id: i.id,
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice.toString(),
            totalPrice: i.totalPrice.toString(),
            inventoryQuantity: i.variant?.inventoryQuantity ?? null,
            name: i.product.name,
          })),
        })
      },
    )

  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/cart/items',
      {
        schema: {
          tags: ['Cart'],
          summary: 'Add item to cart',
          headers: z.object({ 'x-cart-id': z.string().uuid() }),
          params: z.object({ storeSlug: z.string() }),
          body: z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1) }),
          response: { 201: z.object({ itemId: z.string().uuid() }) },
        },
      },
      async (request, reply) => {
        const { storeSlug } = request.params
        const cartId = request.headers['x-cart-id'] as string
        const { variantId, quantity } = request.body

        const store = await prisma.store.findUnique({
          where: { slug: storeSlug },
          select: { id: true, organizationId: true },
        })

        if (!store) throw new BadRequestError('Store not found.')

        const cart = await prisma.cart.findUnique({ where: { id: cartId } })
        if (!cart || cart.storeId !== store.id) throw new BadRequestError('Invalid cart.')

        const variant = await prisma.productVariant.findUnique({
          where: { id: variantId },
          select: { id: true, price: true, inventoryQuantity: true, product: { select: { id: true } } },
        })
        if (!variant) throw new BadRequestError('Variant not found.')

        if (variant.inventoryQuantity < quantity) {
          return reply.status(409).send({ message: 'Insufficient inventory', available: variant.inventoryQuantity })
        }

        // merge with existing line item if present
        const existing = await prisma.cartItem.findFirst({ where: { cartId, variantId } })

        const unitPrice = variant.price
        const totalPrice = new Prisma.Decimal(quantity).mul(unitPrice)

        let itemId: string
        if (existing) {
          const newQty = existing.quantity + quantity
          if (variant.inventoryQuantity < newQty) {
            return reply.status(409).send({ message: 'Insufficient inventory', available: variant.inventoryQuantity })
          }
          const newTotal = new Prisma.Decimal(newQty).mul(unitPrice)
          const updated = await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: newQty, unitPrice, totalPrice: newTotal },
            select: { id: true },
          })
          itemId = updated.id
        } else {
          const created = await prisma.cartItem.create({
            data: {
              cartId,
              productId: variant.product.id,
              variantId: variant.id,
              quantity,
              unitPrice,
              totalPrice,
            },
            select: { id: true },
          })
          itemId = created.id
        }

        return reply.status(201).send({ itemId })
      },
    )

  app
    .withTypeProvider<ZodTypeProvider>()
    .put(
      '/stores/:storeSlug/cart/items/:itemId',
      {
        schema: {
          tags: ['Cart'],
          summary: 'Update cart item quantity',
          headers: z.object({ 'x-cart-id': z.string().uuid() }),
          params: z.object({ storeSlug: z.string(), itemId: z.string().uuid() }),
          body: z.object({ quantity: z.number().int().min(1) }),
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { itemId, storeSlug } = request.params
        const cartId = request.headers['x-cart-id'] as string
        const { quantity } = request.body

        const store = await prisma.store.findUnique({
          where: { slug: storeSlug },
          select: { id: true },
        })
        if (!store) throw new BadRequestError('Store not found.')

        const item = await prisma.cartItem.findUnique({
          where: { id: itemId },
          select: { id: true, cartId: true, variantId: true, unitPrice: true },
        })
        if (!item || item.cartId !== cartId) throw new BadRequestError('Invalid cart item.')

        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId! },
          select: { inventoryQuantity: true },
        })
        if (!variant) throw new BadRequestError('Variant not found.')

        if (variant.inventoryQuantity < quantity) {
          return reply.status(409).send({ message: 'Insufficient inventory', available: variant.inventoryQuantity })
        }

        const newTotal = new Prisma.Decimal(quantity).mul(item.unitPrice)
        await prisma.cartItem.update({ where: { id: itemId }, data: { quantity, totalPrice: newTotal } })

        return reply.status(204).send()
      },
    )

  app
    .withTypeProvider<ZodTypeProvider>()
    .delete(
      '/stores/:storeSlug/cart/items/:itemId',
      {
        schema: {
          tags: ['Cart'],
          summary: 'Remove cart item',
          headers: z.object({ 'x-cart-id': z.string().uuid() }),
          params: z.object({ storeSlug: z.string(), itemId: z.string().uuid() }),
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { itemId } = request.params
        const cartId = request.headers['x-cart-id'] as string

        const item = await prisma.cartItem.findUnique({ select: { id: true, cartId: true }, where: { id: itemId } })
        if (!item || item.cartId !== cartId) throw new BadRequestError('Invalid cart item.')

        await prisma.cartItem.delete({ where: { id: itemId } })

        return reply.status(204).send()
      },
    )

  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/stores/:storeSlug/inventory/:variantId',
      {
        schema: {
          tags: ['Inventory'],
          summary: 'Get real-time inventory for a variant',
          params: z.object({ storeSlug: z.string(), variantId: z.string().uuid() }),
          response: { 200: z.object({ variantId: z.string().uuid(), inventoryQuantity: z.number().int() }) },
        },
      },
      async (request, reply) => {
        const { variantId } = request.params
        const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { id: true, inventoryQuantity: true } })
        if (!variant) throw new BadRequestError('Variant not found.')
        return reply.send({ variantId: variant.id, inventoryQuantity: variant.inventoryQuantity })
      },
    )
}