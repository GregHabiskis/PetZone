import config from '@payload-config'
import { getPayload } from 'payload'
import { buildExpiredCustomerSessionCookie, getCustomerFromHeaders } from '@/lib/customer-session'

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const user = await getCustomerFromHeaders(payload, request.headers)
  if (!user) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const orders = await payload.find({
    collection: 'orders',
    where: { customer: { equals: user.id } },
    limit: 500,
    overrideAccess: true,
  })
  for (const order of orders.docs) {
    await payload.delete({ collection: 'orders', id: order.id, overrideAccess: true })
  }

  const appointments = await payload.find({
    collection: 'appointments',
    where: { customer: { equals: user.id } },
    limit: 500,
    overrideAccess: true,
  })
  for (const appointment of appointments.docs) {
    await payload.delete({ collection: 'appointments', id: appointment.id, overrideAccess: true })
  }

  await payload.delete({ collection: 'customers', id: user.id, overrideAccess: true })

  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': buildExpiredCustomerSessionCookie() } },
  )
}
