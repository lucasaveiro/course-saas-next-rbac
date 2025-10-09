import { env } from '@saas/env'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { store: string } },
) {
  const store = params.store
  const { action, variantId, quantity, itemId } = await request.json()
  const cookieStore = cookies()
  const cartId = cookieStore.get('cart_id')?.value

  // Ensure cart exists first
  let effectiveCartId = cartId
  if (!effectiveCartId) {
    const initRes = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/stores/${store}/cart`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      },
    )
    const initData = await initRes.json()
    if (!initRes.ok)
      return NextResponse.json(initData, { status: initRes.status })
    effectiveCartId = initData.cartId
    // Ensure type is a string when setting cookie to satisfy Next types
    cookieStore.set('cart_id', initData.cartId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  if (action === 'add') {
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/stores/${store}/cart/items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cart-Id': effectiveCartId!,
        },
        body: JSON.stringify({ variantId, quantity }),
        cache: 'no-store',
      },
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  }

  if (action === 'update') {
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/stores/${store}/cart/items/${itemId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Cart-Id': effectiveCartId!,
        },
        body: JSON.stringify({ quantity }),
        cache: 'no-store',
      },
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  }

  if (action === 'remove') {
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/stores/${store}/cart/items/${itemId}`,
      {
        method: 'DELETE',
        headers: { 'X-Cart-Id': effectiveCartId! },
        cache: 'no-store',
      },
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  }

  return NextResponse.json({ message: 'Unsupported action' }, { status: 400 })
}
