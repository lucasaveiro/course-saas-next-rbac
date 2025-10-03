import { resolveStoreSlug } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { store?: string; slug: string }
}) {
  const store = resolveStoreSlug(params.store)
  const title = store
    ? `${params.slug} — ${store}`
    : `${params.slug} — Storefront`
  return { title }
}

export default async function ProductPage({
  params,
}: {
  params: { store?: string; slug: string }
}) {
  const store = resolveStoreSlug(params.store)
  const slug = params.slug

  // Placeholder product data — integrate real fetch later
  const product = {
    name: slug.replace(/-/g, ' '),
    price: 2499,
    description:
      'This is a placeholder product description. Replace with real content.',
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="text-sm text-muted-foreground">
          {store ? `Sold by ${store}` : 'Storefront'}
        </p>
      </div>

      <p className="text-muted-foreground">{product.description}</p>

      <p className="text-base font-medium">
        {(product.price / 100).toLocaleString(undefined, {
          style: 'currency',
          currency: 'USD',
        })}
      </p>
    </div>
  )
}