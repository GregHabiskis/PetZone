import { describe, expect, it } from 'vitest'
import { mergeProductVariantIDs } from './admin-product-csv'

describe('mergeProductVariantIDs', () => {
  it('preserves Payload array row IDs by SKU across localized writes', () => {
    const imported = [
      { sku: 'CAT-S', name: { en: 'Small', bn: 'ছোট' }, price: 500, stock: 3 },
      { sku: 'CAT-L', name: { en: 'Large', bn: 'বড়' }, price: 800, stock: 2 },
    ]
    const persisted = [
      { id: 'row-large', sku: 'CAT-L' },
      { id: 'row-small', sku: 'CAT-S' },
    ]

    expect(mergeProductVariantIDs(imported, persisted)).toEqual([
      { id: 'row-small', sku: 'CAT-S', name: { en: 'Small', bn: 'ছোট' }, price: 500, stock: 3 },
      { id: 'row-large', sku: 'CAT-L', name: { en: 'Large', bn: 'বড়' }, price: 800, stock: 2 },
    ])
  })
})
