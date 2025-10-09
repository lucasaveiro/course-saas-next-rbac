import { env } from '@saas/env'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { store: string } },
) {
  try {
    const store = params.store
    const cookieStore = cookies()
    const cartId = cookieStore.get('cart_id')?.value

    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/stores/${store}/cart`, {
      method: 'POST',
      headers: {
        ...(cartId ? { 'X-Cart-Id': cartId } : {}),
      },
      cache: 'no-store',
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    if (!cartId || cartId !== (data as any).cartId) {
      cookieStore.set('cart_id', (data as any).cartId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { message: 'Falha de rede ou API indisponível', detail: message },
      { status: 502 },
    )
  }
}
