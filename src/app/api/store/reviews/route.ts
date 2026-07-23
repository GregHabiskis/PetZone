import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { getCustomerFromHeaders } from '@/lib/customer-session'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { isSameSiteRequest, readBoundedJson } from '@/lib/request-security'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productSlug = searchParams.get('productSlug')
  if (!productSlug || productSlug.length > 160) return Response.json({ error: 'productSlug is required' }, { status: 400 })

  const payload = await getPayload({ config })
  const reviews = await payload.find({
    collection: 'reviews',
    where: { productSlug: { equals: productSlug } },
    sort: '-createdAt',
    limit: 100,
    overrideAccess: true,
    depth: 1,
  })

  const data = reviews.docs.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    customerName: r.customer && typeof r.customer === 'object' ? `${String((r.customer as { firstName?: string }).firstName || '')} ${String((r.customer as { lastName?: string }).lastName || '')}`.trim() || 'Customer' : 'Customer',
    createdAt: r.createdAt,
  }))

  return Response.json({ reviews: data, total: reviews.totalDocs })
}

const createSchema = z.object({
  productSlug: z.string().trim().min(1).max(160),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
})

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 })

  const payload = await getPayload({ config })
  const user = await getCustomerFromHeaders(payload, request.headers)
  if (!user) return Response.json({ error: 'Sign in to leave a review.' }, { status: 401 })

  // Review-spam guard: 30 submissions per hour per account.
  const limit = checkRateLimit(`reviews:${user.id}`, 30, 60 * 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)

  const parsed = createSchema.safeParse(await readBoundedJson(request))
  if (!parsed.success) return Response.json({ error: 'Invalid review data.' }, { status: 400 })

  const existing = await payload.find({
    collection: 'reviews',
    where: { customer: { equals: user.id }, productSlug: { equals: parsed.data.productSlug } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.totalDocs > 0) return Response.json({ error: 'You have already reviewed this product.' }, { status: 409 })

  try {
    // customer is pinned to the session user server-side; the collection's REST
    // create access is disabled so this route is the only write path.
    const review = await payload.create({
      collection: 'reviews',
      data: {
        customer: user.id,
        productSlug: parsed.data.productSlug,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
      overrideAccess: true,
    })
    return Response.json({ ok: true, id: review.id }, { status: 201 })
  } catch (error) {
    // The unique (customer, productSlug) index backstops the check above
    // against parallel submissions.
    const message = error instanceof Error ? error.message.toLowerCase() : ''
    if (message.includes('unique') || message.includes('duplicate')) {
      return Response.json({ error: 'You have already reviewed this product.' }, { status: 409 })
    }
    return Response.json({ error: 'Failed to submit review.' }, { status: 500 })
  }
}
