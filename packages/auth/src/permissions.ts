import { AbilityBuilder } from '@casl/ability'

import { AppAbility } from '.'
import { User } from './models/user'
import { Role } from './roles'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN(_, { can }) {
    can('manage', 'all')
  },
  STORE_OWNER(user, { can }) {
    can('get', 'User')
    can(['create', 'get'], 'Store')
    can(['update', 'delete'], 'Store', { ownerId: { $eq: user.id } })
  },
  CUSTOMER(_, { can }) {
    can('manage', 'Billing')
  },
}
