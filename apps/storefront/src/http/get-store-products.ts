import { apiFetch, isDisabledStatus } from './api-client'
import type { PaginationMeta, Product } from './types'

interface GetStoreProductsParams {
  slug: string
  page?: number
  perPage?: number
  revalidate?: number
  tag?: string
}

interface GetStoreProductsResult {
  products: Product[]
  meta: PaginationMeta
  disabled: boolean
}

export async function getStoreProducts({
  slug,
  page = 1,
  perPage = 12,
  revalidate = 60,
  tag = `storefront:${slug}:products`,
}: GetStoreProductsParams): Promise<GetStoreProductsResult> {
  const search = new URLSearchParams()
  search.set('page', String(page))
  search.set('perPage', String(perPage))

  const res = await apiFetch(`stores/${slug}/products?${search.toString()}`, {
    // Cache-friendly for server components
    cache: 'force-cache',
    next: { tags: [tag], revalidate },
  })

  if (!res.ok) {
    if (isDisabledStatus(res.status)) {
      return {
        products: [],
        meta: { page, perPage, total: 0, totalPages: 0 },
        disabled: true,
      }
    }

    throw new Error(`Failed to load products for store ${slug} (${res.status})`)
  }

  const json = (await res.json()) as {
    products?: Product[]
    meta?: PaginationMeta
    disabled?: boolean
  }

  const disabled = Boolean(json.disabled)

  return {
    products: json.products ?? [],
    meta:
      json.meta ??
      ({
        page,
        perPage,
        total: json.products?.length ?? 0,
        totalPages: 1,
      } as PaginationMeta),
    disabled,
  }
}