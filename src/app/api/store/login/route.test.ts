import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getPayload: vi.fn(), login: vi.fn() }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('@payload-config', () => ({ default: {} }))

import { CUSTOMER_SESSION_COOKIE } from '@/lib/customer-session'
import { POST } from './route'

const loginRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/store/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

describe('POST /api/store/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPayload.mockResolvedValue({ login: mocks.login })
    mocks.login.mockResolvedValue({ token: 'customer-jwt', exp: 1_900_000_000, user: { id: 7 } })
  })

  it('sets the dedicated customer session cookie on successful login', async () => {
    const response = await POST(loginRequest({ username: '01712345678', password: 'password123' }))
    expect(response.status).toBe(200)
    const cookie = response.headers.get('set-cookie') || ''
    expect(cookie).toContain(`${CUSTOMER_SESSION_COOKIE}=customer-jwt`)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(mocks.login).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'customers',
      data: { username: '01712345678', password: 'password123' },
    }))
  })

  it('supports email login', async () => {
    await POST(loginRequest({ email: 'greg@example.com', password: 'password123' }))
    expect(mocks.login).toHaveBeenCalledWith(expect.objectContaining({
      data: { email: 'greg@example.com', password: 'password123' },
    }))
  })

  it('returns 401 without revealing which credential failed', async () => {
    mocks.login.mockRejectedValueOnce(new Error('Authentication failed'))
    const response = await POST(loginRequest({ username: '01712345678', password: 'wrong' }))
    expect(response.status).toBe(401)
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('rejects malformed bodies with 400', async () => {
    const response = await POST(loginRequest({ password: 'password123' }))
    expect(response.status).toBe(400)
    expect(mocks.login).not.toHaveBeenCalled()
  })

  it('rejects cross-site posts before attempting login', async () => {
    const response = await POST(loginRequest(
      { username: '01712345678', password: 'password123' },
      { 'sec-fetch-site': 'cross-site' },
    ))
    expect(response.status).toBe(403)
    expect(mocks.login).not.toHaveBeenCalled()
  })

  it('rejects mismatched origins before attempting login', async () => {
    const response = await POST(loginRequest(
      { username: '01712345678', password: 'password123' },
      { origin: 'https://evil.example', host: 'localhost' },
    ))
    expect(response.status).toBe(403)
    expect(mocks.login).not.toHaveBeenCalled()
  })
})
