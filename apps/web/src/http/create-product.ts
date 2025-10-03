import { api } from './api-client'

interface CreateProductRequest {
  org: string
  storeId: string
  name: string
  description: string
}

type CreateProductResponse = void

export async function createProduct({
  org,
  storeId,
  name,
  description,
}: CreateProductRequest): Promise<CreateProductResponse> {
  await api.post(`organizations/${org}/stores/${storeId}/products`, {
    json: {
      name,
      description,
    },
  })
}