import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { makeProductService } from '@/modules/catalog/services/product-service'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function updateProduct(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/stores/:storeId/products/:productId',
      {
        schema: {
          tags: ['Catalog'],
          summary: 'Update a product',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            storeId: z.string().uuid(),
            productId: z.string().uuid(),
          }),
          body: z
            .object({
              name: z.string().min(2).optional(),
              description: z.string().nullable().optional(),
              slug: z.string().min(2).optional(),
            })
            .refine((data) => Object.keys(data).length > 0, {
              message: 'At least one field must be provided to update.',
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

        // Ensure product belongs to the organization and store
        const product = await prisma.product.findFirst({
          where: { id: productId, organizationId: organization.id, storeId },
          select: { id: true },
        })

        if (!product) {
          throw new BadRequestError('Product not found.')
        }

        const service = makeProductService()
        await service.updateProduct(
          productId,
          organization.id,
          storeId,
          request.body,
        )

        return reply.status(204).send()
      },
    )
}
