import { api } from './api-client'

interface DeleteStoreRequest {
  org: string
  storeId: string
}

export async function deleteStore({ org, storeId }: DeleteStoreRequest) {
  await api.delete(`organizations/${org}/stores/${storeId}`)
}
