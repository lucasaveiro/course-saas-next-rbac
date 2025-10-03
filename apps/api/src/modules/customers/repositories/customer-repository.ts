import { prisma } from '@/lib/prisma'

export type CreateCustomerInput = {
  organizationId: string
  storeId: string
  name: string
  email: string
  phone?: string | null
}

export class CustomerRepository {
  async findByIdInOrganization(organizationId: string, customerId: string) {
    return prisma.customer.findFirst({
      where: { organizationId, id: customerId },
    })
  }

  async findByEmailInOrganization(organizationId: string, email: string) {
    return prisma.customer.findFirst({ where: { organizationId, email } })
  }

  async listByStore(storeId: string) {
    return prisma.customer.findMany({ where: { storeId } })
  }

  async create(data: CreateCustomerInput) {
    return prisma.customer.create({
      data: {
        organizationId: data.organizationId,
        storeId: data.storeId,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
      },
      select: { id: true },
    })
  }

  async update(
    customerId: string,
    data: { name?: string; email?: string; phone?: string | null },
  ) {
    return prisma.customer.update({
      where: { id: customerId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
      },
      select: { id: true },
    })
  }
}
