"use client"

import Link from 'next/link'

import { useCart } from '@/components/storefront/cart/use-cart'
import { Button } from '@/components/ui/button'

export default function CartPage() {
  const { data, isLoading, error, updateItem, removeItem } = useCart()
  const items = data?.items ?? []

  const handleDecrease = (id: string, qty: number) => {
    const next = Math.max(1, qty - 1)
    updateItem(id, next)
  }

  const handleIncrease = (id: string, qty: number) => {
    const next = qty + 1
    updateItem(id, next)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Carrinho</h1>
        <Link href="../" className="text-sm text-muted-foreground hover:underline">
          Voltar para a loja
        </Link>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando carrinho…</p>
      )}

      {error && (
        <p className="text-sm text-red-600">Não foi possível carregar o carrinho.</p>
      )}

      {!isLoading && !error && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-base font-medium">{item.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    Unidade:{' '}
                    {Number(item.unitPrice).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total:{' '}
                    {Number(item.totalPrice).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecrease(item.id, item.quantity)}
                  >
                    −
                  </Button>
                  <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleIncrease(item.id, item.quantity)}
                  >
                    +
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}