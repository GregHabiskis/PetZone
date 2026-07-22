import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { getCustomerFromHeaders } from '@/lib/customer-session'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productSlug = searchParams.get('productSlug')
  if (!productSlug) return Response.json({ error: 'productSlug is required' }, { status: 400 })

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
  productSlug: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
})

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const user = await getCustomerFromHeaders(payload, request.headers)
  if (!user) return Response.json({ error: 'Sign in to leave a review.' }, { status: 401 })

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid review data.' }, { status: 400 })

  const existing = await payload.find({
    collection: 'reviews',
    where: { customer: { equals: user.id }, productSlug: { equals: parsed.data.productSlug } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.totalDocs > 0) return Response.json({ error: 'You have already reviewed this product.' }, { status: 409 })

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
}
