'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'

// Consolidate CartItem type to include optional product details

type StoreSettings = {
  storeAddress: string
  costPerKm: number
  maxTruckPallets: number
}

type Product = {
  id: string
  qtPerPallet: number
  weight: number
  quantityPerPallet?: number
}

type CartItem = {
  id: string
  productId: string
  variantId: string | null
  quantity: number
  unitPrice: string
  totalPrice: string
  inventoryQuantity: number | null
  name: string
  product?: Product
}

type CartResponse = {
  cartId: string
  items: CartItem[]
  storeSettings?: StoreSettings
  deliveryAddress?: string
}

type ActionResult = { ok: boolean; message?: string }

export function useCart() {
  const params = useParams<{ store?: string }>()
  const store = params?.store ?? 'placeholder-store'

  const query = useQuery<CartResponse>({
    queryKey: ['cart', store],
    queryFn: async () => {
      const res = await fetch(`/${store}/cart/api`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load cart')
      return res.json()
    },
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // 10s polling for near real-time
  })

  const addItem = async (variantId: string, quantity = 1): Promise<ActionResult> => {
    try {
      const res = await fetch(`/${store}/cart/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', variantId, quantity }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = res.status >= 500
          ? 'Serviço do carrinho indisponível. Tente novamente mais tarde.'
          : (data?.message ?? 'Não foi possível adicionar ao carrinho')
        return { ok: false, message }
      }
      try {
        await query.refetch()
      } catch (err) {
        console.error('Falha ao refazer consulta do carrinho após adicionar:', err)
      }
      return { ok: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      return { ok: false, message: msg }
    }
  }

  const updateItem = async (itemId: string, quantity: number): Promise<ActionResult> => {
    try {
      const res = await fetch(`/${store}/cart/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', itemId, quantity }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = res.status >= 500
          ? 'Serviço do carrinho indisponível. Tente novamente mais tarde.'
          : (data?.message ?? 'Não foi possível atualizar o item')
        return { ok: false, message }
      }
      try {
        await query.refetch()
      } catch (err) {
        console.error('Falha ao refazer consulta do carrinho após atualizar:', err)
      }
      return { ok: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      return { ok: false, message: msg }
    }
  }

  const removeItem = async (itemId: string): Promise<ActionResult> => {
    try {
      const res = await fetch(`/${store}/cart/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', itemId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = res.status >= 500
          ? 'Serviço do carrinho indisponível. Tente novamente mais tarde.'
          : (data?.message ?? 'Não foi possível remover o item')
        return { ok: false, message }
      }
      try {
        await query.refetch()
      } catch (err) {
        console.error('Falha ao refazer consulta do carrinho após remover:', err)
      }
      return { ok: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      return { ok: false, message: msg }
    }
  }

  const updateDeliveryAddress = async (address: string): Promise<ActionResult> => {
    try {
      const res = await fetch(`/${store}/cart/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateAddress', address }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = res.status >= 500
          ? 'Serviço do carrinho indisponível. Tente novamente mais tarde.'
          : (data?.message ?? 'Não foi possível atualizar o endereço de entrega')
        return { ok: false, message }
      }
      try {
        await query.refetch()
      } catch (err) {
        console.error('Falha ao refazer consulta do carrinho após atualizar endereço:', err)
      }
      return { ok: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      return { ok: false, message: msg }
    }
  }

  return { ...query, addItem, updateItem, removeItem, updateDeliveryAddress }
}
