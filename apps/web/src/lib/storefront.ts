import { headers } from 'next/headers'

function getSubdomainFromHost(host?: string | null) {
  if (!host) return null

  const cleanHost = host.replace(/:\d+$/, '')
  const parts = cleanHost.split('.')

  if (parts.length <= 2) return null

  const sub = parts[0]
  if (sub === 'www') return null
  return sub
}

export function resolveStoreSlug(paramStore?: string) {
  const host = headers().get('host')
  const subdomain = getSubdomainFromHost(host)

  return subdomain ?? paramStore ?? null
}
