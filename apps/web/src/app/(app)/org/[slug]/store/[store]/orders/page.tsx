'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { getOrders } from '@/http/get-orders'
import { captureOrder, refundOrder, issueInvoice, startOrderFulfillment } from '@/http/order-actions'
import { useOrdersSSE } from '@/hooks/use-orders-sse'

export default function OrdersPage() {
  const { slug: org, store: storeSlug } = useParams<{
    slug: string
    store: string
  }>()

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: [org, storeSlug, 'orders'],
    queryFn: () => getOrders({ org, storeSlug }),
    enabled: !!org && !!storeSlug,
  })

  useOrdersSSE(org, storeSlug, queryClient)

  const capture = useMutation({
    mutationFn: (orderId: string) => captureOrder({ storeSlug, orderId }),
  })
  const refund = useMutation({
    mutationFn: (orderId: string) => refundOrder({ storeSlug, orderId }),
  })
  const invoice = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await issueInvoice({ storeSlug, orderId })
      queryClient.setQueryData([org, storeSlug, 'orders'], (prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          orders: prev.orders.map((o: any) => (o.id === orderId ? { ...o, status: res.status } : o)),
        }
      })
      return res
    },
  })
  const fulfill = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await startOrderFulfillment({ storeSlug, orderId })
      queryClient.setQueryData([org, storeSlug, 'orders'], (prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          orders: prev.orders.map((o: any) => (o.id === orderId ? { ...o, status: res.status } : o)),
        }
      })
      return res
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading orders...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Created at</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {order.status}
                </TableCell>
                <TableCell>
                  {Number(order.total).toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => capture.mutate(order.id)} disabled={capture.isPending}>
                      Capturar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => refund.mutate(order.id)} disabled={refund.isPending}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={() => invoice.mutate(order.id)} disabled={invoice.isPending}>
                      Emitir nota
                    </Button>
                    <Button size="sm" onClick={() => fulfill.mutate(order.id)} disabled={fulfill.isPending}>
                      Fulfillment
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}