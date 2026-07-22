import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ auth: vi.fn(), getPayload: vi.fn(), headers: vi.fn() }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('next/headers', () => ({ headers: mocks.headers }))
vi.mock('@payload-config', () => ({ default: {} }))

import { getCurrentUser } from './current-user'

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPayload.mockResolvedValue({ auth: mocks.auth })
    mocks.headers.mockResolvedValue(new Headers())
  })

  it('returns storefront customers', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 2, collection: 'customers' } })
    expect((await getCurrentUser()).user).toEqual({ id: 2, collection: 'customers' })
  })

  it('does not expose Payload staff sessions as storefront customer sessions', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 1, collection: 'users', role: 'admin' } })
    expect((await getCurrentUser()).user).toBeNull()
  })
})
