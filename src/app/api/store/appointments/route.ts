import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { getCustomerFromHeaders } from '@/lib/customer-session'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { isSameSiteRequest, readBoundedJson } from '@/lib/request-security'

const schema = z.object({
  ownerName: z.string().trim().min(2).max(160),
  contact: z.string().trim().min(5).max(160),
  petName: z.string().trim().min(1).max(100),
  petType: z.enum(['Cat', 'Dog', 'Bird', 'Rabbit', 'Other']),
  age: z.string().trim().max(50).optional(),
  petWeight: z.string().trim().max(50).optional(),
  reason: z.string().trim().min(5).max(2000),
})

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 })

  const payload = await getPayload({ config })
  const user = await getCustomerFromHeaders(payload, request.headers)
  if (!user) return Response.json({ error: 'You must sign in before requesting an appointment.' }, { status: 401 })

  // Appointment-spam guard: 10 requests per hour per account.
  const limit = checkRateLimit(`appointments:${user.id}`, 10, 60 * 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)

  const parsed = schema.safeParse(await readBoundedJson(request))
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>
    const firstField = Object.keys(fieldErrors)[0]
    const firstError = firstField ? (fieldErrors[firstField]?.[0] ?? 'Invalid value') : 'Invalid value'
    return Response.json({ error: firstError, issues: fieldErrors }, { status: 400 })
  }

  const appointment = await payload.create({
    collection: 'appointments',
    data: { ...parsed.data, customer: user.id, status: 'requested' },
    overrideAccess: true,
  })
  return Response.json({ id: appointment.id, status: appointment.status }, { status: 201 })
}
