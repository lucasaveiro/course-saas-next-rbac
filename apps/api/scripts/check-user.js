const { PrismaClient } = require('@prisma/client')
const { compare } = require('bcryptjs')

;(async () => {
  const db = new PrismaClient()
  try {
    const email = process.argv[2]
    const password = process.argv[3]

    if (!email) {
      console.error('Usage: node scripts/check-user.js <email> <password>')
      process.exit(1)
    }

    const user = await db.user.findUnique({ where: { email } })

    console.log('userExists:', !!user)
    if (user) {
      console.log('user:', {
        id: user.id,
        email: user.email,
        hasPasswordHash: user.passwordHash != null,
      })

      if (user.passwordHash) {
        const ok = await compare(password ?? '', user.passwordHash)
        console.log('passwordMatches:', ok)
      }
    }
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  } finally {
    await db.$disconnect()
  }
})()