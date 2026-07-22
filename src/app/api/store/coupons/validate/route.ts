import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { shippingQuote, type PaymentMethod, type ShippingMethod } from '@/lib/commerce'
import { calculateDiscountedTotals, validateCouponWithPayload } from '@/lib/coupons'
import { getCustomerFromHeaders } from '@/lib/customer-session'
import { resolvePayloadCart } from '@/lib/payload-cart'

const schema = z.object({
  code: z.string().trim().min(1).max(64),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(99) })).min(1),
  shippingMethod: z.enum(['home_delivery', 'local_pickup']).default('home_delivery'),
  paymentMethod: z.enum(['bkash', 'bank_transfer', 'cash_on_delivery']).default('bkash'),
})

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const user = await getCustomerFromHeaders(payload, request.headers)
  if (!user) return Response.json({ error: 'You must sign in to apply a coupon.' }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
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
