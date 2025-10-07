"use client"

import { useParams } from 'next/navigation'

import { NavLink } from './nav-link'
import { Button } from './ui/button'

export function Tabs() {
  const { slug: orgSlug, store } = useParams<{ slug: string; store?: string }>()

  // Quando dentro de uma Store, escondemos as abas de Organização
  if (store) return null

  return (
    <div className="border-b py-4">
      <nav className="mx-auto flex max-w-[1200px] items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
        >
          <NavLink href={`/org/${orgSlug}`}>Stores</NavLink>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
        >
          <NavLink href={`/org/${orgSlug}/members`}>Members</NavLink>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="border border-transparent text-muted-foreground data-[current=true]:border-border data-[current=true]:text-foreground"
        >
          <NavLink href={`/org/${orgSlug}/settings`}>Settings & Billing</NavLink>
        </Button>
      </nav>
    </div>
  )
}
