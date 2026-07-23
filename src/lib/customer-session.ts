import { jwtVerify } from 'jose'
import type { Payload } from 'payload'
import { generateCookie, getCookieExpiration, parseCookies } from 'payload/shared'
import type { Customer } from '@/payload-types'

/**
 * Storefront customers authenticate with their own cookie so a customer login
 * never overwrites the staff `payload-token` cookie (and vice versa). Payload
 * hardcodes one cookie name for every auth collection, which previously let
 * the two sessions clobber each other in the same browser.
 */
export const CUSTOMER_SESSION_COOKIE = 'pz-customer-token'
export const CUSTOMER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export type CustomerSessionUser = Customer & { collection: 'customers' }

/**
 * Resolves the storefront customer from the dedicated customer cookie only.
 * Mirrors Payload's own JWT strategy (HS256 verify + session id check) but is
 * scoped to the customers collection, so staff sessions are never returned.
 */
export async function getCustomerFromHeaders(payload: Payload, headers: Headers): Promise<CustomerSessionUser | null> {
  const token = parseCookies(headers).get(CUSTOMER_SESSION_COOKIE)
  if (!token) return null
  try {
    const secretKey = new TextEncoder().encode(payload.secret)
    const { payload: decoded } = await jwtVerify(token, secretKey)
    if (decoded.collection !== 'customers') return null
    const id = decoded.id
    if (typeof id !== 'number' && typeof id !== 'string') return null
    const user = await payload.findByID({ collection: 'customers', id, depth: 0 })
    if (!user) return null
    // Session-enabled collections require the token's session to still exist.
    const sessions = (user as { sessions?: { id: string }[] }).sessions || []
    if (!decoded.sid || !sessions.some((session) => session.id === decoded.sid)) return null
    return { ...user, collection: 'customers' }
  } catch {
    return null
  }
}

/**
 * Revokes the server-side session behind the current customer cookie. Without
 * this, "logout" only clears the browser cookie while the JWT stays valid
 * until expiry (sessions are enabled by default in Payload v3).
 */
export async function revokeCustomerSession(payload: Payload, headers: Headers): Promise<void> {
  const token = parseCookies(headers).get(CUSTOMER_SESSION_COOKIE)
  if (!token) return
  try {
    const secretKey = new TextEncoder().encode(payload.secret)
    const { payload: decoded } = await jwtVerify(token, secretKey)
    if (decoded.collection !== 'customers' || !decoded.sid) return
    const id = decoded.id
    if (typeof id !== 'number' && typeof id !== 'string') return
    const user = await payload.findByID({ collection: 'customers', id, depth: 0 })
    const sessions = ((user as { sessions?: { id: string }[] }).sessions || [])
      .filter((session) => session.id !== decoded.sid)
    await payload.update({ collection: 'customers', id: user.id, data: { sessions }, overrideAccess: true })
  } catch {
    // Token already invalid or customer gone — the cookie is expired regardless.
  }
}

export function buildCustomerSessionCookie(token: string, exp?: number): string {
  return generateCookie<false>({
    name: CUSTOMER_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    expires: exp ? new Date(exp * 1000) : getCookieExpiration({ seconds: CUSTOMER_SESSION_TTL_SECONDS }),
    returnCookieAsObject: false,
  })
}

export function buildExpiredCustomerSessionCookie(): string {
  return generateCookie<false>({
    name: CUSTOMER_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    returnCookieAsObject: false,
  })
}
