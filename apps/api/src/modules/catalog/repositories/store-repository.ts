import { prisma } from '@/lib/prisma'

export type CreateStoreInput = {
  organizationId: string
  ownerId: string
  name: string
  description?: string | null
  slug: string
}

export class StoreRepository {
  async listByOrganization(organizationId: string) {
    return prisma.store.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        ownerId: true,
        avatarUrl: true,
        organizationId: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })
  }

  async findBySlug(organizationId: string, slug: string) {
    return prisma.store.findFirst({
      where: { organizationId, slug },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        ownerId: true,
        avatarUrl: true,
        organizationId: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })
  }

  async findById(organizationId: string, storeId: string) {
    return prisma.store.findFirst({
      where: { organizationId, id: storeId },
    })
  }

  async create(data: CreateStoreInput) {
    return prisma.store.create({
      data: {
        organizationId: data.organizationId,
        ownerId: data.ownerId,
        name: data.name,
        description: data.description ?? null,
        slug: data.slug,
      },
      select: { id: true },
    })
  }

  async update(
    storeId: string,
    data: { name?: string; description?: string | null },
  ) {
    return prisma.store.update({
      where: { id: storeId },
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      select: { id: true },
    })
  }

  async delete(storeId: string) {
    return prisma.store.delete({ where: { id: storeId }, select: { id: true } })
  }
}
