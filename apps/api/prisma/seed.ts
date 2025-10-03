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

  const anotherUser = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash,
    },
  })

  const anotherUser2 = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash,
    },
  })

  const orgAdmin = await prisma.organization.create({
    data: {
      name: 'Acme Inc (Admin)',
      domain: 'acme.com',
      slug: 'acme-admin',
      avatarUrl: faker.image.avatarGitHub(),
      shouldAttachUsersByDomain: true,
      ownerId: user.id,
      members: {
        createMany: {
          data: [
            { userId: user.id, role: 'ADMIN' },
            { userId: anotherUser.id, role: 'STORE_OWNER' },
            { userId: anotherUser2.id, role: 'STORE_OWNER' },
          ],
        },
      },
    },
  })

  // Create sample stores for orgAdmin
  const adminStores = await Promise.all(
    Array.from({ length: 3 }).map(() =>
      prisma.store.create({
        data: {
          name: faker.company.name(),
          slug: faker.lorem.slug(3),
          description: faker.lorem.paragraph(),
          avatarUrl: faker.image.avatarGitHub(),
          organizationId: orgAdmin.id,
          ownerId: faker.helpers.arrayElement([user.id, anotherUser.id, anotherUser2.id]),
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

  const orgCustomer = await prisma.organization.create({
    data: {
      name: 'Acme Inc (Customer)',
      slug: 'acme-customer',
      avatarUrl: faker.image.avatarGitHub(),
      ownerId: user.id,
      members: {
        createMany: {
          data: [
            { userId: user.id, role: 'CUSTOMER' },
            { userId: anotherUser.id, role: 'ADMIN' },
            { userId: anotherUser2.id, role: 'STORE_OWNER' },
          ],
        },
      },
    },
  })

  const customerStore = await prisma.store.create({
    data: {
      name: faker.company.name(),
      slug: faker.lorem.slug(3),
      description: faker.lorem.paragraph(),
      avatarUrl: faker.image.avatarGitHub(),
      organizationId: orgCustomer.id,
      ownerId: user.id,
      settings: {
        create: {
          currency: 'USD',
          inventoryPolicy: 'RESERVE_ON_ORDER',
          allowBackorders: false,
        },
      },
    },
  })

  const orgMember = await prisma.organization.create({
    data: {
      name: 'Acme Inc (Member)',
      slug: 'acme-member',
      avatarUrl: faker.image.avatarGitHub(),
      ownerId: user.id,
      members: {
        createMany: {
          data: [
            { userId: user.id, role: 'STORE_OWNER' },
            { userId: anotherUser.id, role: 'ADMIN' },
            { userId: anotherUser2.id, role: 'STORE_OWNER' },
          ],
        },
      },
    },
  })

  await prisma.store.create({
    data: {
      name: faker.company.name(),
      slug: faker.lorem.slug(3),
      description: faker.lorem.paragraph(),
      avatarUrl: faker.image.avatarGitHub(),
      organizationId: orgMember.id,
      ownerId: user.id,
      settings: {
        create: {
          currency: 'USD',
          inventoryPolicy: 'RESERVE_ON_ORDER',
          allowBackorders: false,
        },
      },
    },
  })
}

seed().then(() => {
  console.log('Database seeded!')
})
