import { api } from './api-client'

interface GetCustomersResponse {
  customers: {
    id: string
    name: string | null
    email: string
    phone: string | null
    createdAt: string
  }[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

interface GetCustomersRequest {
  org: string
  storeSlug: string
  page?: number
  perPage?: number
}

export async function getCustomers({
  org,
  storeSlug,
  page = 1,
  perPage = 10,
}: GetCustomersRequest) {
  const searchParams = new URLSearchParams()
  searchParams.set('page', String(page))
  searchParams.set('perPage', String(perPage))

  const result = await api
    .get(`organizations/${org}/stores/${storeSlug}/customers`, {
      searchParams,
    })
    .json<GetCustomersResponse>()

  return result
}
