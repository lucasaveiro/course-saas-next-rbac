/*
  Quick script to list all products per store for the seeded org
  Runs outside the web routes, prints concise JSON for verification
*/

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const orgSlug = process.env.ORG_SLUG || 'acme-admin'

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, slug: true },
  })

  if (!org) {
    console.error(`Organization not found for slug: ${orgSlug}`)
    process.exit(1)
  }

  const stores = await prisma.store.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, slug: true, name: true },
  })

  const result = []

  for (const s of stores) {
    const products = await prisma.product.findMany({
      where: { storeId: s.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, slug: true, createdAt: true },
    })

    result.push({
      organization: org.slug,
      storeSlug: s.slug,
      storeName: s.name,
      products,
    })
  }

  console.log(JSON.stringify(result, null, 2))
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })