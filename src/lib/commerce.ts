export type LocalizedText = { en: string; bn: string }

export type ProductSeo = {
  title?: LocalizedText
  description?: LocalizedText
  image?: string
  canonical?: string
}

export type Product = {
  id: string
  slug: string
  name: LocalizedText
  description?: LocalizedText
  shortDescription?: LocalizedText
  brand: string
  category: string
  price: number
  weightGrams: number
  compareAtPrice?: number
  image: string
  inStock: boolean
  badge?: string
  /** Optional CMS overrides; blank fields use storefront defaults at render time. */
  seo?: ProductSeo
}

export type CartItem = { product: Product; quantity: number }

export function addCartItem(items: CartItem[], product: Product): CartItem[] {
  const existing = items.find((item) => item.product.id === product.id)
  if (!existing) return [...items, { product, quantity: 1 }]
  return items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
}

export function cartWeightGrams(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.product.weightGrams * item.quantity, 0)
}

export type ShippingMethod = 'home_delivery' | 'local_pickup'
export type PaymentMethod = 'bkash' | 'bank_transfer' | 'cash_on_delivery'

export function shippingQuote(weightGrams: number, method: ShippingMethod) {
  if (method === 'local_pickup') return { shippingClass: 'Local Pickup', rate: 0 }
  if (weightGrams <= 1000) return { shippingClass: 'Light Weight', rate: 50 }
  if (weightGrams <= 10000) return { shippingClass: 'Medium Weight', rate: 100 }
  if (weightGrams <= 20000) return { shippingClass: 'Heavy Weight', rate: 150 }
  return { shippingClass: 'Very Heavy Weight', rate: 200 }
}

export function bKashFee(amount: number): number {
  return Math.round(amount * 0.0185 * 100) / 100
}

export function checkoutTotal(subtotal: number, shipping: number, payment: PaymentMethod): number {
  const beforeFee = subtotal + shipping
  return beforeFee + (payment === 'bkash' ? bKashFee(beforeFee) : 0)
}

export type ProductFilters = { query: string; brand: string; pet?: string; minPrice?: number; maxPrice?: number }

export function normalizeCatalogFilters(
  products: Product[],
  values: { query?: string | null; brand?: string | null; pet?: string | null; minPrice?: string | null; maxPrice?: string | null },
) {
  const prices = products.map((product) => product.price)
  const priceFloor = prices.length ? Math.min(...prices) : 0
  const priceCeiling = prices.length ? Math.max(...prices) : 0
  const allowedPets = new Set(['Cat', 'Dog', 'Bird', 'Rabbit', 'Fish'])
  const parsePrice = (value: string | null | undefined, fallback: number) => {
    const parsed = Number(value)
    return value && Number.isFinite(parsed) ? Math.min(priceCeiling, Math.max(priceFloor, parsed)) : fallback
  }
  let minPrice = parsePrice(values.minPrice, priceFloor)
  let maxPrice = parsePrice(values.maxPrice, priceCeiling)
  if (minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice]
  return {
    query: values.query?.trim() ?? '',
    brand: values.brand?.trim() && values.brand.trim().length <= 100 ? values.brand.trim() : 'All',
    pet: values.pet && allowedPets.has(values.pet) ? values.pet : 'All',
    minPrice,
    maxPrice,
    priceFloor,
    priceCeiling,
  }
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const query = filters.query.trim().toLocaleLowerCase()
  const pet = filters.pet && filters.pet !== 'All' ? filters.pet.toLocaleLowerCase() : ''
  const minPrice = Number.isFinite(filters.minPrice) ? Number(filters.minPrice) : Number.NEGATIVE_INFINITY
  const maxPrice = Number.isFinite(filters.maxPrice) ? Number(filters.maxPrice) : Number.POSITIVE_INFINITY
  return products.filter((product) => {
    const haystack = `${product.name.en} ${product.name.bn} ${product.brand} ${product.category}`.toLocaleLowerCase()
    const category = product.category.toLocaleLowerCase()
    const petMatches = !pet || category === pet
    return (!query || haystack.includes(query))
      && (filters.brand === 'All' || product.brand === filters.brand)
      && petMatches
      && product.price >= minPrice
      && product.price <= maxPrice
  })
}

export function recommendCartProducts(products: Product[], cart: CartItem[], limit = 4): Product[] {
  if (limit <= 0 || cart.length === 0) return []
  const cartIds = new Set(cart.map(({ product }) => product.id))
  const categories = new Set(cart.map(({ product }) => product.category))
  const brands = new Set(cart.map(({ product }) => product.brand))
  const seen = new Set<string>()

  return products
    .map((product, index) => ({
      product,
      index,
      categoryMatch: categories.has(product.category) ? 1 : 0,
      brandMatch: brands.has(product.brand) ? 1 : 0,
    }))
    .filter(({ product }) => {
      if (!product.inStock || cartIds.has(product.id) || seen.has(product.id)) return false
      seen.add(product.id)
      return true
    })
    .sort((a, b) => b.categoryMatch - a.categoryMatch || b.brandMatch - a.brandMatch || a.index - b.index)
    .slice(0, limit)
    .map(({ product }) => product)
}

export const formatBDT = (amount: number) => `৳ ${new Intl.NumberFormat('en-BD').format(amount)}`
