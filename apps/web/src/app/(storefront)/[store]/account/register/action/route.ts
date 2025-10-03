import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@saas/env'

export async function POST(request: NextRequest, { params }: { params: { store: string } }) {
  const formData = await request.formData()
  const name = String(formData.get('name') ?? '')
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!name || !email || !password) {
    return NextResponse.json({ message: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 })
  }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/stores/${params.store}/account/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Falha ao registrar.' }))
    return NextResponse.json(data, { status: res.status })
  }

  const { accessToken, refreshToken, expiresIn } = (await res.json()) as {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }

  const c = cookies()

  c.set('customer_access_token', accessToken, {
    path: '/',
    maxAge: expiresIn,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  c.set('customer_refresh_token', refreshToken, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = `/${params.store}`
  redirectUrl.search = ''

  return NextResponse.redirect(redirectUrl)
}