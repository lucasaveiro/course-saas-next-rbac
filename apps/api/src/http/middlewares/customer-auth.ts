import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'

import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'

export const customerAuth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request) => {
    request.getCurrentCustomerId = async () => {
      try {
        const payload = await request.jwtVerify<{ sub: string; aud?: string }>()

        if (payload.aud !== 'customer') {
          throw new UnauthorizedError('Invalid token audience')
        }

        return payload.sub
      } catch {
        throw new UnauthorizedError('Invalid token')
      }
    }
  })
})