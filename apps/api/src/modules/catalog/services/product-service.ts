/* eslint-disable no-useless-constructor */
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { ProductRepository } from '@/modules/catalog/repositories/product-repository'
import {
  ensureStoreBelongsToOrganization,
  ensureUniqueProductSlug,
} from '@/modules/shared/validators/tenant-rules'
import { createSlug } from '@/utils/create-slug'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type CreateProductParams = {
  organizationId: string
  storeId: string
  name: string
  description?: string | null
  // Physical attributes
  weight?: string
  width?: string
  length?: string
  depth?: string
  quantityPerPallet?: number
  // Pricing
  price?: string
}

type UpdateProductParams = {
  name?: string
  description?: string | null
  slug?: string
}

export class ProductService {
  constructor(private readonly repo: ProductRepository) {}

  async createProduct(params: CreateProductParams) {
    await ensureStoreBelongsToOrganization(
      params.storeId,
      params.organizationId,
    )
    const slug = createSlug(params.name)
    await ensureUniqueProductSlug(slug)

    const created = await this.repo.create({
      organizationId: params.organizationId,
      storeId: params.storeId,
      name: params.name,
      description: params.description ?? null,
      slug,
      weight: params.weight,
      width: params.width,
      length: params.length,
      depth: params.depth,
      quantityPerPallet: params.quantityPerPallet,
    })

    // If price provided, create a default variant for the product
    if (params.price) {
      const storeSetting = await prisma.storeSetting.findUnique({
        where: { storeId: params.storeId },
        select: { currency: true },
      })
      const currency = storeSetting?.currency ?? 'USD'
      await prisma.productVariant.create({
        data: {
          productId: created.id,
          sku: `${slug}-default`,
          price: new Prisma.Decimal(params.price),
          currency,
          inventoryQuantity: 0,
        },
        select: { id: true },
      })
    }

    return created
  }

  async updateProduct(
    productId: string,
    organizationId: string,
    updates: UpdateProductParams,
  ) {
    if (updates.slug) {
      await ensureUniqueProductSlug(updates.slug)
    }
    // Optional: verify the product belongs to organization before updating
    const existing = await this.repo.findBySlug(
      organizationId,
      updates.slug ?? '',
    )
    if (updates.slug && existing && existing.id !== productId) {
      throw new BadRequestError(
        'Another product with same slug already exists.',
      )
    }

    // Implement an update method in repository if needed; for now, use Prisma directly
    // Keeping updates minimal and validated above
    return await (
      await import('@/lib/prisma')
    ).prisma.product.update({
      where: { id: productId },
      data: {
        name: updates.name,
        description: updates.description ?? null,
        slug: updates.slug,
      },
      select: { id: true },
    })
  }
}

export function makeProductService() {
  return new ProductService(new ProductRepository())
}
