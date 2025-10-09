import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getOrganizationPlanLimits } from '@/modules/shared/config/limits'

export async function ensureStoreLimit(organizationId: string) {
  const limits = getOrganizationPlanLimits()
  const count = await prisma.store.count({
    where: { organizationId },
  })

  if (count >= limits.maxStores) {
    throw new UnauthorizedError(
      'Organization store limit reached for current plan.',
    )
  }
}

export async function ensureUniqueStoreSlug(slug: string) {
  const existing = await prisma.store.findUnique({
    where: { slug },
    select: { id: true, organizationId: true },
  })

  if (existing) {
    throw new BadRequestError('A store with this slug already exists.')
  }
}

export async function ensureUniqueProductSlug(slug: string, storeId: string) {
  const existing = await prisma.product.findFirst({
    where: { slug, storeId },
    select: { id: true },
  })

  if (existing) {
    throw new BadRequestError(
      'A product with this slug already exists in this store.',
    )
  }
}

export async function ensureStoreBelongsToOrganization(
  storeId: string,
  organizationId: string,
) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, organizationId },
    select: { id: true },
  })

  if (!store) {
    throw new UnauthorizedError('Store does not belong to this organization.')
  }
}

export async function ensureUniqueCustomerEmail(
  organizationId: string,
  email: string,
) {
  const customer = await prisma.customer.findFirst({
    where: { organizationId, email },
    select: { id: true },
  })

  if (customer) {
    throw new BadRequestError(
      'A customer with this email already exists in organization.',
    )
  }
}

export async function ensureCustomerBelongsToOrganization(
  customerId: string,
  organizationId: string,
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId },
    select: { id: true },
  })

  if (!customer) {
    throw new UnauthorizedError(
      'Customer does not belong to this organization.',
    )
  }
}

export async function ensureOrderBelongsToOrganization(
  orderId: string,
  organizationId: string,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, organizationId },
    select: { id: true },
  })

  if (!order) {
    throw new UnauthorizedError('Order does not belong to this organization.')
  }
}

export async function ensureOrganizationDomainUnique(
  domain?: string | null,
  excludeOrganizationId?: string,
) {
  if (!domain) return

  const organization = await prisma.organization.findFirst({
    where: {
      domain,
      id: excludeOrganizationId ? { not: excludeOrganizationId } : undefined,
    },
    select: { id: true },
  })

  if (organization) {
    throw new BadRequestError(
      'Another organization with same domain already exists.',
    )
  }
}

export async function ensureStoreDomainUnique(
  domain?: string | null,
  excludeStoreDomainId?: string,
) {
  if (!domain) return

  const storeDomain = await prisma.storeDomain.findUnique({
    where: { domain },
    select: { id: true },
  })

  if (
    storeDomain &&
    (!excludeStoreDomainId || storeDomain.id !== excludeStoreDomainId)
  ) {
    throw new BadRequestError(
      'Another store with same custom domain already exists.',
    )
  }
}

export async function ensureStoreDomainBelongsToOrganization(
  storeDomainId: string,
  organizationId: string,
) {
  const storeDomain = await prisma.storeDomain.findFirst({
    where: { id: storeDomainId, organizationId },
    select: { id: true },
  })

  if (!storeDomain) {
    throw new UnauthorizedError(
      'Store domain does not belong to this organization.',
    )
  }
}
