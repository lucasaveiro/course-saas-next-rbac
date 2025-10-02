import { z } from 'zod'

import { storeSchema } from '../models/store'

export const storeSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('Store'), storeSchema]),
])

export type StoreSubject = z.infer<typeof storeSubject>
