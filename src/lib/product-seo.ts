import type { Metadata } from 'next'
import type { LocalizedText, Product } from './commerce'

export type ProductSeoLocale = keyof LocalizedText

const DEFAULT_META_DESCRIPTION_FALLBACK =
  'Shop authentic pet products at Pet Zone Bangladesh. Shop now!'

function pickLocalized(
  value: LocalizedText | string | null | undefined,
  locale: ProductSeoLocale,
): string {
  if (typeof value === 'string') return value.trim()
  if (!value) return ''
  return (value[locale] || value.en || value.bn || '').trim()
}

export function productMetaTitle(
  product: Pick<Product, 'name' | 'seo'>,
  locale: ProductSeoLocale = 'en',
): string {
  const override = pickLocalized(product.seo?.title, locale)
  if (override) return override
  const title = pickLocalized(product.name, locale)
  return title ? `${title} - Buy Online on Pet Zone` : 'Buy Online on Pet Zone'
}

export function productMetaDescription(
  product: Pick<Product, 'shortDescription' | 'seo'>,
  locale: ProductSeoLocale = 'en',
): string {
  const override = pickLocalized(product.seo?.description, locale)
  if (override) return override
  const short = pickLocalized(product.shortDescription, locale)
  return short ? `${short} Shop now!` : DEFAULT_META_DESCRIPTION_FALLBACK
}

export function productPageMetadata(
  product: Pick<Product, 'name' | 'shortDescription' | 'slug' | 'image' | 'seo'>,
  locale: ProductSeoLocale = 'en',
): Metadata {
  const title = productMetaTitle(product, locale)
  const description = productMetaDescription(product, locale)
  const canonical = product.seo?.canonical?.trim() || `/product/${product.slug}`
  const ogImage = product.seo?.image?.trim() || product.image

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}
