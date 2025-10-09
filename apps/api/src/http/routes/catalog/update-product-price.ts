import { Prisma } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function updateProductPrice(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/stores/:storeId/products/:productId/price',
      {
        schema: {
          tags: ['Catalog'],
          summary: 'Update product price (default variant)',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            storeId: z.string().uuid(),
            productId: z.string().uuid(),
          }),
          body: z.object({
            price: z.string(),
          }),
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, storeId, productId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)
        if (cannot('update', 'Product')) {
          throw new UnauthorizedError("You're not allowed to update products.")
        }

        const product = await prisma.product.findFirst({
          where: { id: productId, organizationId: organization.id, storeId },
          select: { id: true, slug: true },
        })
        if (!product) {
          throw new BadRequestError('Product not found in this store.')
        }

        const defaultVariant = await prisma.productVariant.findFirst({
          where: { productId: product.id },
          orderBy: { createdAt: 'asc' },
        })

        if (defaultVariant) {
          await prisma.productVariant.update({
            where: { id: defaultVariant.id },
            data: { price: new Prisma.Decimal(request.body.price) },
            select: { id: true },
          })
        } else {
          const storeSetting = await prisma.storeSetting.findUnique({
            where: { storeId },
            select: { currency: true },
          })
          const currency = storeSetting?.currency ?? 'USD'
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: `${product.slug}-default`,
              price: new Prisma.Decimal(request.body.price),
              currency,
              inventoryQuantity: 0,
            },
            select: { id: true },
          })
        }

        return reply.status(204).send()
      },
    )
}
