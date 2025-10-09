"use client"

import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { StorefrontProduct } from '@/http/get-storefront-products'
import { useCart } from '@/components/storefront/cart/use-cart'

export function ProductCard({
  store,
  product,
}: {
  store: string | null
  product: StorefrontProduct
}) {
  const { addItem, isFetching } = useCart()
  const [adding, setAdding] = useState(false)
  const hasVariant = Boolean(product.variantId)

  const href = store ? `/${store}/product/${product.slug}` : `/product/${product.slug}`

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.variantId) return
    setAdding(true)
    const res = await addItem(product.variantId, 1)
    if (!res.ok) {
      alert(`Falha ao adicionar ao carrinho: ${res.message ?? 'Erro desconhecido'}`)
      console.error('Add to cart error:', res.message)
    }
    setAdding(false)
  }

  return (
    <Link
      href={href}
      className="group block rounded border p-4 transition-colors hover:border-foreground/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-medium group-hover:underline">{product.name}</h2>
          <p className="text-sm text-muted-foreground">
            {product.price
              ? Number(product.price).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '—'}
          </p>
        </div>

        <Button
          size="sm"
          variant="default"
          disabled={!hasVariant || adding || isFetching}
          onClick={handleAdd}
        >
          {adding ? 'Adicionando…' : 'Add to Cart'}
        </Button>
      </div>
    </Link>
  )
}