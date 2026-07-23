import config from '@payload-config'
import { getPayload } from 'payload'
import { buildExpiredCustomerSessionCookie, CUSTOMER_SESSION_COOKIE, revokeCustomerSession } from '@/lib/customer-session'

export async function POST(request?: Request) {
  // Expire the browser cookie AND kill the server-side session — otherwise the
  // JWT remains valid until its 7-day expiry after "logout". Payload init is
  // skipped entirely when no session cookie is present.
  if (request?.headers.get('cookie')?.includes(CUSTOMER_SESSION_COOKIE)) {
    const payload = await getPayload({ config })
    await revokeCustomerSession(payload, request.headers)
  }
  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': buildExpiredCustomerSessionCookie() } },
  )
}
