import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { getClientIp, isSameSiteRequest, readBoundedJson } from '@/lib/request-security'

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  streetAddress: z.string().trim().min(4).max(500),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(12),
  phone: z.string().trim().regex(/^(?:\+?88)?01[3-9]\d{8}$/, 'Enter a valid Bangladesh mobile number'),
  email: z.union([z.literal(''), z.email()]).optional(),
  password: z.string().min(8).max(128),
})

const normalizePhone = (phone: string) => phone.replace(/^\+?88/, '')

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 })

  // Account-spam guard: 5 registrations per hour per IP.
  const limit = checkRateLimit(`register:${getClientIp(request.headers)}`, 5, 60 * 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)

  const parsed = schema.safeParse(await readBoundedJson(request))
  if (!parsed.success) return Response.json({ error: 'Please check the highlighted fields.', issues: parsed.error.flatten().fieldErrors }, { status: 400 })

  const payload = await getPayload({ config })
  const phone = normalizePhone(parsed.data.phone)
  const existing = await payload.find({ collection: 'customers', where: { phone: { equals: phone } }, limit: 1, overrideAccess: true })
  if (existing.totalDocs) return Response.json({ error: 'An account already exists for this phone number.' }, { status: 409 })

  try {
    await payload.create({
      collection: 'customers',
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        streetAddress: parsed.data.streetAddress,
        city: parsed.data.city,
        postalCode: parsed.data.postalCode,
        phone,
        username: phone,
        email: parsed.data.email || undefined,
        password: parsed.data.password,
      },
      overrideAccess: true,
    })
  } catch (error) {
    // The check-then-create above races with parallel registrations of the same
    // phone; the unique index loses one of them. Translate that into a clean
    // 409 instead of an unhandled 500.
    const message = error instanceof Error ? error.message.toLowerCase() : ''
    if (message.includes('unique') || message.includes('duplicate')) {
      return Response.json({ error: 'An account already exists for this phone number.' }, { status: 409 })
    }
    return Response.json({ error: 'Could not create your account. Please try again.' }, { status: 500 })
  }

  return Response.json({ ok: true, username: phone }, { status: 201 })
}
