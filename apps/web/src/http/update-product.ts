import { api } from './api-client'

interface UpdateProductRequest {
  org: string
  storeId: string
  productId: string
  name?: string
  description?: string | null
  slug?: string
}

type UpdateProductResponse = void

export async function updateProduct({
  org,
  storeId,
  productId,
  name,
  description,
  slug,
}: UpdateProductRequest): Promise<UpdateProductResponse> {
  await api.put(
    `organizations/${org}/stores/${storeId}/products/${productId}`,
    {
      json: {
        name,
        description,
        slug,
      },
    },
  )
}
