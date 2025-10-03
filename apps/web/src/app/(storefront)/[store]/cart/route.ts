import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@saas/env'

export async function GET(request: NextRequest, { params }: { params: { store: string } }) {
  const store = params.store
  const cookieStore = cookies()
  const cartId = cookieStore.get('cart_id')?.value

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/stores/${store}/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cartId ? { 'X-Cart-Id': cartId } : {}),
    },
    cache: 'no-store',
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  if (!cartId || cartId !== data.cartId) {
    cookieStore.set('cart_id', data.cartId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  return NextResponse.json(data)
}