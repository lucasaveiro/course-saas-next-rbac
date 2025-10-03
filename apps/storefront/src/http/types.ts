export interface Product {
  id: string
  name: string
  description?: string | null
  slug?: string | null
  priceInCents?: number | null
  createdAt?: string
  store?: { slug?: string | null } | null
}

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}