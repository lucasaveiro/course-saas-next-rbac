import { StorefrontHeader } from '@/components/storefront/header'

export default async function StorefrontLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: { store?: string } }>) {
  return (
    <div>
      <StorefrontHeader storeParam={params.store} />
      <main className="mx-auto w-full max-w-[1200px] py-4">{children}</main>
    </div>
  )
}
