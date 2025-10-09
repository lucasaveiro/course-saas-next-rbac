import { api } from './api-client'

interface UpdateProductPriceRequest {
  org: string
  storeId: string
  productId: string
  price: string
}

type UpdateProductPriceResponse = void

export async function updateProductPrice({
  org,
  storeId,
  productId,
  price,
}: UpdateProductPriceRequest): Promise<UpdateProductPriceResponse> {
  await api.put(
    `organizations/${org}/stores/${storeId}/products/${productId}/price`,
    {
      json: { price },
    },
  )
}
