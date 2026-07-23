import config from '@payload-config'
import { commitTransaction, createLocalReq, getPayload, initTransaction, killTransaction, type Payload, type PayloadRequest } from 'payload'
import { z } from 'zod'
import { shippingQuote, type PaymentMethod, type ShippingMethod } from '@/lib/commerce'
import { calculateDiscountedTotals, normalizeCouponCode, validateCouponWithPayload, withAdvisoryLocks } from '@/lib/coupons'
import { getCustomerFromHeaders, type CustomerSessionUser } from '@/lib/customer-session'
import { resolvePayloadCart, type PayloadCartLine } from '@/lib/payload-cart'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { getClientIp, isSameSiteRequest, readBoundedJson } from '@/lib/request-security'

const schema = z.object({
  items: z.array(z.object({ productId: z.string().trim().min(1).max(100), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
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
  bkashNumber: z.string().trim().max(20).optional(),
  bkashTransactionId: z.string().trim().max(64).optional(),
  idempotencyKey: z.string().uuid().optional(),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  note: z.string().trim().max(1000).optional(),
  couponCode: z.string().trim().max(64).optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === 'bkash') {
    if (!data.bkashNumber || !/^(?:\+?88)?01[3-9]\d{8}$/.test(data.bkashNumber)) ctx.addIssue({ code: 'custom', path: ['bkashNumber'], message: 'A valid bKash number is required.' })
    if (!data.bkashTransactionId || data.bkashTransactionId.length < 4) ctx.addIssue({ code: 'custom', path: ['bkashTransactionId'], message: 'The bKash transaction ID is required.' })
  }
})

/** Business-rule rejections (stock, coupon, payment replay) surface as 400s. */
class OrderRejected extends Error {}

type OrderDoc = { id: number; orderNumber: string; total: number }

async function placeOrder(
  payload: Payload,
  user: CustomerSessionUser,
  parsed: z.infer<typeof schema>,
  pricedCart: PayloadCartLine[],
  couponCode: string | undefined,
): Promise<{ order: OrderDoc; created: boolean }> {
  const orderItems = pricedCart.map((line) => line.orderItem)
  const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const totalWeightGrams = orderItems.reduce((sum, item) => sum + item.unitWeightGrams * item.quantity, 0)
  const shipping = shippingQuote(totalWeightGrams, parsed.shippingMethod as ShippingMethod)
  const paymentMethod = parsed.paymentMethod as PaymentMethod
  const acceptedAt = new Date().toISOString()
  const orderNumber = `PZ-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`

  const req = await createLocalReq({ user }, payload)
  const startedTransaction = await initTransaction(req)
  try {
    // Idempotent retry: the client regenerates the key only when the cart
    // changes, so a retried submission returns the original order.
    if (parsed.idempotencyKey) {
      const existing = await payload.find({
        collection: 'orders',
        where: { and: [{ customer: { equals: user.id } }, { idempotencyKey: { equals: parsed.idempotencyKey } }] },
        limit: 1,
        overrideAccess: true,
        req,
      })
      if (existing.totalDocs) {
        if (startedTransaction) await killTransaction(req as PayloadRequest & { payload: Payload })
        return { order: existing.docs[0] as unknown as OrderDoc, created: false }
      }
    }

    // Stock is re-read and decremented inside the transaction while the
    // per-product advisory locks serialize competing orders — no oversell.
    for (const line of pricedCart) {
      const fresh = await payload.findByID({ collection: 'products', id: line.product.id, depth: 0, overrideAccess: true, req })
      const stock = Number((fresh as { stock?: number }).stock ?? 0)
      if (stock < line.quantity) throw new OrderRejected(`Insufficient stock for ${line.orderItem.productName}.`)
      await payload.update({ collection: 'products', id: line.product.id, data: { stock: stock - line.quantity }, overrideAccess: true, req })
    }

    // bKash transaction IDs are single-use: replaying one across orders is fraud.
    if (paymentMethod === 'bkash' && parsed.bkashTransactionId) {
      const replay = await payload.find({
        collection: 'orders',
        where: { bkashTransactionId: { equals: parsed.bkashTransactionId } },
        limit: 1,
        overrideAccess: true,
        req,
      })
      if (replay.totalDocs) throw new OrderRejected('This bKash transaction ID has already been used.')
    }

    const coupon = couponCode
      ? await validateCouponWithPayload(payload, couponCode, {
        subtotal,
        items: pricedCart.map((line) => line.couponItem),
      })
      : { valid: true as const, discount: 0, discountedSubtotal: subtotal }
    if (!coupon.valid) throw new OrderRejected(coupon.error || 'This coupon cannot be applied.')
    const totals = calculateDiscountedTotals(subtotal, coupon.discount, shipping.rate, paymentMethod)

    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        customer: user.id,
        idempotencyKey: parsed.idempotencyKey,
        contact: { ...parsed.contact, email: parsed.contact.email || undefined },
        items: orderItems,
        subtotal,
        coupon: typeof coupon.couponId === 'number' ? coupon.couponId : undefined,
        couponCode: coupon.code,
        couponDiscount: coupon.discount,
        totalWeightGrams,
        shippingMethod: parsed.shippingMethod,
        shippingClass: shipping.shippingClass as 'Light Weight' | 'Medium Weight' | 'Heavy Weight' | 'Very Heavy Weight' | 'Local Pickup',
        shippingCost: shipping.rate,
        paymentMethod,
        bkashNumber: paymentMethod === 'bkash' ? parsed.bkashNumber : undefined,
        bkashTransactionId: paymentMethod === 'bkash' ? parsed.bkashTransactionId : undefined,
        bkashFee: totals.fee,
        total: totals.total,
        termsAcceptedAt: acceptedAt,
        privacyAcceptedAt: acceptedAt,
        note: parsed.note,
        paymentStatus: paymentMethod === 'bkash' ? 'submitted' : 'pending',
        status: 'received',
      },
      overrideAccess: true,
      req,
    })
    if (startedTransaction) await commitTransaction(req as PayloadRequest & { payload: Payload })
    return { order: order as unknown as OrderDoc, created: true }
  } catch (error) {
    if (startedTransaction) await killTransaction(req as PayloadRequest & { payload: Payload }).catch(() => undefined)
    throw error
  }
}

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 })

  const payload = await getPayload({ config })
  const user = await getCustomerFromHeaders(payload, request.headers)
  if (!user) return Response.json({ error: 'You must sign in before placing an order.' }, { status: 401 })

  const limit = checkRateLimit(`orders:${user.id}:${getClientIp(request.headers)}`, 30, 60 * 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)

  const parsed = schema.safeParse(await readBoundedJson(request))
  if (!parsed.success) return Response.json({ error: 'Please check your checkout details.', issues: parsed.error.flatten().fieldErrors }, { status: 400 })

  let pricedCart
  try {
    pricedCart = await resolvePayloadCart(payload, parsed.data.items)
  } catch {
    return Response.json({ error: 'Your cart contains an unavailable product.' }, { status: 400 })
  }

  const couponCode = parsed.data.couponCode ? normalizeCouponCode(parsed.data.couponCode) : undefined
  // Lock every contended resource up front (sorted internally): coupon usage,
  // per-product stock, the idempotency key, and the bKash transaction ID.
  const lockKeys = [
    ...pricedCart.map((line) => `product:${line.product.id}`),
    ...(couponCode ? [`coupon:${couponCode}`] : []),
    ...(parsed.data.idempotencyKey ? [`order-key:${user.id}:${parsed.data.idempotencyKey}`] : []),
    ...(parsed.data.bkashTransactionId ? [`bkash-txn:${parsed.data.bkashTransactionId.toUpperCase()}`] : []),
  ]

  try {
    const { order, created } = await withAdvisoryLocks(payload, lockKeys, () =>
      placeOrder(payload, user, parsed.data, pricedCart, couponCode))
    return Response.json({ orderNumber: order.orderNumber, total: order.total }, { status: created ? 201 : 200 })
  } catch (error) {
    if (error instanceof OrderRejected) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ error: 'Could not place your order. Please try again.' }, { status: 500 })
  }
}
