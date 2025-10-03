import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getProducts(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/stores/:storeSlug/products',
      {
        schema: {
          tags: ['Catalog'],
          summary: 'List products from a store (paginated)',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            storeSlug: z.string(),
          }),
          querystring: z.object({
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(100).default(10),
          }),
          response: {
            200: z.object({
              products: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  description: z.string().nullable(),
                  slug: z.string(),
                  storeId: z.string().uuid(),
                  organizationId: z.string().uuid(),
                  createdAt: z.date(),
                }),
              ),
              meta: z.object({
                page: z.number(),
                perPage: z.number(),
                total: z.number(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug, storeSlug } = request.params
        const { page, perPage } = request.query

        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)
        if (cannot('get', 'Product')) {
          throw new UnauthorizedError(
            `You're not allowed to list products.`,
          )
        }

        const store = await prisma.store.findUnique({
          where: { slug: storeSlug, organizationId: organization.id },
          select: { id: true },
        })

        if (!store) {
          throw new BadRequestError('Store not found.')
        }

        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where: { storeId: store.id },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * perPage,
            take: perPage,
          }),
          prisma.product.count({ where: { storeId: store.id } }),
        ])

        return reply.send({ products, meta: { page, perPage, total } })
      },
    )
}