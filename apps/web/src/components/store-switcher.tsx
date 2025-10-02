'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronsUpDown, Loader2, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { getStores } from '@/http/get-stores'

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Skeleton } from './ui/skeleton'

export function StoreSwitcher() {
  const { slug: orgSlug, store: storeSlug } = useParams<{
    slug: string
    store: string
  }>()

  const { data, isLoading } = useQuery({
    queryKey: [orgSlug, 'stores'],
    queryFn: () => getStores(orgSlug),
    enabled: !!orgSlug,
  })

  const currentStore =
    data && storeSlug
      ? data.stores.find((store) => store.slug === storeSlug)
      : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-[168px] items-center gap-2 rounded p-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {isLoading ? (
          <>
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-4 w-full flex-1" />
          </>
        ) : (
          <>
            {currentStore ? (
              <>
                <Avatar className="size-4">
                  {currentStore.avatarUrl && (
                    <AvatarImage src={currentStore.avatarUrl} />
                  )}
                  <AvatarFallback />
                </Avatar>
                <span className="truncate text-left">
                  {currentStore.name}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Select store</span>
            )}
          </>
        )}

        {isLoading ? (
          <Loader2 className="ml-auto size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        alignOffset={-16}
        sideOffset={12}
        className="w-[200px]"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Stores</DropdownMenuLabel>
          {data &&
            data.stores.map((store) => {
              return (
                <DropdownMenuItem key={store.id} asChild>
                  <Link href={`/org/${orgSlug}/store/${store.slug}`}>
                    <Avatar className="mr-2 size-4">
                      {store.avatarUrl && (
                        <AvatarImage src={store.avatarUrl} />
                      )}
                      <AvatarFallback />
                    </Avatar>
                    <span className="line-clamp-1">{store.name}</span>
                  </Link>
                </DropdownMenuItem>
              )
            })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/org/${orgSlug}/create-store`}>
            <PlusCircle className="mr-2 size-4" />
            Create new
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
