import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getPayload: vi.fn() }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('@payload-config', () => ({ default: {} }))

import { POST } from './route'

const validCustomer = {
  firstName: 'Greg',
  lastName: 'Habiskis',
  streetAddress: '123 Test Road',
  city: 'Dhaka',
  postalCode: '1207',
  phone: '01712345678',
  email: 'greg@example.com',
  password: 'strong-password',
}

describe('customer registration route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates storefront identities in the hidden customers collection', async () => {
    const find = vi.fn(async () => ({ totalDocs: 0 }))
    const create = vi.fn(async ({ data }) => ({ id: 1, ...data }))
    mocks.getPayload.mockResolvedValue({ find, create })

    const response = await POST(new Request('http://localhost/api/store/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validCustomer),
    }))

    expect(response.status).toBe(201)
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'customers' }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'customers',
      data: expect.not.objectContaining({ role: expect.anything() }),
    }))
  })
})
