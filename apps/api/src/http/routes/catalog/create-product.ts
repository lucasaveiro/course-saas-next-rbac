import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { makeProductService } from '@/modules/catalog/services/product-service'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function createProduct(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/stores/:storeId/products',
      {
        schema: {
          tags: ['Catalog'],
          summary: 'Create a product in a store',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            storeId: z.string().uuid(),
          }),
          body: z.object({
            name: z.string().min(2),
            description: z.string().nullable().optional(),
          }),
          response: {
            201: z.object({
              productId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug, storeId } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)
        if (cannot('create', 'Product')) {
          throw new UnauthorizedError(
            `You're not allowed to create products.`,
          )
        }

        // Ensure store exists within organization context
        const store = await prisma.store.findFirst({
          where: { id: storeId, organizationId: organization.id },
          select: { id: true },
        })

        if (!store) {
          // Reuse 400 pattern to indicate invalid store
          return reply.status(400).send({ message: 'Store not found.' })
        }

        const { name, description } = request.body

        const productService = makeProductService()
        const created = await productService.createProduct({
          organizationId: organization.id,
          storeId: storeId,
          name,
          description,
        })

        return reply.status(201).send({ productId: created.id })
      },
    )
}