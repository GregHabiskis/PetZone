import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'
import { buildCustomerSessionCookie } from '@/lib/customer-session'

const schema = z.object({
  username: z.string().trim().min(1).max(160).optional(),
  email: z.union([z.literal(''), z.email()]).optional(),
  password: z.string().min(1).max(128),
}).refine((data) => data.username || data.email, { message: 'Enter your phone number or email.' })

// Mirrors Payload's own cookie CSRF rules: allow same-origin/same-site/direct
// posts, reject cross-site posts and mismatched origins before any DB work.
const isSameSiteRequest = (request: Request): boolean => {
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      return new URL(origin).host === request.headers.get('host')
    } catch {
      return false
    }
  }
  const secFetchSite = request.headers.get('sec-fetch-site')
  return secFetchSite === null || ['same-origin', 'same-site', 'none'].includes(secFetchSite)
}

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
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
