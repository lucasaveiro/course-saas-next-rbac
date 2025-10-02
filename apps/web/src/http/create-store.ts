import { api } from './api-client'

interface CreateStoreRequest {
  org: string
  name: string
  description: string
}

type CreateStoreResponse = void

export async function createStore({
  org,
  name,
  description,
}: CreateStoreRequest): Promise<CreateStoreResponse> {
  await api.post(`organizations/${org}/stores`, {
    json: {
      name,
      description,
    },
  })
}
