import { describe, expect, it } from 'vitest'
import { calculateCoupon, calculateDiscountedTotals, normalizeCouponCode, type CouponRule } from './coupons'

const baseCoupon: CouponRule = {
  id: 1,
  code: 'SAVE10',
  active: true,
  discountType: 'percentage',
  discountValue: 10,
}

const items = [
  { productId: 'cat-food', category: 'Cat', lineTotal: 1_000 },
  { productId: 'dog-food', category: 'Dog', lineTotal: 500 },
]

describe('coupons', () => {
  it('normalizes coupon codes', () => {
    expect(normalizeCouponCode('  save-10 ')).toBe('SAVE-10')
  })

  it('rejects missing, inactive, future, expired, exhausted, and minimum-subtotal coupons', () => {
    const now = new Date('2026-07-22T10:00:00.000Z')
    expect(calculateCoupon(undefined, { items, subtotal: 1_500, now, usageCount: 0 }).error).toBe('Coupon not found.')
    expect(calculateCoupon({ ...baseCoupon, active: false }, { items, subtotal: 1_500, now, usageCount: 0 }).error).toBe('This coupon is inactive.')
    expect(calculateCoupon({ ...baseCoupon, startsAt: '2026-07-23T00:00:00.000Z' }, { items, subtotal: 1_500, now, usageCount: 0 }).error).toBe('This coupon is not active yet.')
    expect(calculateCoupon({ ...baseCoupon, endsAt: '2026-07-21T23:59:59.000Z' }, { items, subtotal: 1_500, now, usageCount: 0 }).error).toBe('This coupon has expired.')
    expect(calculateCoupon({ ...baseCoupon, usageLimit: 2 }, { items, subtotal: 1_500, now, usageCount: 2 }).error).toBe('This coupon has reached its usage limit.')
    expect(calculateCoupon({ ...baseCoupon, minimumSubtotal: 2_000 }, { items, subtotal: 1_500, now, usageCount: 0 }).error).toBe('A minimum subtotal of ৳ 2,000 is required.')
  })

  it('calculates percentage and fixed discounts without a negative subtotal', () => {
    expect(calculateCoupon(baseCoupon, { items, subtotal: 1_500, usageCount: 0 }).discount).toBe(150)
    expect(calculateCoupon({ ...baseCoupon, discountType: 'fixed', discountValue: 2_000 }, { items, subtotal: 1_500, usageCount: 0 })).toMatchObject({ discount: 1_500, discountedSubtotal: 0 })
  })

  it('matches Payload product and category relationship keys', () => {
    const restricted = { ...baseCoupon, eligibleProductIds: ['42'], eligibleCategories: ['7'] }
    const keyedItems = [{
      productId: 'cms-cat-food',
      category: 'Other',
      productKeys: ['42', 'cms-cat-food', 'CAT-42'],
      categoryKeys: ['7', 'cat', 'Cat'],
      lineTotal: 1_000,
    }]
    expect(calculateCoupon(restricted, { items: keyedItems, subtotal: 1_000, usageCount: 0 }).discount).toBe(100)
  })

  it('discounts only eligible products or categories and rejects no-match carts', () => {
    expect(calculateCoupon({ ...baseCoupon, eligibleCategories: ['Cat'] }, { items, subtotal: 1_500, usageCount: 0 }).discount).toBe(100)
    expect(calculateCoupon({ ...baseCoupon, discountType: 'fixed', discountValue: 700, eligibleProductIds: ['dog-food'] }, { items, subtotal: 1_500, usageCount: 0 }).discount).toBe(500)
    expect(calculateCoupon({ ...baseCoupon, eligibleCategories: ['Bird'] }, { items, subtotal: 1_500, usageCount: 0 }).error).toBe('This coupon does not apply to items in your cart.')
  })

  it('calculates bKash from discounted subtotal plus shipping', () => {
    expect(calculateDiscountedTotals(1_000, 100, 50, 'bkash')).toEqual({ discountedSubtotal: 900, fee: 17.58, total: 967.58 })
    expect(calculateDiscountedTotals(1_000, 100, 50, 'cash_on_delivery')).toEqual({ discountedSubtotal: 900, fee: 0, total: 950 })
  })
})
