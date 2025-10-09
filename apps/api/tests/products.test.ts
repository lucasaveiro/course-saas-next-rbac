import { buildApp } from '../src/http/app'
import { prisma } from '../src/lib/prisma'

async function main() {
  const app = buildApp()
  await app.ready()

  const suffix = Date.now().toString()
  const orgSlug = `org-${suffix}`
  const storeSlug = `store-${suffix}`

  // Create users
  const adminUser = await prisma.user.create({
    data: { email: `admin-${suffix}@test.com`, name: 'Admin Test' },
  })
  const customerUser = await prisma.user.create({
    data: { email: `customer-${suffix}@test.com`, name: 'Customer Test' },
  })

  // Create organization and members
  const organization = await prisma.organization.create({
    data: {
      name: `Org ${suffix}`,
      slug: orgSlug,
      ownerId: adminUser.id,
    },
  })

  await prisma.member.create({
    data: {
      userId: adminUser.id,
      organizationId: organization.id,
      role: 'STORE_OWNER',
    },
  })

  await prisma.member.create({
    data: {
      userId: customerUser.id,
      organizationId: organization.id,
      role: 'CUSTOMER',
    },
  })

  // Create store
  const store = await prisma.store.create({
    data: {
      name: `Store ${suffix}`,
      description: 'Test store',
      slug: storeSlug,
      organizationId: organization.id,
      ownerId: adminUser.id,
    },
  })

  // Sign tokens
  const adminToken = (app as any).jwt.sign({ sub: adminUser.id }, { expiresIn: '1d' })
  const customerToken = (app as any).jwt.sign({ sub: customerUser.id }, { expiresIn: '1d' })

  // Create product (authorized)
  const createRes = await app.inject({
    method: 'POST',
    url: `/organizations/${orgSlug}/stores/${store.id}/products`,
    headers: { Authorization: `Bearer ${adminToken}` },
    payload: {
      name: `Product ${suffix}-A`,
      description: 'Desc A',
      price: '100',
      qtPerPallet: 10,
    },
  })

  if (createRes.statusCode !== 201) {
    console.error('Create product failed:', createRes.statusCode, createRes.body)
    process.exit(1)
  }

  const { productId } = createRes.json()

  // List products (authorized)
  const listRes = await app.inject({
    method: 'GET',
    url: `/organizations/${orgSlug}/stores/${storeSlug}/products?page=1&perPage=10`,
    headers: { Authorization: `Bearer ${adminToken}` },
  })

  if (listRes.statusCode !== 200) {
    console.error('List products failed:', listRes.statusCode, listRes.body)
    process.exit(1)
  }

  const listBody = listRes.json()
  if (!Array.isArray(listBody.products) || listBody.products.length < 1) {
    console.error('Expected at least one product in list response')
    process.exit(1)
  }
  if (listBody.products[0].id !== productId) {
    console.error('Listed product does not match created product')
    process.exit(1)
  }
  if (!listBody.meta || typeof listBody.meta.totalPages !== 'number') {
    console.error('List response missing meta.totalPages')
    process.exit(1)
  }

  // RBAC: listing products should be unauthorized for CUSTOMER role
  const listUnauthorized = await app.inject({
    method: 'GET',
    url: `/organizations/${orgSlug}/stores/${storeSlug}/products`,
    headers: { Authorization: `Bearer ${customerToken}` },
  })
  if (listUnauthorized.statusCode !== 401) {
    console.error('Expected 401 for unauthorized listing, got', listUnauthorized.statusCode)
    process.exit(1)
  }

  // RBAC: creation should be unauthorized for CUSTOMER role
  const createUnauthorized = await app.inject({
    method: 'POST',
    url: `/organizations/${orgSlug}/stores/${store.id}/products`,
    headers: { Authorization: `Bearer ${customerToken}` },
    payload: { name: `Product ${suffix}-B`, description: null, price: '50' },
  })
  if (createUnauthorized.statusCode !== 401) {
    console.error('Expected 401 for unauthorized creation, got', createUnauthorized.statusCode)
    process.exit(1)
  }

  console.log('Integration tests passed: product create/list with RBAC and store filter')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })