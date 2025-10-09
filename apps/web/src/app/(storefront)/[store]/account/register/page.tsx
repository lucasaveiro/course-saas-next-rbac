'use client'

import { useState } from 'react'

export default function CustomerRegisterPage({
  params,
}: {
  params: { store: string }
}) {
  const storeSlug = params.store
  const [pending, setPending] = useState(false)

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Criar conta</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Cadastre-se para comprar em <strong>{storeSlug}</strong>.
      </p>

      <form
        action={
          `/` + encodeURIComponent(storeSlug) + `/account/register/action`
        }
        method="POST"
        onSubmit={() => setPending(true)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Seu nome"
          />
        </div>

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
          {pending ? 'Criando…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Já tem conta?{' '}
        <a
          href={`/${encodeURIComponent(storeSlug)}/account/login`}
          className="underline"
        >
          Entrar
        </a>
      </p>
    </div>
  )
}
