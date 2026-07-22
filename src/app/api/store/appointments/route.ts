import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

const schema = z.object({
  ownerName: z.string().trim().min(2).max(160),
  contact: z.string().trim().min(5).max(160),
  petName: z.string().trim().min(1).max(100),
  petType: z.enum(['Cat', 'Dog', 'Bird', 'Rabbit', 'Other']),
  age: z.string().trim().max(50).optional(),
  reason: z.string().trim().min(5).max(2000),
  preferredAt: z.iso.datetime(),
})

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || user.collection !== 'customers') return Response.json({ error: 'You must sign in before requesting an appointment.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Please check the appointment details.', issues: parsed.error.flatten().fieldErrors }, { status: 400 })

  const appointment = await payload.create({
    collection: 'appointments',
    data: { ...parsed.data, customer: user.id, status: 'requested' },
    overrideAccess: true,
  })
  return Response.json({ id: appointment.id, status: appointment.status }, { status: 201 })
}
