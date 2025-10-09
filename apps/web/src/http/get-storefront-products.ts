import { env } from '@saas/env'

export interface StorefrontProduct {
  id: string
  name: string
  slug: string
  description?: string | null
  price?: string | null
  createdAt: string
}

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

interface GetStorefrontProductsParams {
  slug: string
  page?: number
  perPage?: number
}

interface GetStorefrontProductsResult {
  products: StorefrontProduct[]
  meta: PaginationMeta
  disabled: boolean
}

export async function getStorefrontProducts({
  slug,
  page = 1,
  perPage = 12,
}: GetStorefrontProductsParams): Promise<GetStorefrontProductsResult> {
  const search = new URLSearchParams()
  search.set('page', String(page))
  search.set('perPage', String(perPage))

  const url = `${env.NEXT_PUBLIC_API_URL}/stores/${slug}/products?${search.toString()}`

  const res = await fetch(url, {
    cache: 'force-cache',
    next: { revalidate: 60, tags: [`storefront:${slug}:products`] },
  })

  if (!res.ok) {
    const disabled = res.status === 404 || res.status === 410 || res.status === 423
    if (disabled) {
      return {
        products: [],
        meta: { page, perPage, total: 0, totalPages: 0 },
        disabled: true,
      }
    }
    throw new Error(`Failed to load products for store ${slug} (${res.status})`)
  }

  const json = (await res.json()) as {
    products?: StorefrontProduct[]
    meta?: PaginationMeta
    disabled?: boolean
  }

  const disabled = Boolean(json.disabled)

  return {
    products: json.products ?? [],
    meta:
      json.meta ?? {
        page,
        perPage,
        total: json.products?.length ?? 0,
        totalPages: 1,
      },
    disabled,
  }
}