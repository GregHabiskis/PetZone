import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { buildCustomerSessionCookie } from '@/lib/customer-session'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { getClientIp, isSameSiteRequest, readBoundedJson } from '@/lib/request-security'

const schema = z.object({
  username: z.string().trim().min(1).max(160).optional(),
  email: z.union([z.literal(''), z.email()]).optional(),
  password: z.string().min(1).max(128),
}).refine((data) => data.username || data.email, { message: 'Enter your phone number or email.' })

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 })

  // Brute-force/credential-stuffing guard: 10 attempts per 5 minutes per IP.
  const limit = checkRateLimit(`login:${getClientIp(request.headers)}`, 10, 5 * 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)

  const parsed = schema.safeParse(await readBoundedJson(request))
  if (!parsed.success) return Response.json({ error: 'Enter your phone/email and password.' }, { status: 400 })

  const payload = await getPayload({ config })
  const { username, email, password } = parsed.data
  const credentials = username ? { username, password } : { email: email || '', password }

  let result
  try {
    result = await payload.login({ collection: 'customers', data: credentials, depth: 0 })
  } catch {
    result = null
  }
  if (!result?.token) return Response.json({ error: 'The phone/email or password is incorrect.' }, { status: 401 })

  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': buildCustomerSessionCookie(result.token, result.exp) } },
  )
}
