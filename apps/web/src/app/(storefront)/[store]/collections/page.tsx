import { resolveStoreSlug } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { store?: string }
}) {
  const store = resolveStoreSlug(params.store)
  const title = store ? `${store} — Collections` : 'Storefront — Collections'
  return { title }
}

export default async function CollectionsPage({
  params,
}: {
  params: { store?: string }
}) {
  const store = resolveStoreSlug(params.store)

  const collections = [
    { id: 'c1', name: 'Summer', description: 'Hot season picks' },
    { id: 'c2', name: 'Winter', description: 'Cozy and warm' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {store ? `${store} Collections` : 'Collections'}
      </h1>

      <section className="grid gap-4 sm:grid-cols-2">
        {collections.map((c) => (
          <article key={c.id} className="rounded border p-4">
            <h2 className="text-base font-medium">{c.name}</h2>
            <p className="text-sm text-muted-foreground">{c.description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
