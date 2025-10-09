'use client'

import { useState } from 'react'

export default function CustomerLoginPage({
  params,
}: {
  params: { store: string }
}) {
  const storeSlug = params.store
  const [pending, setPending] = useState(false)

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Entrar na conta</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Faça login para continuar comprando em <strong>{storeSlug}</strong>.
      </p>

      <form
        action={`/` + encodeURIComponent(storeSlug) + `/account/login/action`}
        method="POST"
        onSubmit={() => setPending(true)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full border rounded px-3 py-2"
            placeholder="seu@email.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full border rounded px-3 py-2"
            placeholder="••••••"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-black text-white py-2"
          disabled={pending}
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Novo por aqui?{' '}
        <a
          href={`/${encodeURIComponent(storeSlug)}/account/register`}
          className="underline"
        >
          Criar conta
        </a>
      </p>
    </div>
  )
}
