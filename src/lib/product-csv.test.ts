import { describe, expect, it } from 'vitest'
import { PRODUCT_CSV_HEADERS, parseProductCSV, serializeProductCSVErrors, serializeProductsToCSV } from './product-csv'

describe('product CSV export', () => {
  it('uses the fixed schema, deterministic SKU ordering, RFC 4180 quoting, and UTF-8 localized values', () => {
    const csv = serializeProductsToCSV([
      {
        sku: 'SKU-B', slug: 'second', status: 'draft', name: { en: 'Second', bn: 'দ্বিতীয়' },
        description: { en: 'Simple', bn: 'সহজ' }, price: 20, stock: 2, weightGrams: 200,
        brand: 'brand-2', categories: ['cat-2'], petTypes: ['Dog'], images: ['media-2'], variants: [],
      },
      {
        sku: 'SKU-A', slug: 'first', status: 'active', name: { en: 'Food, "Best"', bn: 'সেরা খাবার' },
        description: { en: 'Line one\nLine two', bn: 'লাইন এক\nলাইন দুই' }, price: 10.5,
        compareAtPrice: 12, stock: 1, weightGrams: 100, brand: { id: 'brand-1' },
        categories: [{ id: 'cat-1' }], petTypes: ['Cat', 'Small pets'], images: [{ id: 'media-1' }], variants: [],
        details: { ingredients: { en: 'Fish', bn: 'মাছ' }, prescriptionRequired: false },
        seo: { title: { en: 'Great', bn: 'দারুণ' }, canonical: '/first' },
      },
    ])

    const lines = csv.split('\r\n')
    expect(lines[0]).toBe(PRODUCT_CSV_HEADERS.join(','))
    expect(lines[1]).toContain('SKU-A,first,active,"Food, ""Best""",সেরা খাবার')
    expect(csv.indexOf('SKU-A')).toBeLessThan(csv.indexOf('SKU-B'))
    expect(csv).toContain('"Line one\nLine two"')
    expect(csv).toContain('মাছ')
    expect(csv.endsWith('\r\n')).toBe(true)
  })
})

describe('product CSV import', () => {
  it('parses an exported row into localized Payload data and resolves existing relations', () => {
    const csv = serializeProductsToCSV([{
      sku: 'SKU-1', slug: 'bangla-food', status: 'active', name: { en: 'Food', bn: 'খাবার' },
      description: { en: 'English description', bn: 'বাংলা বিবরণ' }, price: 125.5, compareAtPrice: 150,
      stock: 4, weightGrams: 500, brand: 'brand-id', categories: ['category-id'], petTypes: ['Cat'],
      images: ['media-id'], variants: [{ name: { en: 'Small', bn: 'ছোট' }, sku: 'SKU-1-S', price: 125.5, stock: 4 }],
      details: { ingredients: { en: 'Fish', bn: 'মাছ' }, usage: { en: 'Daily', bn: 'প্রতিদিন' }, storage: { en: 'Dry', bn: 'শুকনা' }, safetyNote: { en: 'Safe', bn: 'নিরাপদ' }, origin: 'BD', prescriptionRequired: true },
      seo: { title: { en: 'SEO', bn: 'এসইও' }, description: { en: 'Desc', bn: 'বিবরণ' }, canonical: '/bangla-food' },
    }])

    const result = parseProductCSV(csv, {
      brands: [{ id: 'brand-id', names: ['Acme'] }],
      categories: [{ id: 'category-id', names: ['Food'] }],
      media: [{ id: 'media-id', names: ['food.jpg'] }],
    })

    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      row: 2,
      sku: 'SKU-1',
      data: {
        slug: 'bangla-food', status: 'active', name: { en: 'Food', bn: 'খাবার' },
        price: 125.5, compareAtPrice: 150, stock: 4, weightGrams: 500,
        brand: 'brand-id', categories: ['category-id'], images: ['media-id'], petTypes: ['Cat'],
        details: { origin: 'BD', prescriptionRequired: true },
        seo: { canonical: '/bangla-food' },
      },
    })
    expect(result.rows[0].data.variants[0]).toMatchObject({ name: { en: 'Small', bn: 'ছোট' }, sku: 'SKU-1-S' })
  })

  it('defaults a blank status to draft', () => {
    const csv = serializeProductsToCSV([{
      sku: 'SKU-DRAFT', slug: 'draft-food', status: '', name: { en: 'Draft Food', bn: 'ড্রাফট খাবার' },
      price: 10, stock: 1, weightGrams: 100, brand: 'brand-id', categories: ['category-id'],
      petTypes: ['Cat'], images: ['media-id'], variants: [],
    }])
    const result = parseProductCSV(csv, {
      brands: [{ id: 'brand-id' }], categories: [{ id: 'category-id' }], media: [{ id: 'media-id' }],
    })

    expect(result.errors).toEqual([])
    expect(result.rows[0].data.status).toBe('draft')
  })

  it('round-trips formula-like text through spreadsheet-safe export escaping', () => {
    const csv = serializeProductsToCSV([{
      sku: 'SKU-SAFE', slug: 'safe-food', status: 'draft', name: { en: '=NotAFormula', bn: 'নিরাপদ' },
      price: 10, stock: 1, weightGrams: 100, brand: 'brand-id', categories: ['category-id'],
      petTypes: ['Cat'], images: ['media-id'], variants: [],
    }])
    expect(csv).toContain("'=NotAFormula")

    const result = parseProductCSV(csv, {
      brands: [{ id: 'brand-id' }], categories: [{ id: 'category-id' }], media: [{ id: 'media-id' }],
    })
    expect(result.errors).toEqual([])
    expect(result.rows[0].data.name.en).toBe('=NotAFormula')
  })

  it('rejects malformed input, duplicate SKUs, unsafe formulas, invalid values, and unknown relations with row errors', () => {
    const base = {
      sku: 'SKU-1', slug: 'food', status: 'active', name: { en: 'Food', bn: 'খাবার' }, price: 10,
      stock: 1, weightGrams: 100, brand: 'brand-id', categories: ['category-id'], petTypes: ['Cat'], images: ['media-id'], variants: [],
    }
    const relations = {
      brands: [{ id: 'brand-id', names: ['Acme'] }], categories: [{ id: 'category-id', names: ['Food'] }], media: [{ id: 'media-id' }],
    }
    const valid = serializeProductsToCSV([base])
    const duplicate = valid + valid.slice(valid.indexOf('\r\n') + 2)
    expect(parseProductCSV(duplicate, relations).errors[0].message).toContain('duplicate SKU')
    expect(parseProductCSV(valid.replace('Food,খাবার', '=CMD(),খাবার'), relations).errors[0].message).toContain('formula')
    expect(parseProductCSV(valid.replace(',active,', ',published,'), relations).errors[0].message).toContain('status')
    expect(parseProductCSV(valid.replace(',10,,1,100,', ',-1,,1,100,'), relations).errors[0].message).toContain('price')
    expect(parseProductCSV(valid.replace('brand-id', 'missing-brand'), relations).errors[0].message).toContain('unknown brand')
    expect(parseProductCSV('sku,bad\r\n1,2', relations).errors[0]).toMatchObject({ row: 1, field: 'csv' })
    expect(parseProductCSV(valid.replace('[]', 'not-json'), relations).errors[0].message).toContain('valid JSON')
  })

  it('produces a spreadsheet-safe downloadable error CSV', () => {
    const csv = serializeProductCSVErrors([{ row: 3, sku: '=2+2', field: 'name_en', message: 'Bad, value' }])
    expect(csv).toBe('row,sku,field,error\r\n3,\'=2+2,name_en,"Bad, value"\r\n')
  })
})
