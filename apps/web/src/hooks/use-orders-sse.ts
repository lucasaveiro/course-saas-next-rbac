'use client'
/* eslint-disable simple-import-sort/imports */

import { useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { env } from '@saas/env'
import type { GetOrdersResponse } from '@/http/get-orders'

export function useOrdersSSE(
  org: string | undefined,
  storeSlug: string | undefined,
  queryClient: QueryClient,
) {
  useEffect(() => {
    if (!org || !storeSlug) return
    const url = `${env.NEXT_PUBLIC_API_URL}/stores/${storeSlug}/orders/stream`
    const es = new EventSource(url)

    es.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data) as Partial<{
          type: 'orders:update'
          orders: { id: string; status: string }[]
        }>
        if (
          payload?.type === 'orders:update' &&
          Array.isArray(payload.orders)
        ) {
          const updates = payload.orders
          queryClient.setQueryData<GetOrdersResponse>(
            [org, storeSlug, 'orders'],
            (prev) => {
              if (!prev || !Array.isArray(prev.orders)) return prev
              const map = new Map(prev.orders.map((o) => [o.id, o]))
              for (const upd of updates) {
                if (map.has(upd.id)) {
                  const current = map.get(upd.id)
                  map.set(upd.id, { ...current!, status: upd.status })
                }
              }
              return { ...prev, orders: Array.from(map.values()) }
            },
          )
        }
      } catch {}
    }

    return () => {
      es.close()
    }
  }, [org, storeSlug, queryClient])
}
