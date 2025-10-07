'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'

type CartItem = {
  id: string
  productId: string
  variantId: string | null
  quantity: number
  unitPrice: string
  totalPrice: string
  inventoryQuantity: number | null
  name: string
}

type StoreSettings = {
  storeAddress: string
  costPerKm: number
  qtPerPallet: number
  maxTruckPallets: number
}

type Product = {
  id: string
  qtPerPallet: number
  weight: number
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

export function useCart() {
  const params = useParams<{ store?: string }>()
  const store = params?.store ?? 'placeholder-store'

  const query = useQuery<CartResponse>({
    queryKey: ['cart', store],
    queryFn: async () => {
      const res = await fetch(`/${store}/cart`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load cart')
      return res.json()
    },
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // 10s polling for near real-time
  })

  const addItem = async (variantId: string, quantity = 1) => {
    const res = await fetch(`/${store}/cart/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', variantId, quantity }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.message ?? 'Failed to add to cart')
    }
    query.refetch()
  }

  const updateItem = async (itemId: string, quantity: number) => {
    const res = await fetch(`/${store}/cart/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', itemId, quantity }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.message ?? 'Failed to update item')
    }
    query.refetch()
  }

  const removeItem = async (itemId: string) => {
    const res = await fetch(`/${store}/cart/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', itemId }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.message ?? 'Failed to remove item')
    }
    query.refetch()
  }

  const updateDeliveryAddress = async (address: string) => {
    const res = await fetch(`/${store}/cart/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateAddress', address }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.message ?? 'Failed to update delivery address')
    }
    query.refetch()
  }

  return { ...query, addItem, updateItem, removeItem, updateDeliveryAddress }
}