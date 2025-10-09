import { resolveStoreSlug } from '@/lib/storefront'
import { getStorefrontProducts } from '@/http/get-storefront-products'

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

  let products: Awaited<ReturnType<typeof getStorefrontProducts>>['products'] = []
  let disabled = false

  if (store) {
    try {
      const result = await getStorefrontProducts({ slug: store, perPage: 12 })
      products = result.products
      disabled = result.disabled
    } catch (err) {
      // Fail soft: keep page rendering even if API hiccups
      products = []
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {store ? `${store} Store` : 'Storefront'}
      </h1>

      {disabled && (
        <p className="text-sm text-muted-foreground">
          Esta loja está temporariamente indisponível.
        </p>
      )}

      {!disabled && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum produto disponível no momento.
            </p>
          ) : (
            products.map((p) => (
              <article key={p.id} className="rounded border p-4">
                <h2 className="text-base font-medium">{p.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {p.price
                    ? Number(p.price).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : '—'}
                </p>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  )
}
