import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { resolvePayloadCart } from './payload-cart'

const activeProduct = {
  id: 41,
  slug: 'cms-cat-food',
  sku: 'CAT-41',
  name: 'CMS Cat Food',
  price: 799,
  weightGrams: 1200,
  stock: 5,
  status: 'active',
  categories: [{ id: 7, slug: 'cat', name: 'Cat' }],
}

describe('resolvePayloadCart', () => {
  it('prices and identifies cart lines only from active Payload products', async () => {
    const find = vi.fn(async () => ({ docs: [activeProduct] }))
    const result = await resolvePayloadCart({ find } as unknown as Pick<Payload, 'find'>, [{ productId: 'cms-cat-food', quantity: 2 }])

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'products', locale: 'en', depth: 1 }))
    expect(result).toEqual([{
      product: activeProduct,
      quantity: 2,
      orderItem: { product: 41, productName: 'CMS Cat Food', sku: 'CAT-41', quantity: 2, unitPrice: 799, unitWeightGrams: 1200 },
      couponItem: { productKeys: ['41', 'cms-cat-food', 'CAT-41'], categoryKeys: ['7', 'cat', 'Cat'], lineTotal: 1598 },
    }])
  })

  it('rejects missing, inactive, and understocked products', async () => {
    const find = vi.fn(async () => ({ docs: [{ ...activeProduct, stock: 1 }] }))
    await expect(resolvePayloadCart({ find } as unknown as Pick<Payload, 'find'>, [{ productId: 'cms-cat-food', quantity: 2 }]))
      .rejects.toThrow('Unavailable product: cms-cat-food')
  })
})
