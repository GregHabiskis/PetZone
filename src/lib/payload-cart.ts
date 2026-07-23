import type { Payload } from 'payload'
import type { CouponCartItem } from './coupons'

type ProductRelation = string | number | { id: string | number; slug?: string | null; name?: string | null }

type PayloadCartProduct = {
  id: number
  slug: string
  sku: string
  name: string
  price: number
  weightGrams: number
  stock: number
  status?: 'draft' | 'active' | 'archived' | null
  categories?: ProductRelation[] | null
}

export type PayloadCartLine = {
  product: PayloadCartProduct
  quantity: number
  orderItem: {
    product: number
    productName: string
    sku: string
    quantity: number
    unitPrice: number
    unitWeightGrams: number
  }
  couponItem: CouponCartItem
}

function relationKeys(relations: ProductRelation[] | null | undefined): string[] {
  return [...new Set((relations ?? []).flatMap((relation) => {
    if (typeof relation !== 'object') return [String(relation)]
    return [String(relation.id), relation.slug, relation.name].filter((value): value is string => Boolean(value))
  }))]
}

export async function resolvePayloadCart(
  payload: Pick<Payload, 'find'>,
  lines: Array<{ productId: string; quantity: number }>,
): Promise<PayloadCartLine[]> {
  const identifiers = [...new Set(lines.map((line) => line.productId.trim()).filter(Boolean))]
  const result = await payload.find({
    collection: 'products',
    where: {
      and: [
        { status: { equals: 'active' } },
        { or: [{ slug: { in: identifiers } }, { sku: { in: identifiers } }] },
      ],
    },
    locale: 'en',
    depth: 1,
    limit: Math.max(identifiers.length, 1),
    pagination: false,
    overrideAccess: true,
  })
  const products = result.docs as unknown as PayloadCartProduct[]
  const byIdentifier = new Map<string, PayloadCartProduct>()
  // A SKU that collides with another product's slug would silently swap the
  // ordered product (and its price) — reject the identifier instead.
  const ambiguous = new Set<string>()
  for (const product of products) {
    for (const key of [product.slug, product.sku]) {
      const existing = byIdentifier.get(key)
      if (existing && existing.id !== product.id) ambiguous.add(key)
      else byIdentifier.set(key, product)
    }
  }

  return lines.map((line) => {
    const product = byIdentifier.get(line.productId)
    if (!product || ambiguous.has(line.productId) || product.status !== 'active' || product.stock < line.quantity) {
      throw new Error(`Unavailable product: ${line.productId}`)
    }
    return {
      product,
      quantity: line.quantity,
      orderItem: {
        product: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: line.quantity,
        unitPrice: product.price,
        unitWeightGrams: product.weightGrams,
      },
      couponItem: {
        productKeys: [String(product.id), product.slug, product.sku],
        categoryKeys: relationKeys(product.categories),
        lineTotal: product.price * line.quantity,
      },
    }
  })
}
