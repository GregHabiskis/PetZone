import type { Payload } from 'payload'
import { bKashFee, formatBDT, type PaymentMethod } from './commerce'

export type CouponRule = {
  id: string | number
  code: string
  active: boolean
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minimumSubtotal?: number | null
  startsAt?: string | null
  endsAt?: string | null
  usageLimit?: number | null
  eligibleProductIds?: string[]
  eligibleCategories?: string[]
}

export type CouponCartItem = {
  productId?: string
  category?: string
  productKeys?: string[]
  categoryKeys?: string[]
  lineTotal: number
}
export type CouponResult = {
  valid: boolean
  error?: string
  code?: string
  couponId?: string | number
  discount: number
  discountedSubtotal: number
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toLocaleUpperCase('en-US')
}

const currency = (value: number) => formatBDT(value).replace('৳ ', '৳ ')
const normalizedSet = (values: string[] = []) => new Set(values.map((value) => value.toLocaleLowerCase()))

export function calculateCoupon(
  coupon: CouponRule | undefined,
  input: { items: CouponCartItem[]; subtotal: number; usageCount: number; now?: Date },
): CouponResult {
  const invalid = (error: string): CouponResult => ({ valid: false, error, discount: 0, discountedSubtotal: input.subtotal })
  if (!coupon) return invalid('Coupon not found.')
  const now = input.now ?? new Date()
  if (!coupon.active) return invalid('This coupon is inactive.')
  if (coupon.startsAt && now < new Date(coupon.startsAt)) return invalid('This coupon is not active yet.')
  if (coupon.endsAt && now > new Date(coupon.endsAt)) return invalid('This coupon has expired.')
  if (coupon.usageLimit != null && input.usageCount >= coupon.usageLimit) return invalid('This coupon has reached its usage limit.')
  if (coupon.minimumSubtotal != null && input.subtotal < coupon.minimumSubtotal) return invalid(`A minimum subtotal of ${currency(coupon.minimumSubtotal)} is required.`)

  const productIds = normalizedSet(coupon.eligibleProductIds)
  const categories = normalizedSet(coupon.eligibleCategories)
  const restricted = productIds.size > 0 || categories.size > 0
  const eligibleSubtotal = input.items.reduce((total, item) => {
    const itemProductKeys = [...(item.productKeys ?? []), ...(item.productId ? [item.productId] : [])]
    const itemCategoryKeys = [...(item.categoryKeys ?? []), ...(item.category ? [item.category] : [])]
    const productMatch = itemProductKeys.some((key) => productIds.has(key.toLocaleLowerCase()))
    const categoryMatch = itemCategoryKeys.some((key) => categories.has(key.toLocaleLowerCase()))
    return total + (!restricted || productMatch || categoryMatch ? item.lineTotal : 0)
  }, 0)
  if (restricted && eligibleSubtotal === 0) return invalid('This coupon does not apply to items in your cart.')

  const rawDiscount = coupon.discountType === 'percentage'
    ? eligibleSubtotal * Math.min(coupon.discountValue, 100) / 100
    : coupon.discountValue
  const discount = Math.round(Math.min(Math.max(rawDiscount, 0), eligibleSubtotal, input.subtotal) * 100) / 100
  return {
    valid: true,
    code: normalizeCouponCode(coupon.code),
    couponId: coupon.id,
    discount,
    discountedSubtotal: Math.max(0, input.subtotal - discount),
  }
}

export function calculateDiscountedTotals(subtotal: number, discount: number, shipping: number, payment: PaymentMethod) {
  const discountedSubtotal = Math.max(0, subtotal - discount)
  const beforeFee = discountedSubtotal + shipping
  const fee = payment === 'bkash' ? bKashFee(beforeFee) : 0
  return { discountedSubtotal, fee, total: beforeFee + fee }
}

type Relation = string | number | { id: string | number; slug?: string | null; name?: string | Record<string, string> | null }
type CouponDocument = CouponRule & { eligibleProducts?: Relation[] | null; eligibleCategories?: Relation[] | null }

function relationKeys(relations: Relation[] | null | undefined): string[] {
  return (relations ?? []).flatMap((relation) => {
    if (typeof relation !== 'object') return [String(relation)]
    const names = typeof relation.name === 'object' && relation.name ? Object.values(relation.name) : relation.name ? [relation.name] : []
    return [String(relation.id), relation.slug, ...names].filter((value): value is string => Boolean(value))
  })
}

export async function validateCouponWithPayload(
  payload: Payload,
  code: string,
  input: { items: CouponCartItem[]; subtotal: number; now?: Date },
): Promise<CouponResult> {
  const normalizedCode = normalizeCouponCode(code)
  const result = await payload.find({
    collection: 'coupons',
    where: { code: { equals: normalizedCode } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  const document = result.docs[0] as unknown as CouponDocument | undefined
  if (!document) return calculateCoupon(undefined, { ...input, usageCount: 0 })
  const usage = await payload.count({ collection: 'orders', where: { coupon: { equals: document.id } }, overrideAccess: true })
  return calculateCoupon({
    ...document,
    eligibleProductIds: relationKeys(document.eligibleProducts),
    eligibleCategories: relationKeys(document.eligibleCategories),
  }, { ...input, usageCount: usage.totalDocs })
}

type LockClient = { query: (query: string, values?: unknown[]) => Promise<unknown>; release: () => void }

export async function withCouponLock<T>(payload: Payload, code: string, operation: () => Promise<T>): Promise<T> {
  const pool = (payload.db as unknown as { pool: { connect: () => Promise<LockClient> } }).pool
  const client = await pool.connect()
  const lockKey = `petzone-coupon:${normalizeCouponCode(code)}`
  await client.query('select pg_advisory_lock(hashtext($1))', [lockKey])
  try {
    return await operation()
  } finally {
    await client.query('select pg_advisory_unlock(hashtext($1))', [lockKey])
    client.release()
  }
}
