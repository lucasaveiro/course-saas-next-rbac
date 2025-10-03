import { z } from 'zod'

export const roleSchema = z.union([
  z.literal('ADMIN'),
  z.literal('STORE_OWNER'),
  z.literal('STORE_ADMIN'),
  z.literal('STAFF'),
  z.literal('SUPPORT'),
  z.literal('CUSTOMER'),
])

export type Role = z.infer<typeof roleSchema>
