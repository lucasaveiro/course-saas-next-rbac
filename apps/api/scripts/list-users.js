// Simple script to list seeded user accounts for login testing
// Usage: set DATABASE_URL env and run: node apps/api/scripts/list-users.js

const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // All seeded users share the same initial password as defined in seed.ts
    const defaultPassword = '123456'

    const result = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      password: defaultPassword,
    }))

    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('Failed to list users:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()