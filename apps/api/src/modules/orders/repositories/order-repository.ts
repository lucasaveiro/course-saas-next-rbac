/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma'

export type CreateOrderInput = {
  organizationId: string
  storeId: string
  customerId?: string | null
  status?: string
  total: string // Decimal as string to avoid float issues
  taxAmount?: string | null
}

export class OrderRepository {
  async listByStore(storeId: string) {
    return prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: CreateOrderInput) {
    return prisma.order.create({
      data: {
        organizationId: data.organizationId,
        storeId: data.storeId,
        customerId: data.customerId ?? null,
        status: data.status ?? 'PENDING',
        total: data.total as any,
        taxAmount: (data.taxAmount ?? null) as any,
      },
      select: { id: true },
    })
  }

  async updateStatus(orderId: string, status: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status },
      select: { id: true },
    })
  }

  async updateTotals(
    orderId: string,
    total: string,
    taxAmount?: string | null,
  ) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        total: total as any,
        taxAmount: (taxAmount ?? null) as any,
      },
      select: { id: true },
    })
  }
}
