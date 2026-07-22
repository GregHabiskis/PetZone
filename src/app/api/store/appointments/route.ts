import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { getCustomerFromHeaders } from '@/lib/customer-session'

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
  const payload = await getPayload({ config })
  const user = await getCustomerFromHeaders(payload, request.headers)
  if (!user) return Response.json({ error: 'You must sign in before requesting an appointment.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
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
