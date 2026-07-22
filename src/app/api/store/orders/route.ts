import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { shippingQuote, type PaymentMethod, type ShippingMethod } from '@/lib/commerce'
import { calculateDiscountedTotals, validateCouponWithPayload, withCouponLock } from '@/lib/coupons'
import { resolvePayloadCart } from '@/lib/payload-cart'

const schema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(99) })).min(1),
  contact: z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: z.string().trim().regex(/^(?:\+?88)?01[3-9]\d{8}$/),
    email: z.union([z.literal(''), z.email()]).optional(),
    streetAddress: z.string().trim().min(4).max(500),
    city: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().min(3).max(12),
  }),
  shippingMethod: z.enum(['home_delivery', 'local_pickup']).default('home_delivery'),
  paymentMethod: z.enum(['bkash', 'bank_transfer', 'cash_on_delivery']).default('bkash'),
  bkashNumber: z.string().trim().optional(),
  bkashTransactionId: z.string().trim().optional(),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  note: z.string().trim().max(1000).optional(),
  couponCode: z.string().trim().max(64).optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === 'bkash') {
    if (!data.bkashNumber || !/^(?:\+?88)?01[3-9]\d{8}$/.test(data.bkashNumber)) ctx.addIssue({ code: 'custom', path: ['bkashNumber'], message: 'A valid bKash number is required.' })
    if (!data.bkashTransactionId) ctx.addIssue({ code: 'custom', path: ['bkashTransactionId'], message: 'The bKash transaction ID is required.' })
  }
})

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || user.collection !== 'customers') return Response.json({ error: 'You must sign in before placing an order.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Please check your checkout details.', issues: parsed.error.flatten().fieldErrors }, { status: 400 })

  let pricedCart
  try {
    pricedCart = await resolvePayloadCart(payload, parsed.data.items)
  } catch {
    return Response.json({ error: 'Your cart contains an unavailable product.' }, { status: 400 })
  }
  const orderItems = pricedCart.map((line) => line.orderItem)
  const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const totalWeightGrams = orderItems.reduce((sum, item) => sum + item.unitWeightGrams * item.quantity, 0)
  const shipping = shippingQuote(totalWeightGrams, parsed.data.shippingMethod as ShippingMethod)
  const paymentMethod = parsed.data.paymentMethod as PaymentMethod
  const acceptedAt = new Date().toISOString()
  const orderNumber = `PZ-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
  const createOrder = async () => {
    const coupon = parsed.data.couponCode
      ? await validateCouponWithPayload(payload, parsed.data.couponCode, {
        subtotal,
        items: pricedCart.map((line) => line.couponItem),
      })
      : { valid: true as const, discount: 0, discountedSubtotal: subtotal }
    if (!coupon.valid) return { error: coupon.error }
    const totals = calculateDiscountedTotals(subtotal, coupon.discount, shipping.rate, paymentMethod)
    const order = await payload.create({
      collection: 'orders',
      data: {
      orderNumber,
      customer: user.id,
      contact: { ...parsed.data.contact, email: parsed.data.contact.email || undefined },
      items: orderItems,
      subtotal,
      coupon: typeof coupon.couponId === 'number' ? coupon.couponId : undefined,
      couponCode: coupon.code,
      couponDiscount: coupon.discount,
      totalWeightGrams,
      shippingMethod: parsed.data.shippingMethod,
      shippingClass: shipping.shippingClass as 'Light Weight' | 'Medium Weight' | 'Heavy Weight' | 'Very Heavy Weight' | 'Local Pickup',
      shippingCost: shipping.rate,
      paymentMethod,
      bkashNumber: paymentMethod === 'bkash' ? parsed.data.bkashNumber : undefined,
      bkashTransactionId: paymentMethod === 'bkash' ? parsed.data.bkashTransactionId : undefined,
      bkashFee: totals.fee,
      total: totals.total,
      termsAcceptedAt: acceptedAt,
      privacyAcceptedAt: acceptedAt,
      note: parsed.data.note,
      paymentStatus: paymentMethod === 'bkash' ? 'submitted' : 'pending',
      status: 'received',
      },
      overrideAccess: true,
    })
    return { order }
  }
  const result = parsed.data.couponCode ? await withCouponLock(payload, parsed.data.couponCode, createOrder) : await createOrder()
  if ('error' in result) return Response.json({ error: result.error }, { status: 400 })
  const order = result.order
  return Response.json({ orderNumber: order.orderNumber, total: order.total }, { status: 201 })
}
