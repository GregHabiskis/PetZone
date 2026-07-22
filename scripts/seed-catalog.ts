import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { products } from '../src/lib/data'

const payload = await getPayload({ config })
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

async function taxonomy(collection: 'brands' | 'categories', name: string) {
  const slug = slugify(name)
  const existing = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs[0]) return existing.docs[0].id
  const created = await payload.create({ collection, data: { name, slug }, locale: 'en', overrideAccess: true })
  return created.id
}

async function mediaFor(image: string, alt: string) {
  const filename = path.basename(image)
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs[0]) return existing.docs[0].id
  const created = await payload.create({
    collection: 'media',
    data: { alt },
    filePath: path.resolve('public', image.replace(/^\//, '')),
    locale: 'en',
    overrideAccess: true,
  })
  return created.id
}

for (const product of products) {
  const brand = await taxonomy('brands', product.brand)
  const category = await taxonomy('categories', product.category)
  const media = await mediaFor(product.image, product.name.en)
  const sku = `PZ-${product.id.toUpperCase()}`
  const data = {
    name: product.name.en,
    slug: product.slug,
    brand,
    categories: [category],
    petTypes: [product.category] as Array<'Cat' | 'Dog' | 'Bird' | 'Rabbit' | 'Fish' | 'Small pets' | 'Reptile'>,
    images: [media],
    price: product.price,
    weightGrams: product.weightGrams,
    compareAtPrice: product.compareAtPrice,
    sku,
    stock: product.inStock ? 25 : 0,
    status: 'active' as const,
  }
  const existing = await payload.find({ collection: 'products', where: { slug: { equals: product.slug } }, limit: 1, depth: 0, overrideAccess: true })
  const document = existing.docs[0]
    ? await payload.update({ collection: 'products', id: existing.docs[0].id, data, locale: 'en', overrideAccess: true })
    : await payload.create({ collection: 'products', data, locale: 'en', overrideAccess: true })
  await payload.update({ collection: 'products', id: document.id, data: { name: product.name.bn }, locale: 'bn', overrideAccess: true })
}

console.log(`Seeded ${products.length} authoritative Payload products.`)
process.exit(0)
