import { apiFetch, isDisabledStatus } from './api-client'
import type { Product } from './types'

interface GetProductParams {
  id: string
  storeSlug?: string
  revalidate?: number
  tag?: string
}

interface GetProductResult {
  product: Product | null
  disabled: boolean
  notFound: boolean
}

export async function getProduct({
  id,
  storeSlug,
  revalidate = 300,
  tag = `storefront:product:${id}`,
}: GetProductParams): Promise<GetProductResult> {
  const res = await apiFetch(`products/${id}`, {
    cache: 'force-cache',
    next: { tags: [tag], revalidate },
    headers:
      storeSlug
        ? {
            // Optional header to help scope by store when supported
            'X-Store-Slug': storeSlug,
          }
        : undefined,
  })

  if (!res.ok) {
    if (isDisabledStatus(res.status)) {
      return { product: null, disabled: true, notFound: false }
    }

    if (res.status === 404) {
      return { product: null, disabled: false, notFound: true }
    }

    throw new Error(`Failed to load product ${id} (${res.status})`)
  }

  const product = (await res.json()) as Product

  // Extra isolation guard: if storeSlug is provided and mismatch occurs, treat as not found
  if (storeSlug && product?.store?.slug && product.store.slug !== storeSlug) {
    return { product: null, disabled: false, notFound: true }
  }

  return { product, disabled: false, notFound: false }
}