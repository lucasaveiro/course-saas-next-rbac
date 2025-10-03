'use server'

import { HTTPError } from 'ky'
import { revalidatePath } from 'next/cache'

import { getCurrentOrg } from '@/auth/auth'
import { deleteStore } from '@/http/delete-store'

export async function deleteStoreAction(storeId: string) {
  const currentOrg = getCurrentOrg()

  try {
    await deleteStore({ org: currentOrg!, storeId })
  } catch (err) {
    if (err instanceof HTTPError) {
      const { message } = await err.response.json()

      return { success: false, message }
    }

    console.error(err)

    return {
      success: false,
      message: 'Unexpected error, try again in a few minutes.',
    }
  }

  revalidatePath(`/org/${currentOrg}`)

  return { success: true, message: 'Store deleted.' }
}
