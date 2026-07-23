// @vitest-environment node
import { SignJWT } from 'jose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getPayload: vi.fn() }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('@payload-config', () => ({ default: {} }))

import { CUSTOMER_SESSION_COOKIE } from '@/lib/customer-session'
import { POST } from './route'

const secret = 'test-secret'
// logout reads the secret off the payload instance, so stub it there.
process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || secret

const sign = (claims: Record<string, unknown>) =>
  new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret))

describe('POST /api/store/logout', () => {
  beforeEach(() => vi.clearAllMocks())

  it('expires the customer session cookie without touching the staff cookie', async () => {
    const response = await POST()
    expect(response.status).toBe(200)
    const cookie = response.headers.get('set-cookie') || ''
    expect(cookie).toContain(`${CUSTOMER_SESSION_COOKIE}=`)
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970')
    expect(cookie).not.toContain('payload-token')
    expect(mocks.getPayload).not.toHaveBeenCalled()
  })

  it('revokes the server-side session behind the customer cookie', async () => {
    const update = vi.fn(async () => ({}))
    const findByID = vi.fn(async () => ({ id: 7, sessions: [{ id: 'session-1' }, { id: 'session-2' }] }))
    mocks.getPayload.mockResolvedValue({ secret, findByID, update })
    const token = await sign({ id: 7, collection: 'customers', sid: 'session-1' })
    const request = new Request('http://localhost/api/store/logout', {
      method: 'POST',
      headers: { cookie: `${CUSTOMER_SESSION_COOKIE}=${token}` },
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'customers',
      id: 7,
      data: { sessions: [{ id: 'session-2' }] },
    }))
  })
})
