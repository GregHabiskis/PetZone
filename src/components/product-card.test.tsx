import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '@/lib/commerce'

vi.mock('./store-provider', () => ({ useStore: () => ({ addToCart: vi.fn() }) }))
vi.mock('next/image', () => ({ default: ({ alt }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => <span role="img" aria-label={alt} /> }))
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }))

import { ProductCard } from './product-card'

const product: Product = { id: 'food', slug: 'food', name: { en: 'Pet food', bn: 'পেট ফুড' }, brand: 'Pet Zone', category: 'Cat', price: 500, weightGrams: 500, image: '/food.jpg', inStock: true }

describe('ProductCard', () => {
  it('places the commerce action in the reusable card action row', () => {
    render(<ProductCard product={product} />)
    expect(screen.getByRole('button', { name: /add to cart/i }).parentElement).toHaveClass('card-actions')
  })
})
