'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from './use-cart'

export function CartWidget() {
  const { data, isLoading, error, updateItem, removeItem } = useCart()
  const [open, setOpen] = useState(false)

  const count = data?.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0

  return (
    <div>
      <button
        aria-label="Abrir carrinho"
        className="relative inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <ShoppingCart className="size-4" />
        <span>{count}</span>
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[1200px] rounded-t-md border bg-background p-4 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <strong className="text-sm">Seu carrinho</strong>
            <button className="text-xs text-muted-foreground" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {error && (
            <p className="text-sm text-red-500">Erro ao carregar o carrinho</p>
          )}

          <ul className="space-y-3">
            {data?.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qtd: {item.quantity} • Estoque:{' '}
                    {item.inventoryQuantity ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md border px-2 py-1 text-xs"
                    onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                  >
                    -
                  </button>
                  <button
                    className="rounded-md border px-2 py-1 text-xs"
                    onClick={() => updateItem(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="rounded-md border px-2 py-1 text-xs text-red-600"
                    onClick={() => removeItem(item.id)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}