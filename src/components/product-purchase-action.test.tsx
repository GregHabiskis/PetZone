import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { products } from '@/lib/data'

const addToCart = vi.fn()
vi.mock('./store-provider', () => ({ useStore: () => ({ addToCart }) }))

import { ProductPurchaseAction } from './product-purchase-action'

describe('ProductPurchaseAction', () => {
  it('adds an in-stock product through the shared store action', () => {
    render(<ProductPurchaseAction product={products[0]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(addToCart).toHaveBeenCalledWith(products[0])
  })

  it('disables purchase for out-of-stock products', () => {
    const product = products.find((item) => !item.inStock)!
    render(<ProductPurchaseAction product={product} />)
    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled()
  })
})
