/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable simple-import-sort/imports */
/* eslint-disable prettier/prettier */
import { faker } from '@faker-js/faker'
import { PrismaClient, Prisma } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await hash('123456', 1)

  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@acme.com',
      avatarUrl: 'https://github.com/diego3g.png',
      passwordHash,
    },
  })

  const courtney = await prisma.user.create({
    data: {
      name: 'Courtney Wyman',
      email: 'Cleveland.Runte@gmail.com',
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash,
    },
  })

  const raymond = await prisma.user.create({
    data: {
      name: 'Raymond Lehner',
      email: 'Omari.Wehner21@hotmail.com',
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash,
    },
  })

  const orgAdmin = await prisma.organization.create({
    data: {
      name: 'Acme_Organization',
      domain: 'acme.com',
      slug: 'acme-admin',
      avatarUrl: faker.image.avatarGitHub(),
      shouldAttachUsersByDomain: true,
      ownerId: user.id,
      members: {
        createMany: {
          data: [
            { userId: user.id, role: 'ADMIN' },
            { userId: courtney.id, role: 'CUSTOMER' },
            { userId: raymond.id, role: 'STORE_OWNER' },
          ],
        },
      },
    },
  })

  // Create sample stores for orgAdmin
  const adminStores = await Promise.all(
    Array.from({ length: 2 }).map(() =>
      prisma.store.create({
        data: {
          name: faker.company.name(),
          slug: faker.lorem.slug(3),
          description: faker.lorem.paragraph(),
          avatarUrl: faker.image.avatarGitHub(),
          organizationId: orgAdmin.id,
          ownerId: raymond.id,
          settings: {
            create: {
              currency: 'USD',
              inventoryPolicy: 'RESERVE_ON_ORDER',
              allowBackorders: false,
            },
          },
        },
      })
    )
  )

  // For each store in admin org, create minimal catalog data
  for (const s of adminStores) {
    const category = await prisma.category.create({
      data: {
        name: faker.commerce.department(),
        slug: faker.lorem.slug(2),
        description: faker.lorem.sentence(),
        organizationId: orgAdmin.id,
        storeId: s.id,
      },
    })

    const collection = await prisma.collection.create({
      data: {
        name: faker.commerce.productAdjective(),
        slug: faker.lorem.slug(2),
        description: faker.lorem.sentence(),
        organizationId: orgAdmin.id,
        storeId: s.id,
      },
    })

    const products = await Promise.all(
      Array.from({ length: 3 }).map(() =>
        prisma.product.create({
          data: {
            name: faker.commerce.productName(),
            slug: faker.lorem.slug(3),
            description: faker.commerce.productDescription(),
            organizationId: orgAdmin.id,
            storeId: s.id,
            variants: {
              create: [
                {
                  sku: faker.string.alphanumeric(8),
                  price: new Prisma.Decimal('49.90'),
                  currency: 'USD',
                  inventoryQuantity: faker.number.int({ min: 0, max: 100 }),
                  options: { create: [{ name: 'Size', value: 'M' }] },
                },
              ],
            },
          },
        })
      )
    )

    // Link products to category and collection via join tables
    for (const p of products) {
      await prisma.productCategory.create({
        data: { productId: p.id, categoryId: category.id },
      })
      await prisma.productCollection.create({
        data: { productId: p.id, collectionId: collection.id },
      })
    }
  }

  // Removed extra organizations (acme-customer, acme-member) to keep a single tenant
}

seed().then(() => {
  console.log('Database seeded!')
})
