import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getCustomers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/stores/:storeSlug/customers',
      {
        schema: {
          tags: ['Customers'],
          summary: 'List customers from a store (paginated)',
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
              customers: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  email: z.string().email(),
                  phone: z.string().nullable(),
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
            `You're not allowed to list customers.`,
          )
        }

        const store = await prisma.store.findFirst({
          where: { slug: storeSlug, organizationId: organization.id },
          select: { id: true },
        })

        if (!store) {
          throw new BadRequestError('Store not found.')
        }

        const [customers, total] = await Promise.all([
          prisma.customer.findMany({
            where: { storeId: store.id },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * perPage,
            take: perPage,
          }),
          prisma.customer.count({ where: { storeId: store.id } }),
        ])

        return reply.send({ customers, meta: { page, perPage, total } })
      },
    )
}