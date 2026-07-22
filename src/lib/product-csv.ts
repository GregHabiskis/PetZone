import { parse } from 'csv-parse/sync'

export const PRODUCT_CSV_HEADERS = [
  'sku', 'slug', 'status', 'name_en', 'name_bn', 'description_en', 'description_bn',
  'price', 'compare_at_price', 'stock', 'weight_grams', 'brand', 'categories', 'pet_types',
  'image_ids', 'variants_json', 'ingredients_en', 'ingredients_bn', 'usage_en', 'usage_bn',
  'storage_en', 'storage_bn', 'safety_en', 'safety_bn', 'origin', 'prescription_required',
  'seo_title_en', 'seo_title_bn', 'seo_description_en', 'seo_description_bn', 'canonical',
] as const

export const PRODUCT_CSV_MAX_BYTES = 2 * 1024 * 1024
export const PRODUCT_CSV_MAX_ROWS = 2_000
export const PRODUCT_CSV_RELATION_DELIMITER = '|'

type RelationValue = string | number | { id?: string | number } | null | undefined
type LocalizedValue = { en?: unknown; bn?: unknown } | string | null | undefined

// Payload returns locale-dependent nested values that are normalized at this boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductForCSV = Record<string, any>

function relationID(value: RelationValue): string {
  if (value == null) return ''
  if (typeof value === 'object') return value.id == null ? '' : String(value.id)
  return String(value)
}

function localized(value: LocalizedValue, locale: 'en' | 'bn'): unknown {
  return value && typeof value === 'object' && !Array.isArray(value) ? value[locale] : value
}

function content(value: unknown): string {
  if (value == null) return ''
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function spreadsheetSafe(value: string): string {
  return /^[\t\r\n ]*[=+\-@]/.test(value) ? `'${value}` : value
}

function quote(value: unknown): string {
  const text = spreadsheetSafe(content(value))
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function rowFor(product: ProductForCSV): unknown[] {
  const details = product.details || {}
  const seo = product.seo || {}
  const variants = Array.isArray(product.variants) ? product.variants.map((variant: ProductForCSV) => ({
    name_en: localized(variant.name, 'en') ?? '',
    name_bn: localized(variant.name, 'bn') ?? '',
    sku: variant.sku ?? '',
    price: variant.price ?? null,
    stock: variant.stock ?? null,
  })) : []
  return [
    product.sku, product.slug, product.status, localized(product.name, 'en'), localized(product.name, 'bn'),
    localized(product.description, 'en'), localized(product.description, 'bn'), product.price,
    product.compareAtPrice, product.stock, product.weightGrams, relationID(product.brand),
    (product.categories || []).map(relationID).join(PRODUCT_CSV_RELATION_DELIMITER),
    (product.petTypes || []).join(PRODUCT_CSV_RELATION_DELIMITER),
    (product.images || []).map(relationID).join(PRODUCT_CSV_RELATION_DELIMITER), JSON.stringify(variants),
    localized(details.ingredients, 'en'), localized(details.ingredients, 'bn'), localized(details.usage, 'en'),
    localized(details.usage, 'bn'), localized(details.storage, 'en'), localized(details.storage, 'bn'),
    localized(details.safetyNote, 'en'), localized(details.safetyNote, 'bn'), details.origin,
    details.prescriptionRequired ? 'true' : 'false', localized(seo.title, 'en'), localized(seo.title, 'bn'),
    localized(seo.description, 'en'), localized(seo.description, 'bn'), seo.canonical,
  ]
}

export function serializeProductsToCSV(products: ProductForCSV[]): string {
  const rows = [...products].sort((a, b) => String(a.sku || '').localeCompare(String(b.sku || '')))
  return [PRODUCT_CSV_HEADERS.join(','), ...rows.map((product) => rowFor(product).map(quote).join(','))].join('\r\n') + '\r\n'
}

export type ProductCSVRelation = { id: string | number; names?: string[] }
export type ProductCSVRelations = {
  brands: ProductCSVRelation[]
  categories: ProductCSVRelation[]
  media: ProductCSVRelation[]
}
export type ProductCSVError = { row: number; sku?: string; field: string; message: string }
export type ParsedProductCSVRow = { row: number; sku: string; data: ProductForCSV }

const PET_TYPES = new Set(['Cat', 'Dog', 'Bird', 'Rabbit', 'Fish', 'Small pets', 'Reptile'])
const STATUSES = new Set(['draft', 'active', 'archived'])
const FORMULA = /^[\t\r\n ]*[=+\-@]/

function lexicalText(text: string): unknown {
  if (!text) return null
  if (text.trimStart().startsWith('{')) {
    try { return JSON.parse(text) } catch { throw new Error('must be valid rich-text JSON or plain text') }
  }
  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: null, children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: null, textFormat: 0, textStyle: '', children: [{ type: 'text', format: 0, style: '', mode: 'normal', detail: 0, version: 1, text }] }] } }
}

function numberValue(value: string, options: { required?: boolean; integer?: boolean; min?: number }, field: string): number | null {
  if (!value.trim()) {
    if (options.required) throw new Error(`${field} is required`)
    return null
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || (options.integer && !Number.isInteger(parsed)) || (options.min != null && parsed < options.min)) {
    throw new Error(`${field} must be ${options.integer ? 'an integer' : 'a number'}${options.min != null ? ` of at least ${options.min}` : ''}`)
  }
  return parsed
}

function split(value: string): string[] {
  return value ? value.split(PRODUCT_CSV_RELATION_DELIMITER).map((item) => item.trim()).filter(Boolean) : []
}

function relation(value: string, available: ProductCSVRelation[], field: string): string | number {
  const wanted = value.trim().toLocaleLowerCase()
  const matches = available.filter((item) => String(item.id).toLocaleLowerCase() === wanted || item.names?.some((name) => name.trim().toLocaleLowerCase() === wanted))
  if (matches.length === 0) throw new Error(`unknown ${field} "${value}"`)
  if (matches.length > 1) throw new Error(`ambiguous ${field} "${value}"`)
  return matches[0].id
}

function variantsValue(value: string): ProductForCSV[] {
  let variants: unknown
  try { variants = JSON.parse(value || '[]') } catch { throw new Error('variants_json must be valid JSON') }
  if (!Array.isArray(variants)) throw new Error('variants_json must be an array')
  return variants.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`variant ${index + 1} must be an object`)
    const variant = entry as ProductForCSV
    const price = numberValue(String(variant.price ?? ''), { min: 0 }, `variant ${index + 1} price`)
    const stock = numberValue(String(variant.stock ?? ''), { integer: true, min: 0 }, `variant ${index + 1} stock`)
    return { name: { en: String(variant.name_en ?? ''), bn: String(variant.name_bn ?? '') }, sku: String(variant.sku ?? ''), price, stock }
  })
}

function rejectFormula(record: Record<string, string>): void {
  const numeric = new Set(['price', 'compare_at_price', 'stock', 'weight_grams'])
  for (const [field, value] of Object.entries(record)) {
    if (!numeric.has(field) && FORMULA.test(value)) throw new Error(`${field} contains a spreadsheet formula prefix`)
  }
}

function restoreSpreadsheetSafeValues(record: Record<string, string>): void {
  for (const field of Object.keys(record)) {
    const value = record[field]
    if (value.startsWith("'") && FORMULA.test(value.slice(1))) record[field] = value.slice(1)
  }
}

function validationField(message: string): string {
  const exact = PRODUCT_CSV_HEADERS.find((field) => message.startsWith(field) || message.includes(`${field} `))
  if (exact) return exact
  if (message.includes('SKU')) return 'sku'
  if (message.includes('pet type')) return 'pet_types'
  if (message.includes('brand')) return 'brand'
  if (message.includes('category')) return 'categories'
  if (message.includes('media') || message.includes('image_ids')) return 'image_ids'
  if (message.includes('variant')) return 'variants_json'
  return 'row'
}

export function parseProductCSV(input: string | Buffer, relations: ProductCSVRelations): { rows: ParsedProductCSVRow[]; errors: ProductCSVError[] } {
  const source = (Buffer.isBuffer(input) ? input.toString('utf8') : input).replace(/^\uFEFF/, '')
  let records: Record<string, string>[]
  try {
    records = parse(source, { columns: (headers: string[]) => {
      if (headers.length !== PRODUCT_CSV_HEADERS.length || headers.some((header, index) => header !== PRODUCT_CSV_HEADERS[index])) {
        throw new Error(`headers must exactly match: ${PRODUCT_CSV_HEADERS.join(',')}`)
      }
      return headers
    }, bom: true, skip_empty_lines: true, relax_column_count: false, trim: false })
  } catch (error) {
    return { rows: [], errors: [{ row: 1, field: 'csv', message: error instanceof Error ? error.message : 'Malformed CSV' }] }
  }
  if (records.length > PRODUCT_CSV_MAX_ROWS) return { rows: [], errors: [{ row: 1, field: 'csv', message: `CSV exceeds ${PRODUCT_CSV_MAX_ROWS} data rows` }] }

  const rows: ParsedProductCSVRow[] = []
  const errors: ProductCSVError[] = []
  const seen = new Set<string>()
  records.forEach((record, index) => {
    const row = index + 2
    let sku = record.sku.trim()
    try {
      rejectFormula(record)
      restoreSpreadsheetSafeValues(record)
      sku = record.sku.trim()
      if (!sku) throw new Error('sku is required')
      const normalizedSKU = sku.toLocaleLowerCase()
      if (seen.has(normalizedSKU)) throw new Error(`duplicate SKU "${sku}" in CSV`)
      seen.add(normalizedSKU)
      if (!record.slug.trim()) throw new Error('slug is required')
      if (!record.name_en.trim()) throw new Error('name_en is required')
      const status = record.status.trim() || 'draft'
      if (!STATUSES.has(status)) throw new Error('status must be draft, active, or archived')
      const petTypes = split(record.pet_types)
      const invalidPet = petTypes.find((pet) => !PET_TYPES.has(pet))
      if (invalidPet) throw new Error(`unknown pet type "${invalidPet}"`)
      const brand = relation(record.brand, relations.brands, 'brand')
      const categories = split(record.categories).map((item) => relation(item, relations.categories, 'category'))
      const images = split(record.image_ids).map((item) => relation(item, relations.media, 'media'))
      if (!images.length) throw new Error('image_ids requires at least one existing media ID')
      const data: ProductForCSV = {
        sku, slug: record.slug.trim(), status, name: { en: record.name_en, bn: record.name_bn },
        description: { en: lexicalText(record.description_en), bn: lexicalText(record.description_bn) },
        price: numberValue(record.price, { required: true, min: 0 }, 'price'),
        compareAtPrice: numberValue(record.compare_at_price, { min: 0 }, 'compare_at_price'),
        stock: numberValue(record.stock, { required: true, integer: true, min: 0 }, 'stock'),
        weightGrams: numberValue(record.weight_grams, { required: true, integer: true, min: 1 }, 'weight_grams'),
        brand, categories, petTypes, images, variants: variantsValue(record.variants_json),
        details: {
          ingredients: { en: lexicalText(record.ingredients_en), bn: lexicalText(record.ingredients_bn) },
          usage: { en: lexicalText(record.usage_en), bn: lexicalText(record.usage_bn) },
          storage: { en: lexicalText(record.storage_en), bn: lexicalText(record.storage_bn) },
          safetyNote: { en: record.safety_en, bn: record.safety_bn }, origin: record.origin,
          prescriptionRequired: ['true', '1', 'yes'].includes(record.prescription_required.toLowerCase()),
        },
        seo: { title: { en: record.seo_title_en, bn: record.seo_title_bn }, description: { en: record.seo_description_en, bn: record.seo_description_bn }, canonical: record.canonical },
      }
      if (record.prescription_required && !['true', 'false', '1', '0', 'yes', 'no'].includes(record.prescription_required.toLowerCase())) throw new Error('prescription_required must be true or false')
      rows.push({ row, sku, data })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid row'
      errors.push({ row, sku: sku || undefined, field: validationField(message), message })
    }
  })
  return { rows, errors }
}

export function serializeProductCSVErrors(errors: ProductCSVError[]): string {
  return ['row,sku,field,error', ...errors.map((error) => [error.row, error.sku || '', error.field, error.message].map(quote).join(','))].join('\r\n') + '\r\n'
}
