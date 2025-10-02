import { Plus } from 'lucide-react'
import Link from 'next/link'

import { ability, getCurrentOrg } from '@/auth/auth'
import { Button } from '@/components/ui/button'

import { StoreList } from './store-list'

export default async function Projects() {
  const currentOrg = getCurrentOrg()
  const permissions = await ability()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stores</h1>

        {permissions?.can('create', 'Store') && (
          <Button size="sm" asChild>
            <Link href={`/org/${currentOrg}/create-store`}>
              <Plus className="mr-2 size-4" />
              Create store
            </Link>
          </Button>
        )}
      </div>

      {permissions?.can('get', 'Store') ? (
        <StoreList />
      ) : (
        <p className="text-sm text-muted-foreground">
          You are not allowed to see organization stores.
        </p>
      )}
    </div>
  )
}
