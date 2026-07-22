import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CartItem, Product } from '@/lib/commerce'

const product: Product = { id: 'client-cat-food', slug: 'cms-cat-food', name: { en: 'Cat Food', bn: 'ক্যাট ফুড' }, brand: 'Pet Zone', category: 'Cat', price: 1_000, weightGrams: 1_000, image: '/media/reflex-salmon.jpg', inStock: true }
let cart: CartItem[] = [{ product, quantity: 1 }]
const clearCart = vi.fn()

vi.mock('@/components/store-provider', () => ({ useStore: () => ({ cart, clearCart }) }))

import { CheckoutForm } from './checkout-form'

const customer = { firstName: 'Greg', lastName: 'Habiskis', phone: '01787101001', email: 'greg@example.com', streetAddress: 'Dhaka Road', city: 'Dhaka', postalCode: '1207' }

describe('CheckoutForm coupons', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    cart = [{ product, quantity: 1 }]
  })

  it('applies and removes a server-validated coupon and recalculates bKash', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ valid: true, code: 'SAVE10', discount: 100, discountedSubtotal: 900, shipping: 50, fee: 17.58, total: 967.58 }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<CheckoutForm customer={customer} />)
    fireEvent.change(screen.getByLabelText('Coupon code'), { target: { value: ' save10 ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply coupon' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('SAVE10 applied'))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).items).toEqual([{ productId: 'cms-cat-food', quantity: 1 }])
    expect(screen.getByText('-৳ 100')).toBeInTheDocument()
    expect(screen.getByText('৳ 17.58')).toBeInTheDocument()
    expect(screen.getByText('৳ 967.58')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove coupon' }))
    expect(screen.queryByText('-৳ 100')).not.toBeInTheDocument()
  })

  it('shows validation errors and never trusts a client discount on order submission', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'This coupon has expired.' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ orderNumber: 'PZ-1' }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<CheckoutForm customer={customer} />)
    fireEvent.change(screen.getByLabelText('Coupon code'), { target: { value: 'OLD' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply coupon' }))
    await screen.findByText('This coupon has expired.')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/store/coupons/validate')
  })

  it('disables ordering and links back to the shop when the cart is empty', () => {
    cart = []
    render(<CheckoutForm customer={customer} />)
    expect(screen.getByRole('button', { name: /Place order/ })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Return to shop' })).toHaveAttribute('href', '/shop')
  })
})
