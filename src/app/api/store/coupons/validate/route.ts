import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { shippingQuote, type PaymentMethod, type ShippingMethod } from '@/lib/commerce'
import { calculateDiscountedTotals, validateCouponWithPayload } from '@/lib/coupons'
import { getCustomerFromHeaders } from '@/lib/customer-session'
import { resolvePayloadCart } from '@/lib/payload-cart'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { isSameSiteRequest, readBoundedJson } from '@/lib/request-security'

const schema = z.object({
  code: z.string().trim().min(1).max(64),
  items: z.array(z.object({ productId: z.string().trim().min(1).max(100), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
  shippingMethod: z.enum(['home_delivery', 'local_pickup']).default('home_delivery'),
  paymentMethod: z.enum(['bkash', 'bank_transfer', 'cash_on_delivery']).default('bkash'),
})

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 })

  const payload = await getPayload({ config })
  const user = await getCustomerFromHeaders(payload, request.headers)
  if (!user) return Response.json({ error: 'You must sign in to apply a coupon.' }, { status: 401 })

  // Coupon-enumeration guard: 60 validations per 5 minutes per account.
  const limit = checkRateLimit(`coupons:${user.id}`, 60, 5 * 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)

  const parsed = schema.safeParse(await readBoundedJson(request))
  if (!parsed.success) return Response.json({ error: 'Enter a coupon code and check your cart.' }, { status: 400 })

  let cart
  try {
    cart = await resolvePayloadCart(payload, parsed.data.items)
  } catch {
    return Response.json({ error: 'Your cart contains an unavailable product.' }, { status: 400 })
  }
  const subtotal = cart.reduce((total, line) => total + line.orderItem.unitPrice * line.quantity, 0)
  const coupon = await validateCouponWithPayload(payload, parsed.data.code, {
    subtotal,
    items: cart.map((line) => line.couponItem),
  })
  if (!coupon.valid) return Response.json({ error: coupon.error }, { status: 400 })
  const totalWeightGrams = cart.reduce((total, line) => total + line.orderItem.unitWeightGrams * line.quantity, 0)
  const shipping = shippingQuote(totalWeightGrams, parsed.data.shippingMethod as ShippingMethod)
  const totals = calculateDiscountedTotals(subtotal, coupon.discount, shipping.rate, parsed.data.paymentMethod as PaymentMethod)
  return Response.json({ ...coupon, subtotal, shipping: shipping.rate, ...totals })
}
