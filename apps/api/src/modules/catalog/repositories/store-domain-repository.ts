import { prisma } from '@/lib/prisma'

export type CreateStoreDomainInput = {
  organizationId: string
  storeId: string
  domain: string
}

export class StoreDomainRepository {
  async findByDomain(domain: string) {
    return prisma.storeDomain.findUnique({ where: { domain } })
  }

  async findByStoreId(storeId: string) {
    return prisma.storeDomain.findUnique({ where: { storeId } })
  }

  async listByOrganization(organizationId: string) {
    return prisma.storeDomain.findMany({ where: { organizationId } })
  }

  async create(data: CreateStoreDomainInput) {
    return prisma.storeDomain.create({
      data: {
        organizationId: data.organizationId,
        storeId: data.storeId,
        domain: data.domain,
      },
      select: { id: true },
    })
  }

  async deleteByStoreId(storeId: string) {
    return prisma.storeDomain.delete({ where: { storeId }, select: { id: true } })
  }
}