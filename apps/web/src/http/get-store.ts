import { api } from './api-client'

interface GetStoreResponse {
  store: {
    id: string
    name: string
    slug: string
    description: string
    avatarUrl: string | null
    organizationId: string
    ownerId: string
    createdAt: string
  }
}

type Store = GetStoreResponse['store']

export async function getStore(org: string, storeSlug: string): Promise<Store> {
  const result = await api
    .get(`organizations/${org}/stores/${storeSlug}`)
    .json<GetStoreResponse>()

  return result.store
}
