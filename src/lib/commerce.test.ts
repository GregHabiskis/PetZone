import { describe, expect, it } from 'vitest'
import { addCartItem, bKashFee, cartTotal, checkoutTotal, filterProducts, normalizeCatalogFilters, recommendCartProducts, shippingQuote, type CartItem, type Product } from './commerce'

const product: Product = { id: 'royal-canin', slug: 'royal-canin', name: { en: 'Royal Canin', bn: 'রয়্যাল ক্যানিন' }, brand: 'Royal Canin', category: 'Cat', price: 2850, weightGrams: 1000, image: '/media/royal-canin-cat-food.jpg', inStock: true }

describe('commerce', () => {
  it('adds and increments the same product without duplicate lines', () => {
    const once = addCartItem([], product)
    const twice = addCartItem(once, product)
    expect(twice).toEqual([{ product, quantity: 2 }])
  })

  it('calculates BDT totals', () => {
    expect(cartTotal([{ product, quantity: 2 } satisfies CartItem])).toBe(5700)
  })

  it('filters products by localized search and brand', () => {
    expect(filterProducts([product], { query: 'রয়্যাল', brand: 'Royal Canin' })).toEqual([product])
    expect(filterProducts([product], { query: 'dog', brand: 'All' })).toEqual([])
  })

  it('combines query, brand, pet, and inclusive price filters', () => {
    expect(filterProducts([product], { query: 'রয়্যাল', brand: 'Royal Canin', pet: 'Cat', minPrice: 2850, maxPrice: 2850 })).toEqual([product])
    expect(filterProducts([product], { query: '', brand: 'All', pet: 'Dog', minPrice: 0, maxPrice: 9999 })).toEqual([])
    expect(filterProducts([product], { query: '', brand: 'All', pet: 'All', minPrice: 2851, maxPrice: 9999 })).toEqual([])
  })

  it('normalizes invalid and out-of-range catalog URL values safely', () => {
    expect(normalizeCatalogFilters([product], { brand: ' ', pet: 'Lizard', minPrice: '-10', maxPrice: 'oops', query: ' cat ' })).toEqual({ query: 'cat', brand: 'All', pet: 'All', minPrice: 2850, maxPrice: 2850, priceFloor: 2850, priceCeiling: 2850 })
    expect(normalizeCatalogFilters([{ ...product, price: 100 }, product], { minPrice: '3000', maxPrice: '50' })).toMatchObject({ minPrice: 100, maxPrice: 2850 })
  })

  it('preserves linked brands and every supported pet type for zero-result states', () => {
    expect(normalizeCatalogFilters([product], { brand: 'Whiskas', pet: 'Fish' })).toMatchObject({ brand: 'Whiskas', pet: 'Fish' })
    expect(normalizeCatalogFilters([product], { brand: 'Prama', pet: 'Fish' })).toMatchObject({ brand: 'Prama', pet: 'Fish' })
  })

  it('recommends in-stock products by category before brand without cart duplicates', () => {
    const cartProduct = { ...product, id: 'cart', brand: 'Shared', category: 'Cat' }
    const sameBrand = { ...product, id: 'brand', slug: 'brand', brand: 'Shared', category: 'Dog' }
    const sameCategory = { ...product, id: 'category', slug: 'category', brand: 'Other', category: 'Cat' }
    const both = { ...product, id: 'both', slug: 'both', brand: 'Shared', category: 'Cat' }
    const outOfStock = { ...product, id: 'out', slug: 'out', category: 'Cat', inStock: false }
    const unrelated = { ...product, id: 'other', slug: 'other', brand: 'Other', category: 'Bird' }

    expect(recommendCartProducts(
      [sameBrand, unrelated, cartProduct, sameCategory, outOfStock, both],
      [{ product: cartProduct, quantity: 1 }],
      4,
    ).map((item) => item.id)).toEqual(['both', 'category', 'brand', 'other'])
  })

  it('returns unique recommendations and respects the cap', () => {
    const duplicate = { ...product, id: 'duplicate', slug: 'duplicate' }
    expect(recommendCartProducts([duplicate, duplicate, { ...product, id: 'second' }], [{ product, quantity: 1 }], 1)).toEqual([duplicate])
  })

  it.each([
    [1000, 'Light Weight', 50],
    [1001, 'Medium Weight', 100],
    [10000, 'Medium Weight', 100],
    [10001, 'Heavy Weight', 150],
    [20000, 'Heavy Weight', 150],
    [20001, 'Very Heavy Weight', 200],
  ])('quotes home delivery by total cart weight', (weightGrams, shippingClass, rate) => {
    expect(shippingQuote(weightGrams, 'home_delivery')).toEqual({ shippingClass, rate })
  })

  it('makes local pickup free', () => {
    expect(shippingQuote(99999, 'local_pickup')).toEqual({ shippingClass: 'Local Pickup', rate: 0 })
  })

  it('adds the 1.85% bKash send-money fee and no COD fee', () => {
    expect(bKashFee(1000)).toBe(18.5)
    expect(checkoutTotal(1000, 50, 'bkash')).toBe(1069.43)
    expect(checkoutTotal(1000, 50, 'cash_on_delivery')).toBe(1050)
  })
})
