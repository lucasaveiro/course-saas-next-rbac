import Link from 'next/link'

import { resolveStoreSlug } from '@/lib/storefront'
import { CartWidget } from '@/components/storefront/cart/cart-widget'

export async function StorefrontHeader({
  storeParam,
}: {
  storeParam?: string
}) {
  const store = resolveStoreSlug(storeParam)

  const basePath = store ? `/${store}` : '/'

  return (
    <header className="mx-auto flex max-w-[1200px] items-center justify-between py-6">
      <Link href={basePath} className="text-lg font-semibold">
        {store ?? 'Storefront'}
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        <Link href={`${basePath}`} className="text-muted-foreground hover:text-foreground">
          Home
        </Link>
        <Link
          href={`${basePath}/collections`}
          className="text-muted-foreground hover:text-foreground"
        >
          Collections
        </Link>
        <Link
          href={`${basePath}/search`}
          className="text-muted-foreground hover:text-foreground"
        >
          Search
        </Link>
        <CartWidget />
      </nav>
    </header>
  )
}