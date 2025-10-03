import { Header } from '@/components/header'
import { NavLink } from '@/components/nav-link'
import { Button } from '@/components/ui/button'
import { ability } from '@/auth/auth'

export default async function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const permissions = await ability()

  const canGetProducts = permissions?.can('get', 'Product')
  const canGetStore = permissions?.can('get', 'Store')

  return (
    <div>
      <div className="pt-6">
        <Header />

        <div className="border-b py-4">
          <nav className="mx-auto flex max-w-[1200px] items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
            >
              <NavLink href="products">Products</NavLink>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
            >
              <NavLink href="collections">Collections</NavLink>
            </Button>

            {canGetProducts && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
              >
                <NavLink href="inventory">Inventory</NavLink>
              </Button>
            )}

            {canGetStore && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
              >
                <NavLink href="customers">Customers</NavLink>
              </Button>
            )}

            {canGetStore && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
              >
                <NavLink href="orders">Orders</NavLink>
              </Button>
            )}

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
            >
              <NavLink href="settings">Settings</NavLink>
            </Button>
          </nav>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1200px] py-4">{children}</main>
    </div>
  )
}