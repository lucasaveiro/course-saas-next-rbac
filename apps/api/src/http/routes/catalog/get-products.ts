import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'
// Temporarily public route for testing without authentication

export async function getProducts(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/organizations/:slug/stores/:storeSlug/products',
      {
        schema: {
          tags: ['Catalog'],
          summary: 'List products from a store (paginated)',
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
              products: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  description: z.string().nullable(),
                  slug: z.string(),
                  // Physical attributes
                  weight: z.string().nullable().optional(),
                  width: z.string().nullable().optional(),
                  length: z.string().nullable().optional(),
                  depth: z.string().nullable().optional(),
                  quantityPerPallet: z.number().int().nullable().optional(),
                  // Aggregated pricing from variants
                  price: z.string().nullable().optional(),
                  createdAt: z.string(),
                }),
              ),
              meta: z.object({
                page: z.number(),
                perPage: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug, storeSlug } = request.params
        const { page, perPage } = request.query

        // Temporarily bypass authentication: resolve organization by slug
        const organization = await prisma.organization.findUnique({
          where: { slug },
          select: { id: true },
        })

        if (!organization) {
          throw new BadRequestError('Organization not found.')
        }

        // Use findFirst with composite filter to avoid unique constraint issues
        const store = await prisma.store.findFirst({
          where: { slug: storeSlug, organizationId: organization.id },
          select: { id: true },
        })

        if (!store) {
          throw new BadRequestError('Store not found.')
        }

        const [productsRaw, total] = await Promise.all([
          prisma.product.findMany({
            where: { storeId: store.id },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * perPage,
            take: perPage,
            select: {
              id: true,
              name: true,
              description: true,
              slug: true,
              weight: true,
              width: true,
              length: true,
              depth: true,
              quantityPerPallet: true,
              createdAt: true,
              variants: {
                select: { price: true },
                orderBy: { price: 'asc' },
                take: 1,
              },
            },
          }),
          prisma.product.count({ where: { storeId: store.id } }),
        ])

        const products = productsRaw.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          slug: p.slug,
          weight: p.weight?.toString?.() ?? null,
          width: p.width?.toString?.() ?? null,
          length: p.length?.toString?.() ?? null,
          depth: p.depth?.toString?.() ?? null,
          quantityPerPallet: p.quantityPerPallet ?? null,
          createdAt: p.createdAt.toISOString?.() ?? (p.createdAt as unknown as string),
          price: p.variants?.[0]?.price?.toString?.() ?? null,
        }))

        const totalPages = Math.max(1, Math.ceil(total / perPage))

        return reply.send({
          products,
          meta: { page, perPage, total, totalPages },
        })
      },
    )
}
