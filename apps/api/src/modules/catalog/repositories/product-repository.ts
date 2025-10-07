import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export type CreateProductInput = {
  organizationId: string
  storeId: string
  name: string
  description?: string | null
  slug: string
  // Physical attributes
  weight?: string
  width?: string
  length?: string
  depth?: string
  quantityPerPallet?: number
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
        weight: data.weight ? new Prisma.Decimal(data.weight) : undefined,
        width: data.width ? new Prisma.Decimal(data.width) : undefined,
        length: data.length ? new Prisma.Decimal(data.length) : undefined,
        depth: data.depth ? new Prisma.Decimal(data.depth) : undefined,
        quantityPerPallet: data.quantityPerPallet ?? undefined,
      },
      select: { id: true },
    })
  }
}
