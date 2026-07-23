import { describe, expect, it } from 'vitest'
import type { Product } from './commerce'
import { productMetaDescription, productMetaTitle, productPageMetadata } from './product-seo'

const product: Product = {
  id: 'royal-canin',
  slug: 'royal-canin-fit',
  name: { en: 'Royal Canin Regular Fit 32', bn: 'রয়্যাল ক্যানিন রেগুলার ফিট ৩২' },
  description: {
    en: 'Complete and balanced dry food for adult cats.',
    bn: 'প্রাপ্তবয়স্ক বিড়ালের জন্য সম্পূর্ণ ও সুষম শুষ্ক খাবার।',
  },
  shortDescription: {
    en: 'Complete dry food for adult cats aged 1–7 years. Helps maintain ideal weight.',
    bn: '১-৭ বছর বয়সী বিড়ালের জন্য সম্পূর্ণ শুষ্ক খাবার। আদর্শ ওজন বজায় রাখতে সাহায্য করে।',
  },
  brand: 'Royal Canin',
  category: 'Cat',
  price: 2850,
  weightGrams: 2000,
  image: '/media/royal-canin-cat-food.jpg',
  inStock: true,
}

describe('productMetaTitle', () => {
  it('defaults to product title with Buy Online on Pet Zone', () => {
    expect(productMetaTitle(product)).toBe('Royal Canin Regular Fit 32 - Buy Online on Pet Zone')
  })

  it('uses localized name for bn', () => {
    expect(productMetaTitle(product, 'bn')).toBe('রয়্যাল ক্যানিন রেগুলার ফিট ৩২ - Buy Online on Pet Zone')
  })

  it('prefers CMS seo.title override when set', () => {
    expect(
      productMetaTitle({
        ...product,
        seo: { title: { en: 'Custom Meta Title', bn: 'কাস্টম মেটা টাইটেল' } },
      }),
    ).toBe('Custom Meta Title')
  })

  it('ignores blank CMS seo.title and falls back to default', () => {
    expect(productMetaTitle({ ...product, seo: { title: { en: '  ', bn: '' } } })).toBe(
      'Royal Canin Regular Fit 32 - Buy Online on Pet Zone',
    )
  })
})

describe('productMetaDescription', () => {
  it('defaults to short description plus Shop now!', () => {
    expect(productMetaDescription(product)).toBe(
      'Complete dry food for adult cats aged 1–7 years. Helps maintain ideal weight. Shop now!',
    )
  })

  it('uses localized short description for bn', () => {
    expect(productMetaDescription(product, 'bn')).toBe(
      '১-৭ বছর বয়সী বিড়ালের জন্য সম্পূর্ণ শুষ্ক খাবার। আদর্শ ওজন বজায় রাখতে সাহায্য করে। Shop now!',
    )
  })

  it('prefers CMS seo.description override when set', () => {
    expect(
      productMetaDescription({
        ...product,
        seo: { description: { en: 'Staff-written meta description.', bn: 'স্টাফ মেটা।' } },
      }),
    ).toBe('Staff-written meta description.')
  })

  it('falls back when shortDescription is missing', () => {
    const bare = { ...product, shortDescription: undefined }
    expect(productMetaDescription(bare)).toBe(
      'Shop authentic pet products at Pet Zone Bangladesh. Shop now!',
    )
  })
})

describe('productPageMetadata', () => {
  it('returns absolute title so layout template does not double brand', () => {
    const meta = productPageMetadata(product)
    expect(meta.title).toEqual({ absolute: 'Royal Canin Regular Fit 32 - Buy Online on Pet Zone' })
    expect(meta.description).toBe('Complete dry food for adult cats aged 1–7 years. Helps maintain ideal weight. Shop now!')
    expect(meta.alternates).toEqual({ canonical: '/product/royal-canin-fit' })
  })

  it('uses CMS canonical when provided', () => {
    const meta = productPageMetadata({
      ...product,
      seo: { canonical: 'https://petzone.com.bd/product/royal-canin-fit' },
    })
    expect(meta.alternates).toEqual({
      canonical: 'https://petzone.com.bd/product/royal-canin-fit',
    })
  })
})
