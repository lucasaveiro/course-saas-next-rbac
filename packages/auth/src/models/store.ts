import { z } from 'zod'

export const storeSchema = z.object({
  __typename: z.literal('Store').default('Store'),
  id: z.string(),
  ownerId: z.string(),
})

export type Store = z.infer<typeof storeSchema>
