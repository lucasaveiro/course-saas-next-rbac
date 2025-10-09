import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getOrders(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/stores/:storeSlug/orders',
      {
        schema: {
          tags: ['Orders'],
          summary: 'List orders from a store (paginated)',
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
              orders: z.array(
                z.object({
                  id: z.string().uuid(),
                  status: z.string(),
                  total: z.string(),
                  taxAmount: z.string().nullable(),
                  customerId: z.string().uuid().nullable(),
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
        if (cannot('get', 'Store')) {
          throw new UnauthorizedError(
            `You're not allowed to list orders.`,
          )
        }

        const store = await prisma.store.findFirst({
          where: { slug: storeSlug, organizationId: organization.id },
          select: { id: true },
        })

        if (!store) {
          throw new BadRequestError('Store not found.')
        }

        const [orders, total] = await Promise.all([
          prisma.order.findMany({
            where: { storeId: store.id },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * perPage,
            take: perPage,
            select: {
              id: true,
              status: true,
              total: true,
              taxAmount: true,
              customerId: true,
              storeId: true,
              organizationId: true,
              createdAt: true,
            },
          }),
          prisma.order.count({ where: { storeId: store.id } }),
        ])

        return reply.send({ orders, meta: { page, perPage, total } })
      },
    )
}