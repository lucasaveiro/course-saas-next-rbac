import { api } from './api-client'

interface GetProductsResponse {
  products: {
    id: string
    name: string
    description: string
    slug: string
    // Physical attributes
    weight?: string | null
    width?: string | null
    length?: string | null
    depth?: string | null
    quantityPerPallet?: number | null
    createdAt: string
  }[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

interface GetProductsRequest {
  org: string
  storeSlug: string
  page?: number
  perPage?: number
}

export async function getProducts({
  org,
  storeSlug,
  page = 1,
  perPage = 10,
}: GetProductsRequest) {
  const searchParams = new URLSearchParams()
  searchParams.set('page', String(page))
  searchParams.set('perPage', String(perPage))

  const result = await api
    .get(`organizations/${org}/stores/${storeSlug}/products`, {
      searchParams,
    })
    .json<GetProductsResponse>()

  return result
}