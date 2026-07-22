// @vitest-environment node
import { SignJWT } from 'jose'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CUSTOMER_SESSION_COOKIE,
  buildCustomerSessionCookie,
  buildExpiredCustomerSessionCookie,
  getCustomerFromHeaders,
} from './customer-session'

const secret = 'test-secret'
const secretKey = new TextEncoder().encode(secret)

const sign = (claims: Record<string, unknown>, expirationTime: string | number = '1h') =>
  new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(expirationTime).sign(secretKey)

const customerDoc = { id: 7, firstName: 'Greg', sessions: [{ id: 'session-1' }] }

const mockPayload = () => ({ secret, findByID: vi.fn(async () => customerDoc) })

const headersWithToken = (token: string) => new Headers({ cookie: `${CUSTOMER_SESSION_COOKIE}=${token}` })

describe('getCustomerFromHeaders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when the customer session cookie is absent', async () => {
    const payload = mockPayload()
    expect(await getCustomerFromHeaders(payload as never, new Headers())).toBeNull()
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('returns null for a malformed token', async () => {
    const payload = mockPayload()
    expect(await getCustomerFromHeaders(payload as never, headersWithToken('not-a-jwt'))).toBeNull()
  })

  it('returns null for an expired token', async () => {
    const payload = mockPayload()
    const token = await sign({ id: 7, collection: 'customers', sid: 'session-1' }, Math.floor(Date.now() / 1000) - 3600)
    expect(await getCustomerFromHeaders(payload as never, headersWithToken(token))).toBeNull()
  })

  it('rejects staff tokens even when presented in the customer cookie', async () => {
    const payload = mockPayload()
    const token = await sign({ id: 1, collection: 'users', sid: 'session-1' })
    expect(await getCustomerFromHeaders(payload as never, headersWithToken(token))).toBeNull()
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('rejects tokens whose session is no longer on the customer document', async () => {
    const payload = mockPayload()
    const token = await sign({ id: 7, collection: 'customers', sid: 'revoked-session' })
    expect(await getCustomerFromHeaders(payload as never, headersWithToken(token))).toBeNull()
  })

  it('returns null when the customer no longer exists', async () => {
    const payload = mockPayload()
    payload.findByID.mockRejectedValueOnce(new Error('Not Found'))
    const token = await sign({ id: 7, collection: 'customers', sid: 'session-1' })
    expect(await getCustomerFromHeaders(payload as never, headersWithToken(token))).toBeNull()
  })

  it('returns the authenticated customer for a valid token', async () => {
    const payload = mockPayload()
    const token = await sign({ id: 7, collection: 'customers', sid: 'session-1' })
    const user = await getCustomerFromHeaders(payload as never, headersWithToken(token))
    expect(user).toMatchObject({ id: 7, firstName: 'Greg', collection: 'customers' })
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'customers', id: 7 }))
  })
})

describe('customer session cookies', () => {
  it('builds an httpOnly SameSite=Lax session cookie under its own name', () => {
    const cookie = buildCustomerSessionCookie('token-value', 1_900_000_000)
    expect(cookie).toContain(`${CUSTOMER_SESSION_COOKIE}=token-value`)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/')
    expect(cookie).not.toContain('payload-token')
  })

  it('builds an expiring cookie for logout', () => {
    const cookie = buildExpiredCustomerSessionCookie()
    expect(cookie).toContain(`${CUSTOMER_SESSION_COOKIE}=`)
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970')
  })
})
