import { Prisma } from '@prisma/client'

type AntifraudContext = {
  subtotal: Prisma.Decimal
  shippingCountry: string
  customerEmail?: string | null
  itemCount: number
}

export function computeRiskScore(ctx: AntifraudContext) {
  let score = 0

  // High value order
  if (ctx.subtotal.greaterThan(new Prisma.Decimal(500))) score += 30
  if (ctx.subtotal.greaterThan(new Prisma.Decimal(1000))) score += 20

  // Suspicious email domain
  if (ctx.customerEmail) {
    const domain = ctx.customerEmail.split('@')[1]?.toLowerCase()
    const suspicious = ['mailinator.com', 'guerrillamail.com', 'tempmail.com']
    if (domain && suspicious.includes(domain)) score += 30
  }

  // Unusual quantities
  if (ctx.itemCount >= 10) score += 15
  if (ctx.itemCount >= 20) score += 20

  // Country risk (example heuristic)
  const highRiskCountries = ['NG', 'PK']
  if (highRiskCountries.includes(ctx.shippingCountry.toUpperCase())) score += 25

  return score
}

export function isHighRisk(score: number) {
  return score >= 70
}