import { api } from './api-client'

interface DeleteProductRequest {
  org: string
  storeId: string
  productId: string
}

type DeleteProductResponse = void

export async function deleteProduct({
  org,
  storeId,
  productId,
}: DeleteProductRequest): Promise<DeleteProductResponse> {
  await api.delete(
    `organizations/${org}/stores/${storeId}/products/${productId}`,
  )
}
