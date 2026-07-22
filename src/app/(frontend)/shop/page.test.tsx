import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

let params = new URLSearchParams()
const replace = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/shop',
  useRouter: () => ({ replace }),
  useSearchParams: () => params,
}))
vi.mock('@/components/product-card', () => ({ ProductCard: ({ product }: { product: { name: { en: string } } }) => <article>{product.name.en}</article> }))

import ShopPage from './page'

describe('ShopPage', () => {
  afterEach(() => {
    cleanup()
    params = new URLSearchParams()
    replace.mockClear()
  })

  it('initializes filtering from URL parameters', () => {
    params = new URLSearchParams('brand=Reflex%20Plus&pet=Cat&minPrice=1200&maxPrice=1300')
    render(<ShopPage />)
    expect(screen.getByText('Reflex Plus Adult Cat Food — Salmon')).toBeInTheDocument()
    expect(screen.queryByText('Royal Canin Regular Fit 32 Adult Cat Food')).not.toBeInTheDocument()
  })

  it('renders the exact required zero-result message', () => {
    params = new URLSearchParams('q=definitely-not-a-product')
    render(<ShopPage />)
    expect(screen.getByRole('heading', { name: 'No Products Found' })).toBeInTheDocument()
  })

  it('exposes keyboard-operable min and max price controls', () => {
    render(<ShopPage />)
    expect(screen.getByLabelText('Minimum price')).toHaveAttribute('type', 'range')
    expect(screen.getByLabelText('Maximum price')).toHaveAttribute('type', 'range')
  })
})
