// @vitest-environment node
import { SignJWT } from 'jose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ findByID: vi.fn(), getPayload: vi.fn(), headers: vi.fn() }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('next/headers', () => ({ headers: mocks.headers }))
vi.mock('@payload-config', () => ({ default: {} }))

import { CUSTOMER_SESSION_COOKIE } from './customer-session'
import { getCurrentUser } from './current-user'

const secret = 'test-secret'
const secretKey = new TextEncoder().encode(secret)
const sign = (claims: Record<string, unknown>) =>
  new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(secretKey)

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPayload.mockResolvedValue({ secret, findByID: mocks.findByID })
    mocks.findByID.mockResolvedValue({ id: 2, firstName: 'Greg', sessions: [{ id: 'session-1' }] })
  })

  it('returns the storefront customer from the customer session cookie', async () => {
    const token = await sign({ id: 2, collection: 'customers', sid: 'session-1' })
    mocks.headers.mockResolvedValue(new Headers({ cookie: `${CUSTOMER_SESSION_COOKIE}=${token}` }))
    const { user } = await getCurrentUser()
    expect(user).toMatchObject({ id: 2, collection: 'customers' })
  })

  it('does not expose Payload staff sessions as storefront customer sessions', async () => {
    const token = await sign({ id: 1, collection: 'users', sid: 'session-1' })
    mocks.headers.mockResolvedValue(new Headers({ cookie: `${CUSTOMER_SESSION_COOKIE}=${token}` }))
    expect((await getCurrentUser()).user).toBeNull()
  })

  it('ignores the shared Payload staff cookie entirely', async () => {
    mocks.headers.mockResolvedValue(new Headers({ cookie: 'payload-token=staff-token-value' }))
    expect((await getCurrentUser()).user).toBeNull()
    expect(mocks.findByID).not.toHaveBeenCalled()
  })
})
