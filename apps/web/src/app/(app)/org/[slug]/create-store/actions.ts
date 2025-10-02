'use server'

import { HTTPError } from 'ky'
import { z } from 'zod'

import { getCurrentOrg } from '@/auth/auth'
import { createStore } from '@/http/create-store'

const storeSchema = z.object({
  name: z
    .string()
    .min(4, { message: 'Please, incluide at least 4 characters.' }),
  description: z.string(),
})

export async function createStoreAction(data: FormData) {
  const result = storeSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors

    return { success: false, message: null, errors }
  }

  const { name, description } = result.data

  try {
    await createStore({
      org: getCurrentOrg()!,
      name,
      description,
    })
  } catch (err) {
    if (err instanceof HTTPError) {
      const { message } = await err.response.json()

      return { success: false, message, errors: null }
    }

    console.error(err)

    return {
      success: false,
      message: 'Unexpected error, try again in a few minutes.',
      errors: null,
    }
  }

  return {
    success: true,
    message: 'Successfully saved the store.',
    errors: null,
  }
}
