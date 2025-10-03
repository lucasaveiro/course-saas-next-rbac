/* eslint-disable no-useless-constructor */
import { OrderRepository } from '@/modules/orders/repositories/order-repository'
import {
  ensureCustomerBelongsToOrganization,
  ensureOrderBelongsToOrganization,
  ensureStoreBelongsToOrganization,
} from '@/modules/shared/validators/tenant-rules'

type CreateOrderParams = {
  organizationId: string
  storeId: string
  customerId?: string | null
  total: string
  taxAmount?: string | null
  status?: string
}

export class OrderService {
  constructor(private readonly repo: OrderRepository) {}

  async createOrder(params: CreateOrderParams) {
    await ensureStoreBelongsToOrganization(
      params.storeId,
      params.organizationId,
    )
    if (params.customerId) {
      await ensureCustomerBelongsToOrganization(
        params.customerId,
        params.organizationId,
      )
    }

    return this.repo.create({
      organizationId: params.organizationId,
      storeId: params.storeId,
      customerId: params.customerId ?? null,
      total: params.total,
      taxAmount: params.taxAmount ?? null,
      status: params.status ?? 'PENDING',
    })
  }

  async updateStatus(orderId: string, organizationId: string, status: string) {
    await ensureOrderBelongsToOrganization(orderId, organizationId)
    return this.repo.updateStatus(orderId, status)
  }

  async updateTotals(
    orderId: string,
    organizationId: string,
    total: string,
    taxAmount?: string | null,
  ) {
    await ensureOrderBelongsToOrganization(orderId, organizationId)
    return this.repo.updateTotals(orderId, total, taxAmount ?? null)
  }
}

export function makeOrderService() {
  return new OrderService(new OrderRepository())
}
