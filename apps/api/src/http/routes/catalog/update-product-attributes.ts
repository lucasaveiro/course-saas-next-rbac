import { Prisma } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function updateProductAttributes(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/stores/:storeId/products/:productId/attributes',
      {
        schema: {
          tags: ['Catalog'],
          summary: 'Update product physical attributes',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            storeId: z.string().uuid(),
            productId: z.string().uuid(),
          }),
          body: z.object({
            weight: z.string().optional(),
            width: z.string().optional(),
            length: z.string().optional(),
            depth: z.string().optional(),
            quantityPerPallet: z.number().int().min(0).optional(),
          }),
          response: {
            204: z.null(),
          },
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
          select: { id: true },
        })
        if (!product) {
          throw new BadRequestError('Product not found in this store.')
        }

        const { weight, width, length, depth, quantityPerPallet } = request.body

        await prisma.product.update({
          where: { id: productId },
          data: {
            weight: weight ? new Prisma.Decimal(weight) : undefined,
            width: width ? new Prisma.Decimal(width) : undefined,
            length: length ? new Prisma.Decimal(length) : undefined,
            depth: depth ? new Prisma.Decimal(depth) : undefined,
            quantityPerPallet: quantityPerPallet ?? undefined,
          },
          select: { id: true },
        })

        return reply.status(204).send()
      },
    )
}
