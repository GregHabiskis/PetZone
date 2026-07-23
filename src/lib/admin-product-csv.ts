/* eslint-disable @typescript-eslint/no-explicit-any -- Payload Local API data changes shape by locale; this module validates it before writes. */
import type { Payload, PayloadRequest, TypedUser } from 'payload'
import { commitTransaction, createLocalReq, initTransaction, killTransaction } from 'payload'
import {
  parseProductCSV,
  type ParsedProductCSVRow,
  type ProductCSVError,
  type ProductCSVRelation,
  type ProductCSVRelations,
} from './product-csv'
import { siteOrigins } from './site-origins'

type StaffUser = TypedUser & { id: string | number; role?: unknown }
type ProductDocument = Record<string, any> & { id: number; sku?: string | null }

type ImportPlan = {
  rows: ParsedProductCSVRow[]
  errors: ProductCSVError[]
  existingBySKU: Map<string, ProductDocument>
  createCount: number
  updateCount: number
}

const normalizeSKU = (sku: string) => sku.trim().toLocaleLowerCase('en-US')

export function isProductCSVStaff(user: unknown): user is StaffUser {
  if (!user || typeof user !== 'object') return false
  const candidate = user as { collection?: unknown; role?: unknown }
  return candidate.collection === 'users' && ['admin', 'editor'].includes(String(candidate.role))
}

export function isSameOriginAdminRequest(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const allowed = new Set([new URL(request.url).origin, ...siteOrigins()])
  return allowed.has(origin)
}

async function findAll(payload: Payload, collection: 'brands' | 'categories' | 'media' | 'products', locale?: 'all') {
  const docs: ProductDocument[] = []
  let page = 1
  let hasNextPage = true
  while (hasNextPage) {
    const result = await payload.find({
      collection,
      depth: 0,
      limit: 500,
      page,
      locale,
      overrideAccess: true,
    })
    docs.push(...(result.docs as ProductDocument[]))
    hasNextPage = Boolean(result.hasNextPage)
    page += 1
  }
  return docs
}

function localizedNames(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.values(value).filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
}

export async function loadProductCSVRelations(payload: Payload): Promise<ProductCSVRelations> {
  const [brands, categories, media] = await Promise.all([
    findAll(payload, 'brands', 'all'),
    findAll(payload, 'categories', 'all'),
    findAll(payload, 'media'),
  ])
  const mapTaxonomy = (docs: ProductDocument[]): ProductCSVRelation[] => docs.map((doc) => ({
    id: doc.id,
    names: localizedNames(doc.name),
  }))
  return {
    brands: mapTaxonomy(brands),
    categories: mapTaxonomy(categories),
    media: media.map((doc) => ({ id: doc.id, names: [doc.filename, doc.alt].filter((value): value is string => typeof value === 'string' && Boolean(value)) })),
  }
}

export async function loadProductsForCSVExport(payload: Payload): Promise<ProductDocument[]> {
  return findAll(payload, 'products', 'all')
}

export async function buildProductCSVImportPlan(payload: Payload, source: string | Buffer): Promise<ImportPlan> {
  const relations = await loadProductCSVRelations(payload)
  const parsed = parseProductCSV(source, relations)
  if (parsed.errors.length) return { ...parsed, existingBySKU: new Map(), createCount: 0, updateCount: 0 }

  const existingProducts = await findAll(payload, 'products', 'all')
  const existingBySKU = new Map<string, ProductDocument>()
  const errors: ProductCSVError[] = []
  for (const product of existingProducts) {
    const sku = typeof product.sku === 'string' ? product.sku.trim() : ''
    if (!sku) continue
    const key = normalizeSKU(sku)
    if (existingBySKU.has(key)) {
      errors.push({ row: 1, sku, field: 'sku', message: `Existing products contain ambiguous case-insensitive SKU "${sku}"` })
    } else {
      existingBySKU.set(key, product)
    }
  }
  if (errors.length) return { rows: parsed.rows, errors, existingBySKU, createCount: 0, updateCount: 0 }

  const updateCount = parsed.rows.filter((row) => existingBySKU.has(normalizeSKU(row.sku))).length
  return {
    rows: parsed.rows,
    errors: [],
    existingBySKU,
    createCount: parsed.rows.length - updateCount,
    updateCount,
  }
}

function localized(value: unknown, locale: 'en' | 'bn'): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const candidate = value as Record<string, unknown>
  return Object.hasOwn(candidate, locale) ? candidate[locale] : value
}

export function mergeProductVariantIDs(imported: Record<string, any>[], persisted: Record<string, any>[] | null | undefined) {
  const idsBySKU = new Map((persisted ?? [])
    .filter((variant) => typeof variant.sku === 'string' && variant.id != null)
    .map((variant) => [normalizeSKU(variant.sku), variant.id]))
  return imported.map((variant) => {
    const id = typeof variant.sku === 'string' ? idsBySKU.get(normalizeSKU(variant.sku)) : undefined
    return id == null ? variant : { ...variant, id }
  })
}

function productDataForLocale(data: Record<string, any>, locale: 'en' | 'bn', persisted?: ProductDocument): any {
  const variants = mergeProductVariantIDs(
    Array.isArray(data.variants) ? data.variants : [],
    Array.isArray(persisted?.variants) ? persisted.variants : [],
  )
  return {
    ...data,
    name: localized(data.name, locale),
    description: localized(data.description, locale),
    shortDescription: localized(data.shortDescription, locale),
    variants: variants.map((variant: Record<string, any>) => ({
      ...variant,
      name: localized(variant.name, locale),
    })),
    details: data.details ? {
      ...data.details,
      ingredients: localized(data.details.ingredients, locale),
      usage: localized(data.details.usage, locale),
      storage: localized(data.details.storage, locale),
      safetyNote: localized(data.details.safetyNote, locale),
    } : undefined,
    seo: data.seo ? {
      ...data.seo,
      title: localized(data.seo.title, locale),
      description: localized(data.seo.description, locale),
    } : undefined,
  }
}

class ProductCSVCommitError extends Error {
  row: ParsedProductCSVRow

  constructor(row: ParsedProductCSVRow, cause: unknown) {
    super(cause instanceof Error ? cause.message : 'Product import failed')
    this.row = row
  }
}

export async function commitProductCSVImport(payload: Payload, user: StaffUser, plan: ImportPlan): Promise<void> {
  const req = await createLocalReq({ user }, payload)
  const startedTransaction = await initTransaction(req)
  let currentRow: ParsedProductCSVRow | undefined
  try {
    for (const row of plan.rows) {
      currentRow = row
      const existing = plan.existingBySKU.get(normalizeSKU(row.sku))
      const englishData = productDataForLocale(row.data, 'en', existing)
      const document = existing
        ? await payload.update({ collection: 'products', id: existing.id, data: englishData, locale: 'en', overrideAccess: false, req })
        : await payload.create({ collection: 'products', data: englishData, locale: 'en', overrideAccess: false, req })
      await payload.update({
        collection: 'products',
        id: document.id,
        data: productDataForLocale(row.data, 'bn', document as ProductDocument),
        locale: 'bn',
        overrideAccess: false,
        req,
      })
    }
    if (startedTransaction) await commitTransaction(req as PayloadRequest & { payload: Payload })
  } catch (error) {
    if (startedTransaction) await killTransaction(req as PayloadRequest & { payload: Payload })
    if (currentRow) throw new ProductCSVCommitError(currentRow, error)
    throw error
  }
}

export function productCSVCommitError(error: unknown): ProductCSVError {
  if (error instanceof ProductCSVCommitError) {
    return { row: error.row.row, sku: error.row.sku, field: 'row', message: error.message }
  }
  return { row: 1, field: 'csv', message: error instanceof Error ? error.message : 'Product import failed' }
}
