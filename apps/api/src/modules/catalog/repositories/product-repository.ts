import { prisma } from '@/lib/prisma'

export type CreateProductInput = {
  organizationId: string
  storeId: string
  name: string
  description?: string | null
  slug: string
}

export class ProductRepository {
  async listByStore(storeId: string) {
    return prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findBySlug(organizationId: string, slug: string) {
    return prisma.product.findFirst({ where: { organizationId, slug } })
  }

  async create(data: CreateProductInput) {
    return prisma.product.create({
      data: {
        organizationId: data.organizationId,
        storeId: data.storeId,
        name: data.name,
        description: data.description ?? null,
        slug: data.slug,
      },
      select: { id: true },
    })
  }
}
