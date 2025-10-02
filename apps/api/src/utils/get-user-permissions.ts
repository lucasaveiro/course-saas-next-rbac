import { defineAbilityFor, type Role, userSchema } from '@saas/auth'

export function getUserPermissions(userId: string, role: string) {
  const normalizedRole = role === 'MEMBER' ? 'STORE_OWNER' : role

  const authUser = userSchema.parse({
    id: userId,
    role: normalizedRole as Role,
  })

  const ability = defineAbilityFor(authUser)

  return ability
}
