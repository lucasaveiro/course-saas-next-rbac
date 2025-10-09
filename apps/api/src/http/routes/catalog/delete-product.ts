import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function deleteProduct(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/stores/:storeId/products/:productId',
      {
        schema: {
          tags: ['Catalog'],
          summary: 'Delete a product',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            storeId: z.string().uuid(),
            productId: z.string().uuid(),
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
        if (cannot('delete', 'Product')) {
          throw new UnauthorizedError("You're not allowed to delete products.")
        }

        // Ensure product belongs to the organization and store
        const product = await prisma.product.findFirst({
          where: { id: productId, organizationId: organization.id, storeId },
          select: { id: true },
        })

        if (!product) {
          throw new BadRequestError('Product not found.')
        }

        await prisma.product.delete({ where: { id: productId } })

        return reply.status(204).send()
      },
    )
}
