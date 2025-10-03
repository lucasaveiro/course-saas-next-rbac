import { compare, hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export async function refreshCustomerSession(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stores/:storeSlug/account/refresh',
      {
        schema: {
          tags: ['Customers'],
          summary: 'Refresh customer session with a refresh token',
          body: z.object({
            refreshToken: z.string(),
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
        const { refreshToken } = request.body

        const store = await prisma.store.findUnique({
          where: { slug: storeSlug },
          select: { id: true, organizationId: true },
        })

        if (!store) {
          throw new BadRequestError('Store not found.')
        }

        const [tokenId, raw] = refreshToken.split('.')

        if (!tokenId || !raw) {
          throw new BadRequestError('Malformed refresh token.')
        }

        const storedToken = await prisma.customerRefreshToken.findUnique({
          where: { id: tokenId },
        })

        if (!storedToken || storedToken.revokedAt) {
          throw new BadRequestError('Invalid refresh token.')
        }

        if (storedToken.expiresAt.getTime() < Date.now()) {
          throw new BadRequestError('Expired refresh token.')
        }

        const matches = await compare(raw, storedToken.tokenHash)

        if (!matches) {
          throw new BadRequestError('Invalid refresh token.')
        }

        const customer = await prisma.customer.findUnique({
          where: { id: storedToken.customerId },
        })

        if (!customer) {
          throw new BadRequestError('Customer not found.')
        }

        // Rotate current token
        await prisma.customerRefreshToken.update({
          where: { id: tokenId },
          data: { revokedAt: new Date() },
        })

        // Issue new short-lived access token (15 minutes)
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

        // Create new refresh token
        const { randomBytes, randomUUID } = await import('crypto')
        const rawNew = randomBytes(32).toString('hex')
        const newId = randomUUID()
        const tokenPlain = `${newId}.${rawNew}`
        const tokenHash = await hash(rawNew, 10)

        await prisma.customerRefreshToken.create({
          data: {
            id: newId,
            tokenHash,
            customerId: customer.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
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