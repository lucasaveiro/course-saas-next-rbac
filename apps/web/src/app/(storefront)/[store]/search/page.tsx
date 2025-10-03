import { resolveStoreSlug } from '@/lib/storefront'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { store?: string }
}) {
  const store = resolveStoreSlug(params.store)
  const title = store ? `${store} — Search` : 'Storefront — Search'
  return { title }
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: { store?: string }
  searchParams?: { q?: string }
}) {
  const store = resolveStoreSlug(params.store)
  const q = searchParams?.q ?? ''

  // Placeholder search using cookie-stored last queries (demo only)
  const lastQueries = cookies().get('lastSearch')?.value
  const queries = lastQueries ? lastQueries.split('|').slice(0, 4) : []

  if (q) {
    cookies().set('lastSearch', [q, ...queries].join('|'))
  }

  const results = q
    ? [
        { id: 'r1', name: `Result for ${q} #1`, price: 1099 },
        { id: 'r2', name: `Result for ${q} #2`, price: 2099 },
      ]
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {store ? `${store} Search` : 'Search'}
      </h1>

      <form action="" className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          name="q"
          defaultValue={q}
          placeholder="Search products"
        />
        <button className="rounded border px-4 py-2" type="submit">
          Search
        </button>
      </form>

      {q && (
        <p className="text-sm text-muted-foreground">Showing results for "{q}"</p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((p) => (
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

      {queries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-medium">Recent searches</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {queries.map((term, i) => (
              <li key={i}>
                <a
                  href={`?q=${encodeURIComponent(term)}`}
                  className="rounded border px-2 py-1 text-muted-foreground hover:text-foreground"
                >
                  {term}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}