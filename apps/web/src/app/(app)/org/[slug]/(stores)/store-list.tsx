import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { getCurrentOrg } from '@/auth/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getStores } from '@/http/get-stores'

dayjs.extend(relativeTime)

export async function StoreList() {
  const currentOrg = getCurrentOrg()
  const { stores } = await getStores(currentOrg!)

  return (
    <div className="grid grid-cols-3 gap-4">
      {stores.map((store) => {
        return (
          <Card key={store.id} className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl font-medium">
                {store.name}
              </CardTitle>
              <CardDescription className="line-clamp-2 leading-relaxed">
                {store.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex items-center gap-1.5">
              <Avatar className="size-4">
                {store.owner.avatarUrl && (
                  <AvatarImage src={store.owner.avatarUrl} />
                )}
                <AvatarFallback />
              </Avatar>

              <span className="truncate text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {store.owner.name}
                </span>{' '}
                {dayjs(store.createdAt).fromNow()}
              </span>

              <Button size="xs" variant="outline" className="ml-auto" asChild>
                <Link href={`/org/${currentOrg}/store/${store.slug}`}>
                  View <ArrowRight className="ml-2 size-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
