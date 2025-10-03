/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-useless-constructor */
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { StoreRepository } from '@/modules/catalog/repositories/store-repository'
import {
  ensureStoreLimit,
  ensureUniqueStoreSlug,
} from '@/modules/shared/validators/tenant-rules'
import { createSlug } from '@/utils/create-slug'

type CreateStoreParams = {
  organizationId: string
  ownerId: string
  name: string
  description?: string | null
}

export class StoreService {
  constructor(private readonly repo: StoreRepository) {}

  async createStore(params: CreateStoreParams) {
    await ensureStoreLimit(params.organizationId)

    const slug = createSlug(params.name)
    await ensureUniqueStoreSlug(slug)

    const created = await this.repo.create({
      organizationId: params.organizationId,
      ownerId: params.ownerId,
      name: params.name,
      description: params.description ?? null,
      slug,
    })

    return created
  }
}

export function makeStoreService() {
  return new StoreService(new StoreRepository())
}
