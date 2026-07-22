import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

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
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Please check the highlighted fields.', issues: parsed.error.flatten().fieldErrors }, { status: 400 })

  const payload = await getPayload({ config })
  const phone = normalizePhone(parsed.data.phone)
  const existing = await payload.find({ collection: 'users', where: { phone: { equals: phone } }, limit: 1, overrideAccess: true })
  if (existing.totalDocs) return Response.json({ error: 'An account already exists for this phone number.' }, { status: 409 })

  await payload.create({
    collection: 'users',
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
      role: 'customer',
    },
    overrideAccess: true,
  })

  return Response.json({ ok: true, username: phone }, { status: 201 })
}
