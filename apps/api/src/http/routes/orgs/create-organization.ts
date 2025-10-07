import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/utils/create-slug'

export async function createOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Create a new organization',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            domain: z.string().nullish(),
            shouldAttachUsersByDomain: z.boolean().optional(),
          }),
          response: {
            201: z.object({
              organizationId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { name, domain, shouldAttachUsersByDomain } = request.body
        let organization;

        try {
          // Check for existing domain before attempting to create
          if (domain) {
            const organizationByDomain = await prisma.organization.findUnique({
              where: {
                domain,
              },
            })

            if (organizationByDomain) {
              throw new BadRequestError(
                'Another organization with same domain already exists.',
              )
            }
          }

          organization = await prisma.organization.create({
            data: {
              name,
              slug: createSlug(name),
              domain,
              shouldAttachUsersByDomain,
              ownerId: userId,
              members: {
                create: {
                  userId,
                  role: 'ADMIN',
                },
              },
            },
          })
        } catch (error: unknown) {
          // Handle Prisma unique constraint errors
          if (
            typeof error === 'object' && 
            error !== null && 
            'code' in error && 
            error.code === 'P2002' && 
            'meta' in error && 
            error.meta && 
            typeof error.meta === 'object' && 
            'target' in error.meta && 
            Array.isArray(error.meta.target) && 
            error.meta.target.includes('domain')
          ) {
            throw new BadRequestError(
              'Another organization with same domain already exists.',
            )
          }
          
          // Re-throw other errors
          throw error
        }

        return reply.status(201).send({
          organizationId: organization.id,
        })
      },
    )
}
