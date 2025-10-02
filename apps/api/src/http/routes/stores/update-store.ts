/* eslint-disable prettier/prettier */
import { storeSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function updateStore(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/stores/:storeId',
      {
        schema: {
          tags: ['Stores'],
          summary: 'Update a store',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            description: z.string(),
          }),
          params: z.object({
            slug: z.string(),
            storeId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, storeId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(slug)

        const store = await prisma.project.findUnique({
          where: {
            id: storeId,
            organizationId: organization.id,
          },
        })

        if (!store) {
          throw new BadRequestError('Store not found.')
        }

        const { cannot } = getUserPermissions(userId, membership.role)
        const authStore = storeSchema.parse(store)

        if (cannot('update', authStore)) {
          throw new UnauthorizedError(
            `You're not allowed to update this store.`,
          )
        }

        const { name, description } = request.body

        await prisma.project.update({
          where: {
            id: storeId,
          },
          data: {
            name,
            description,
          },
        })

        return reply.status(204).send()
      },
    )
}
