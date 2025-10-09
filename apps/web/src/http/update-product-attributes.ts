import { api } from './api-client'

interface UpdateProductAttributesRequest {
  org: string
  storeId: string
  productId: string
  weight?: string
  width?: string
  length?: string
  depth?: string
  quantityPerPallet?: number
}

type UpdateProductAttributesResponse = void

export async function updateProductAttributes({
  org,
  storeId,
  productId,
  weight,
  width,
  length,
  depth,
  quantityPerPallet,
}: UpdateProductAttributesRequest): Promise<UpdateProductAttributesResponse> {
  await api.put(
    `organizations/${org}/stores/${storeId}/products/${productId}/attributes`,
    {
      json: {
        weight,
        width,
        length,
        depth,
        quantityPerPallet,
      },
    },
  )
}
