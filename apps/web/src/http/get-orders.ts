import { api } from './api-client'

interface GetOrdersResponse {
  orders: {
    id: string
    status: string
    total: string
    taxAmount: string | null
    createdAt: string
  }[]
  meta: {
    page: number
    perPage: number
    total: number
  }
}

interface GetOrdersRequest {
  org: string
  storeSlug: string
  page?: number
  perPage?: number
}

export async function getOrders({
  org,
  storeSlug,
  page = 1,
  perPage = 10,
}: GetOrdersRequest) {
  const searchParams = new URLSearchParams()
  searchParams.set('page', String(page))
  searchParams.set('perPage', String(perPage))

  const result = await api
    .get(`organizations/${org}/stores/${storeSlug}/orders`, {
      searchParams,
    })
    .json<GetOrdersResponse>()

  return result
}