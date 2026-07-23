import config from '@payload-config'
import { commitTransaction, createLocalReq, getPayload, initTransaction, killTransaction, type Payload, type PayloadRequest } from 'payload'
import { z } from 'zod'
import { buildExpiredCustomerSessionCookie, getCustomerFromHeaders } from '@/lib/customer-session'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { isSameSiteRequest, readBoundedJson } from '@/lib/request-security'

const schema = z.object({ password: z.string().min(1).max(128) })

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 })

  const payload = await getPayload({ config })
  const user = await getCustomerFromHeaders(payload, request.headers)
  if (!user) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const limit = checkRateLimit(`account-delete:${user.id}`, 5, 60 * 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)

  // Irreversible action: require the account password, not just the cookie.
  const parsed = schema.safeParse(await readBoundedJson(request))
  if (!parsed.success) return Response.json({ error: 'Enter your password to confirm account deletion.' }, { status: 400 })
  try {
    await payload.login({ collection: 'customers', data: { username: user.username, password: parsed.data.password }, depth: 0 })
  } catch {
    return Response.json({ error: 'The password is incorrect.' }, { status: 403 })
  }

  // Everything deletes in one transaction — no half-deleted accounts, and no
  // orphaned orders leaking contact PII beyond an arbitrary page limit.
  const req = await createLocalReq({ user }, payload)
  const startedTransaction = await initTransaction(req)
  try {
    await payload.delete({ collection: 'reviews', where: { customer: { equals: user.id } }, overrideAccess: true, req })
    await payload.delete({ collection: 'appointments', where: { customer: { equals: user.id } }, overrideAccess: true, req })
    await payload.delete({ collection: 'orders', where: { customer: { equals: user.id } }, overrideAccess: true, req })
    await payload.delete({ collection: 'customers', id: user.id, overrideAccess: true, req })
    if (startedTransaction) await commitTransaction(req as PayloadRequest & { payload: Payload })
  } catch {
    if (startedTransaction) await killTransaction(req as PayloadRequest & { payload: Payload }).catch(() => undefined)
    return Response.json({ error: 'Could not delete your account. Please try again.' }, { status: 500 })
  }

  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': buildExpiredCustomerSessionCookie() } },
  )
}
