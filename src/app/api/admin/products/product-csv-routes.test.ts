// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { serializeProductsToCSV } from '@/lib/product-csv'

const mocks = vi.hoisted(() => ({
  getPayload: vi.fn(),
  createLocalReq: vi.fn(async ({ user }, payload) => ({ payload, user })),
  initTransaction: vi.fn(async (req) => {
    req.transactionID = 'transaction-1'
    return true
  }),
  commitTransaction: vi.fn(async () => undefined),
  killTransaction: vi.fn(async () => undefined),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
  getPayload: mocks.getPayload,
  createLocalReq: mocks.createLocalReq,
  initTransaction: mocks.initTransaction,
  commitTransaction: mocks.commitTransaction,
  killTransaction: mocks.killTransaction,
}))

import { GET } from './export/route'
import { POST } from './import/route'

function productCSV(status = 'draft') {
  return serializeProductsToCSV([{
    sku: 'SKU-NEW', slug: 'new-food', status, name: { en: 'New Food', bn: 'নতুন খাবার' },
    description: { en: 'English', bn: 'বাংলা' }, price: 100, stock: 2, weightGrams: 500,
    brand: 'brand-1', categories: ['category-1'], petTypes: ['Cat'], images: ['media-1'], variants: [],
  }])
}

function importRequest(csv = productCSV(), options: { name?: string; type?: string; mode?: 'dry-run' | 'commit'; origin?: string } = {}) {
  const form = new FormData()
  form.set('file', new Blob([csv], { type: options.type ?? 'text/csv' }), options.name ?? 'products.csv')
  form.set('mode', options.mode ?? 'dry-run')
  return new Request('http://localhost/api/admin/products/import', {
    method: 'POST',
    headers: { origin: options.origin ?? 'http://localhost' },
    body: form,
  })
}

function payloadFor(user: { role: string } | null = { role: 'admin' }) {
  const create = vi.fn(async ({ data, locale }) => ({ id: 10, ...data, locale }))
  const update = vi.fn(async ({ id, data, locale }) => ({ id, ...data, locale }))
  const payload = {
    auth: vi.fn(async () => ({ user: user ? { id: 1, collection: 'users', ...user } : null })),
    find: vi.fn(async ({ collection }): Promise<unknown> => {
      if (collection === 'brands') return { docs: [{ id: 'brand-1', name: { en: 'Brand', bn: 'ব্র্যান্ড' } }] }
      if (collection === 'categories') return { docs: [{ id: 'category-1', name: { en: 'Food', bn: 'খাবার' } }] }
      if (collection === 'media') return { docs: [{ id: 'media-1', filename: 'food.jpg' }] }
      if (collection === 'products') return { docs: [] }
      throw new Error(`Unexpected collection ${collection}`)
    }),
    create,
    update,
  }
  return payload
}

describe('admin product CSV routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401/403 unless the authenticated Payload user is staff', async () => {
    mocks.getPayload.mockResolvedValueOnce(payloadFor(null))
    expect((await GET(new Request('http://localhost/api/admin/products/export'))).status).toBe(401)

    mocks.getPayload.mockResolvedValueOnce(payloadFor({ role: 'customer' }))
    expect((await POST(importRequest())).status).toBe(403)
  })

  it('exports a deterministic UTF-8 attachment for staff', async () => {
    const payload = payloadFor()
    payload.find.mockImplementation(async ({ collection }: { collection: string }) => collection === 'products'
      ? { docs: [{ sku: 'SKU-1', slug: 'food', status: 'draft', name: { en: 'Food', bn: 'খাবার' }, price: 10, stock: 1, weightGrams: 100, brand: 'brand-1', categories: ['category-1'], petTypes: ['Cat'], images: ['media-1'], variants: [] }] }
      : { docs: [] })
    mocks.getPayload.mockResolvedValue(payload)

    const response = await GET(new Request('http://localhost/api/admin/products/export'))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/csv')
    expect(response.headers.get('content-disposition')).toContain('petzone-products.csv')
    expect(await response.text()).toContain('খাবার')
  })

  it('performs a zero-write dry run and reports create/update counts', async () => {
    const payload = payloadFor()
    mocks.getPayload.mockResolvedValue(payload)

    const response = await POST(importRequest())
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ dryRun: true, createCount: 1, updateCount: 0, rejectCount: 0 })
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('rejects cross-origin, non-CSV, and invalid files before writing', async () => {
    const payload = payloadFor()
    mocks.getPayload.mockResolvedValue(payload)

    expect((await POST(importRequest(productCSV(), { origin: 'https://evil.example' }))).status).toBe(403)
    expect((await POST(importRequest(productCSV(), { name: 'products.txt', type: 'text/plain' }))).status).toBe(400)
    expect((await POST(importRequest(productCSV('published')))).status).toBe(422)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('commits SKU upserts in one transaction and rolls back failures', async () => {
    const payload = payloadFor()
    mocks.getPayload.mockResolvedValue(payload)

    const response = await POST(importRequest(productCSV('active'), { mode: 'commit' }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ dryRun: false, createCount: 1, updateCount: 0, rejectCount: 0 })
    expect(mocks.initTransaction).toHaveBeenCalledOnce()
    expect(mocks.commitTransaction).toHaveBeenCalledOnce()
    expect(mocks.killTransaction).not.toHaveBeenCalled()
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'products', locale: 'en', req: expect.any(Object) }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'products', id: 10, locale: 'bn', req: expect.any(Object) }))
  })

  it('rolls back the whole import when a write fails', async () => {
    const payload = payloadFor()
    payload.create.mockRejectedValueOnce(new Error('database rejected row'))
    mocks.getPayload.mockResolvedValue(payload)

    const response = await POST(importRequest(productCSV('active'), { mode: 'commit' }))
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ rejectCount: 1, errors: [{ row: 2, sku: 'SKU-NEW' }] })
    expect(mocks.killTransaction).toHaveBeenCalledOnce()
    expect(mocks.commitTransaction).not.toHaveBeenCalled()
  })
})
