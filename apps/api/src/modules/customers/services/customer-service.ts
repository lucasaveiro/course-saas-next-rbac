/* eslint-disable no-useless-constructor */
import { CustomerRepository } from '@/modules/customers/repositories/customer-repository'
import {
  ensureCustomerBelongsToOrganization,
  ensureStoreBelongsToOrganization,
  ensureUniqueCustomerEmail,
} from '@/modules/shared/validators/tenant-rules'

type CreateCustomerParams = {
  organizationId: string
  storeId: string
  name: string
  email: string
  phone?: string | null
}

type UpdateCustomerParams = {
  name?: string
  email?: string
  phone?: string | null
}

export class CustomerService {
  constructor(private readonly repo: CustomerRepository) {}

  async createCustomer(params: CreateCustomerParams) {
    await ensureStoreBelongsToOrganization(
      params.storeId,
      params.organizationId,
    )
    await ensureUniqueCustomerEmail(params.organizationId, params.email)

    return this.repo.create({
      organizationId: params.organizationId,
      storeId: params.storeId,
      name: params.name,
      email: params.email,
      phone: params.phone ?? null,
    })
  }

  async updateCustomer(
    customerId: string,
    organizationId: string,
    updates: UpdateCustomerParams,
  ) {
    await ensureCustomerBelongsToOrganization(customerId, organizationId)

    if (updates.email) {
      await ensureUniqueCustomerEmail(organizationId, updates.email)
    }

    return this.repo.update(customerId, {
      name: updates.name,
      email: updates.email,
      phone: updates.phone ?? null,
    })
  }
}

export function makeCustomerService() {
  return new CustomerService(new CustomerRepository())
}
