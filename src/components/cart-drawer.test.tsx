import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Header } from './header'
import { StoreProvider, useStore } from './store-provider'
import type { Product } from '@/lib/commerce'

const product: Product = {
  id: 'drawer-product',
  slug: 'drawer-product',
  name: { en: 'Drawer Cat Food', bn: 'ড্রয়ার ক্যাট ফুড' },
  brand: 'Pet Zone',
  category: 'Cat',
  price: 500,
  weightGrams: 1000,
  image: '/media/reflex-salmon.jpg',
  inStock: true,
}

function Fixture() {
  const { addToCart } = useStore()
  return <button onClick={() => addToCart(product)}>Add fixture</button>
}

function renderStore() {
  return render(<StoreProvider><Header /><Fixture /></StoreProvider>)
}

describe('CartDrawer', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
  })

  it('opens from the header as a modal and returns focus after Escape', async () => {
    renderStore()
    const trigger = screen.getByRole('button', { name: /cart with 0 items/i })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Shopping cart' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.body).toHaveStyle({ overflow: 'hidden' })
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('auto-opens after add and updates quantities, totals, and removal', () => {
    renderStore()
    fireEvent.click(screen.getByRole('button', { name: 'Add fixture' }))

    expect(screen.getByRole('dialog', { name: 'Shopping cart' })).toBeInTheDocument()
    expect(screen.getByText('Drawer Cat Food')).toBeInTheDocument()
    expect(screen.getAllByText('৳ 500').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Increase Drawer Cat Food' }))
    expect(screen.getByRole('button', { name: 'Cart with 2 items' })).toBeInTheDocument()
    expect(screen.getAllByText('৳ 1,000').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Remove Drawer Cat Food' }))
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
  })

  it('dismisses from the backdrop and exposes cart and checkout actions', () => {
    renderStore()
    fireEvent.click(screen.getByRole('button', { name: /cart with 0 items/i }))
    expect(screen.getByRole('link', { name: 'Go to Cart' })).toHaveAttribute('href', '/cart')
    expect(screen.getByRole('link', { name: 'Proceed to Checkout' })).toHaveAttribute('href', '/checkout')
    fireEvent.click(screen.getByTestId('cart-drawer-backdrop'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
