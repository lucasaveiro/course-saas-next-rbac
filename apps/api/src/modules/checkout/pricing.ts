import { Prisma } from '@prisma/client'

type Address = {
  country: string
  state?: string | null
}

export function calculateShipping(address: Address) {
  // Simple rule: domestic base $10, international $25
  const isDomestic = address.country.toUpperCase() === 'US'
  return new Prisma.Decimal(isDomestic ? 10 : 25)
}

export function calculateTaxes({
  subtotal,
  taxRatePercentage,
}: {
  subtotal: Prisma.Decimal
  taxRatePercentage?: Prisma.Decimal | null
}) {
  const percentage = taxRatePercentage ?? new Prisma.Decimal(0)
  return subtotal.mul(percentage).div(100)
}

export function sumSubtotal(items: Array<{ totalPrice: Prisma.Decimal }>) {
  return items.reduce((acc, i) => acc.add(i.totalPrice), new Prisma.Decimal(0))
}