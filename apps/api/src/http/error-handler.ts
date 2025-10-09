import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    reply.status(400).send({
      message: 'Validation error',
      errors: error.flatten().fieldErrors,
    })
    return
  }

  if (error instanceof BadRequestError || error.name === 'BadRequestError') {
    reply.status(400).send({
      message: error.message,
    })
    return
  }

  if (error instanceof UnauthorizedError || error.name === 'UnauthorizedError') {
    reply.status(401).send({
      message: error.message,
    })
    return
  }

  console.error(error)

  // send error to some observability platform

  reply.status(500).send({
    message: 'Internal server error',
    errorName: (error as any)?.name,
    errorMessage: (error as any)?.message,
  })
}
