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
    // Catálogo e inventário visíveis para dono de loja
    can(['get', 'manage'], 'Product')
  },
  STORE_ADMIN(_, { can }) {
    can('get', 'User')
    can('manage', 'Store')
    can('manage', 'Product')
  },
  STAFF(_, { can }) {
    can('get', 'Store')
    can(['create', 'get', 'update'], 'Product')
  },
  SUPPORT(_, { can }) {
    can('manage', 'Billing')
    can('get', 'Store')
    can('get', 'Product')
  },
  CUSTOMER(_, { can }) {
    // Cliente não acessa gestão interna; apenas Billing (checkout)
    can('manage', 'Billing')
  },
}
