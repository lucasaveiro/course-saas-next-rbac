import { redirect } from 'next/navigation'

import { ability } from '@/auth/auth'
import { NavLink } from '@/components/nav-link'
import { Button } from '@/components/ui/button'

export default async function StoreLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: { slug: string; store: string }
}>) {
  const permissions = await ability()
  const storeSlug = params.store
  const orgSlug = params.slug
  const basePath = `/org/${orgSlug}/store/${storeSlug}`

  const canGetProducts = permissions?.can('get', 'Product')
  const canGetStore = permissions?.can('get', 'Store')

  // Guard: bloquear acesso direto se o usuário não puder ver a loja
  if (!canGetStore) {
    redirect(`/org/${orgSlug}`)
  }

  return (
    <div>
      <div className="border-b py-4">
        <nav className="mx-auto flex max-w-[1200px] items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
          >
            <NavLink href={`${basePath}/products`}>Products</NavLink>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
          >
            <NavLink href={`${basePath}/collections`}>Collections</NavLink>
          </Button>

          {canGetProducts && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
            >
              <NavLink href={`${basePath}/inventory`}>Inventory</NavLink>
            </Button>
          )}

          {canGetStore && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
            >
              <NavLink href={`${basePath}/customers`}>Customers</NavLink>
            </Button>
          )}

          {canGetStore && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
            >
              <NavLink href={`${basePath}/orders`}>Orders</NavLink>
            </Button>
          )}

          {canGetStore && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
            >
              <NavLink href={`${basePath}/settings`}>Settings</NavLink>
            </Button>
          )}

          {/* Link para acessar a loja pública em nova aba */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="border border-transparent text-muted-foreground"
          >
            <NavLink
              href={`/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Acessar a Loja
            </NavLink>
          </Button>
        </nav>
      </div>

      <main className="mx-auto w-full max-w-[1200px] py-4">{children}</main>
    </div>
  )
}
