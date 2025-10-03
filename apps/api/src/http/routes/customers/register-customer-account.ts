import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export async function registerCustomerAccount(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/account/register',
      {
        schema: {
          tags: ['Customers'],
          summary: 'Register a customer account for a store',
          body: z.object({
            name: z.string().min(1),
            email: z.string().email(),
            password: z.string().min(6),
          }),
          params: z.object({
            storeSlug: z.string(),
          }),
          response: {
            201: z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
              expiresIn: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { storeSlug } = request.params
        const { name, email, password } = request.body

        const store = await prisma.store.findUnique({
          where: { slug: storeSlug },
          select: { id: true, organizationId: true },
        })

        if (!store) {
          throw new BadRequestError('Store not found.')
        }

        const alreadyExists = await prisma.customer.findFirst({
          where: { email, organizationId: store.organizationId },
          select: { id: true },
        })

        if (alreadyExists) {
          throw new BadRequestError('E-mail already registered.')
        }

        const passwordHash = await hash(password, 10)

        const customer = await prisma.customer.create({
          data: {
            name,
            email,
            organizationId: store.organizationId,
            storeId: store.id,
            credential: {
              create: {
                passwordHash,
              },
            },
          },
        })

        // Issue short-lived access token (15 minutes)
        const accessToken = await reply.jwtSign(
          {
            sub: customer.id,
            aud: 'customer',
            orgId: store.organizationId,
            storeId: store.id,
          },
          {
            sign: { expiresIn: '15m' },
          },
        )

        // Create refresh token linked to the customer
        const { randomBytes, randomUUID } = await import('crypto')
        const raw = randomBytes(32).toString('hex')
        const id = randomUUID()
        const tokenPlain = `${id}.${raw}`
        const tokenHash = await hash(raw, 10)

        await prisma.customerRefreshToken.create({
          data: {
            id,
            tokenHash,
            customerId: customer.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
          },
        })

        return reply.status(201).send({
          accessToken,
          refreshToken: tokenPlain,
          expiresIn: 15 * 60,
        })
      },
    )
}