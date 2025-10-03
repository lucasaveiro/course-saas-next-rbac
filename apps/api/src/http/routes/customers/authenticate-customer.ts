import { compare, hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export async function authenticateCustomer(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/account/login',
      {
        schema: {
          tags: ['Customers'],
          summary: 'Authenticate a customer in a store',
          body: z.object({
            email: z.string().email(),
            password: z.string(),
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
        const { email, password } = request.body

        const store = await prisma.store.findUnique({
          where: { slug: storeSlug },
          select: { id: true, organizationId: true },
        })

        if (!store) {
          throw new BadRequestError('Store not found.')
        }

        const customer = await prisma.customer.findFirst({
          where: { email, organizationId: store.organizationId },
          include: { credential: true },
        })

        if (!customer || !customer.credential) {
          throw new BadRequestError('Invalid credentials.')
        }

        const isPasswordValid = await compare(
          password,
          customer.credential.passwordHash,
        )

        if (!isPasswordValid) {
          throw new BadRequestError('Invalid credentials.')
        }

        // Short-lived access token (15 minutes), audience restricted to customers
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