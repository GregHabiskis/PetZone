import { buildExpiredCustomerSessionCookie } from '@/lib/customer-session'

export async function POST() {
  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': buildExpiredCustomerSessionCookie() } },
  )
}
