import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export async function getStorefrontProducts(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/stores/:storeSlug/products',
      {
        schema: {
          tags: ['Storefront'],
          summary: 'List public products for a store (by slug)',
          params: z.object({ storeSlug: z.string() }),
          querystring: z.object({
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(100).default(12),
          }),
          response: {
            200: z.object({
              products: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  description: z.string().nullable().optional(),
                  slug: z.string(),
                  // Lowest price among variants
                  price: z.string().nullable().optional(),
                  // Expose the variantId for add-to-cart convenience (lowest price variant)
                  variantId: z.string().uuid().nullable().optional(),
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
            404: z.object({ disabled: z.literal(true) }),
          },
        },
      },
      async (request, reply) => {
        const { storeSlug } = request.params
        const { page, perPage } = request.query

        // Slug is globally unique across all organizations
        const store = await prisma.store.findUnique({
          where: { slug: storeSlug },
          select: { id: true },
        })

        if (!store) {
          return reply.status(404).send({ disabled: true })
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
              createdAt: true,
              variants: {
                select: { id: true, price: true },
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
          createdAt: p.createdAt.toISOString?.() ?? (p.createdAt as unknown as string),
          price: p.variants?.[0]?.price?.toString?.() ?? null,
          variantId: p.variants?.[0]?.id ?? null,
        }))

        const totalPages = Math.max(1, Math.ceil(total / perPage))

        return reply.send({
          products,
          meta: { page, perPage, total, totalPages },
        })
      },
    )
}