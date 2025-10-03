import { resolveStoreSlug } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { store?: string }
}) {
  const store = resolveStoreSlug(params.store)
  const title = store ? `${store} — Home` : 'Storefront — Home'
  return { title }
}

export default async function StorefrontHome({
  params,
}: {
  params: { store?: string }
}) {
  const store = resolveStoreSlug(params.store)

  // Placeholder featured products — replace with real fetch later
  const featured = [
    { id: 'p1', name: 'Featured Product 1', price: 1999 },
    { id: 'p2', name: 'Featured Product 2', price: 2999 },
    { id: 'p3', name: 'Featured Product 3', price: 3999 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {store ? `${store} Store` : 'Storefront'}
      </h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((p) => (
          <article key={p.id} className="rounded border p-4">
            <h2 className="text-base font-medium">{p.name}</h2>
            <p className="text-sm text-muted-foreground">
              {(p.price / 100).toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
              })}
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}