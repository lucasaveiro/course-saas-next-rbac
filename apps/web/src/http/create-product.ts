import { api } from './api-client'

interface CreateProductRequest {
  org: string
  storeId: string
  name: string
  description: string
  // Pricing
  price?: string
  // Physical attributes
  weight?: string
  width?: string
  length?: string
  depth?: string
  qtPerPallet?: number
}

type CreateProductResponse = void

export async function createProduct({
  org,
  storeId,
  name,
  description,
  price,
  weight,
  width,
  length,
  depth,
  qtPerPallet,
}: CreateProductRequest): Promise<CreateProductResponse> {
  await api.post(`organizations/${org}/stores/${storeId}/products`, {
    json: {
      name,
      description,
      price,
      weight,
      width,
      length,
      depth,
      qtPerPallet,
    },
  })
}
