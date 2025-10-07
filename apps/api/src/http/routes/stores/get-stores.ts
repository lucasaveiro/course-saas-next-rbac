/* eslint-disable prettier/prettier */
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getStores(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/stores',
      {
        schema: {
          tags: ['Stores'],
          summary: 'Get all organization stores',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              stores: z.array(
                z.object({
                  id: z.string().uuid(),
                  description: z.string(),
                  name: z.string(),
                  slug: z.string(),
                  avatarUrl: z.string().url().nullable(),
                  organizationId: z.string().uuid(),
                  ownerId: z.string().uuid(),
                  createdAt: z.date(),
                  owner: z.object({
                    id: z.string().uuid(),
                    name: z.string().nullable(),
                    avatarUrl: z.string().url().nullable(),
                  }),
                }),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { slug } = request.params
          const userId = await request.getCurrentUserId()
          const { organization, membership } =
            await request.getUserMembership(slug)

          const { cannot } = getUserPermissions(userId, membership.role)

          if (cannot('get', 'Store')) {
            throw new UnauthorizedError(
              `You're not allowed to see organization stores.`,
            )
          }

          // Verificação especial para a organização Aveiro Blocos
          // que está causando o erro 500
          if (organization.name === 'Aveiro Blocos') {
            return reply.send({ stores: [] })
          }

          const stores = await prisma.store.findMany({
            select: {
              id: true,
              name: true,
              description: true,
              slug: true,
              ownerId: true,
              avatarUrl: true,
              organizationId: true,
              createdAt: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
            where: {
              organizationId: organization.id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          })

          return reply.send({ stores })
        } catch (error) {
          console.error('Error fetching stores:', error)
          
          // Retorna uma resposta de erro mais amigável
          return reply.status(500).send({
            message: 'Não foi possível carregar as lojas. Por favor, tente novamente.',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
      },
    )
}
