import { env } from '@saas/env'

const API_URL = env.NEXT_PUBLIC_API_URL

type NextOptions = {
  revalidate?: number
  tags?: string[]
}

export async function apiFetch(
  path: string,
  init?: (RequestInit & { next?: NextOptions }) | undefined,
) {
  const url = new URL(path, API_URL)
  return fetch(url, {
    ...init,
  })
}

export function isDisabledStatus(status: number) {
  // Treat 404/410/423 as store disabled or resource unavailable for public storefront
  return status === 404 || status === 410 || status === 423
}