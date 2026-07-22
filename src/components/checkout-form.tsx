'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useStore } from '@/components/store-provider'
import { cartTotal, cartWeightGrams, formatBDT, shippingQuote, type PaymentMethod, type ShippingMethod } from '@/lib/commerce'
import { calculateDiscountedTotals } from '@/lib/coupons'

type Customer = { firstName: string; lastName: string; phone: string; email?: string | null; streetAddress: string; city: string; postalCode: string }

export function CheckoutForm({ customer }: { customer: Customer }) {
  const { cart, clearCart } = useStore()
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('home_delivery')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash')
  const [result, setResult] = useState<{ orderNumber: string } | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponPending, setCouponPending] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [coupon, setCoupon] = useState<{ code: string; discount: number; cartSignature: string } | null>(null)
  const subtotal = cartTotal(cart)
  const cartSignature = cart.map(({ product, quantity }) => `${product.id}:${quantity}`).sort().join('|')
  const appliedCoupon = coupon?.cartSignature === cartSignature ? coupon : null
  const weight = cartWeightGrams(cart)
  const shipping = shippingQuote(weight, shippingMethod)
  const totals = calculateDiscountedTotals(subtotal, appliedCoupon?.discount ?? 0, shipping.rate, paymentMethod)
  const fee = totals.fee
  const total = totals.total

  if (result) return <section className="section shell"><div className="status-message order-success"><h1>Order received.</h1><p>Your order number is <strong>{result.orderNumber}</strong>. Track it from your protected order history.</p><Link className="primary-button" href="/orders">View my orders</Link></div></section>

  async function applyCoupon() {
    if (!couponInput.trim() || !cart.length) return
    setCouponPending(true)
    setCouponError('')
    const response = await fetch('/api/store/coupons/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: couponInput, items: cart.map(({ product, quantity }) => ({ productId: product.slug, quantity })), shippingMethod, paymentMethod }),
    })
    const body = await response.json()
    setCouponPending(false)
    if (!response.ok) {
      setCoupon(null)
      setCouponError(body.error || 'Could not apply this coupon.')
      return
    }
    setCoupon({ code: body.code, discount: body.discount, cartSignature })
    setCouponInput(body.code)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/store/orders', {
      method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({
        items: cart.map(({ product, quantity }) => ({ productId: product.slug, quantity })),
        contact: { firstName: form.get('firstName'), lastName: form.get('lastName'), phone: form.get('phone'), email: form.get('email'), streetAddress: form.get('streetAddress'), city: form.get('city'), postalCode: form.get('postalCode') },
        shippingMethod, paymentMethod, bkashNumber: form.get('bkashNumber'), bkashTransactionId: form.get('bkashTransactionId'),
        termsAccepted: form.get('termsAccepted') === 'on', privacyAccepted: form.get('privacyAccepted') === 'on', note: form.get('note'), couponCode: appliedCoupon?.code,
      }),
    })
    const body = await response.json()
    setPending(false)
    if (!response.ok) return setError(body.error || 'Could not place the order.')
    clearCart()
    setResult(body)
  }

  return <section className="section shell"><form className="checkout-grid" onSubmit={submit} data-od-id="authenticated-checkout-form"><div className="form-card"><h2>Delivery details</h2><div className="two-col"><div className="field"><label htmlFor="firstName">First name</label><input id="firstName" name="firstName" defaultValue={customer.firstName} required /></div><div className="field"><label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" defaultValue={customer.lastName} required /></div></div><div className="field"><label htmlFor="streetAddress">Street address</label><textarea id="streetAddress" name="streetAddress" defaultValue={customer.streetAddress} required /></div><div className="two-col"><div className="field"><label htmlFor="city">City</label><input id="city" name="city" defaultValue={customer.city} required /></div><div className="field"><label htmlFor="postalCode">Postal code</label><input id="postalCode" name="postalCode" defaultValue={customer.postalCode} required /></div></div><div className="two-col"><div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" defaultValue={customer.phone} required /></div><div className="field"><label htmlFor="email">Email <span>(optional)</span></label><input id="email" name="email" type="email" defaultValue={customer.email || ''} /></div></div>

  <h2>Shipping</h2><label className="payment-option"><input type="radio" name="shipping" checked={shippingMethod === 'home_delivery'} onChange={() => setShippingMethod('home_delivery')} /> Home Delivery — calculated by total cart weight</label><label className="payment-option"><input type="radio" name="shipping" checked={shippingMethod === 'local_pickup'} onChange={() => setShippingMethod('local_pickup')} /> Local pickup — free</label>

  <h2>Payment</h2><label className="payment-option"><input type="radio" name="payment" checked={paymentMethod === 'bkash'} onChange={() => setPaymentMethod('bkash')} /> bKash SEND MONEY — 1.85% fee</label><label className="payment-option"><input type="radio" name="payment" checked={paymentMethod === 'bank_transfer'} onChange={() => setPaymentMethod('bank_transfer')} /> Bank transfer</label><label className="payment-option"><input type="radio" name="payment" checked={paymentMethod === 'cash_on_delivery'} onChange={() => setPaymentMethod('cash_on_delivery')} /> Cash on Delivery</label>
  {paymentMethod === 'bkash' && <div className="payment-details"><p>Send Money to <strong>+8801787-101001</strong>, including the 1.85% fee shown in your order summary.</p><div className="two-col"><div className="field"><label htmlFor="bkashNumber">Your bKash number</label><input id="bkashNumber" name="bkashNumber" type="tel" required /></div><div className="field"><label htmlFor="bkashTransactionId">bKash Transaction ID</label><input id="bkashTransactionId" name="bkashTransactionId" required /></div></div></div>}
  {paymentMethod === 'bank_transfer' && <div className="payment-details"><p>Bank details will be published here before this payment method is enabled for production.</p></div>}
  <div className="field"><label htmlFor="note">Order note (optional)</label><textarea id="note" name="note" /></div>
  <label className="consent"><input type="checkbox" name="termsAccepted" required /> I agree to the <Link href="/terms-and-conditions" target="_blank">Terms & Conditions</Link>.</label><label className="consent"><input type="checkbox" name="privacyAccepted" required /> I agree to the <Link href="/privacy-policy" target="_blank">Privacy Policy</Link>.</label>
  {error && <p className="form-error" role="alert">{error}</p>}</div>
  <aside className="summary-card"><h2>Your order</h2>{cart.map((item) => <div className="summary-line" key={item.product.id}><span>{item.product.name.en} × {item.quantity}</span><b>{formatBDT(item.product.price * item.quantity)}</b></div>)}<div className="coupon-control"><label htmlFor="couponCode">Coupon code</label><div><input id="couponCode" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} disabled={Boolean(appliedCoupon) || !cart.length} /><button type="button" onClick={applyCoupon} disabled={couponPending || Boolean(appliedCoupon) || !couponInput.trim() || !cart.length}>{couponPending ? 'Applying…' : 'Apply coupon'}</button></div>{appliedCoupon && <p className="coupon-success" role="status"><strong>{appliedCoupon.code} applied</strong><button type="button" aria-label="Remove coupon" onClick={() => { setCoupon(null); setCouponInput(''); setCouponError('') }}>Remove</button></p>}{couponError && <p className="form-error" role="alert">{couponError}</p>}</div><div className="summary-line"><span>Weight</span><span>{(weight / 1000).toFixed(2)} kg</span></div>{appliedCoupon && <><div className="summary-line"><span>Subtotal</span><span>{formatBDT(subtotal)}</span></div><div className="summary-line coupon-discount"><span>Coupon discount</span><span>-{formatBDT(appliedCoupon.discount)}</span></div></>}<div className="summary-line"><span>{shipping.shippingClass}</span><span>{formatBDT(shipping.rate)}</span></div>{fee > 0 && <div className="summary-line"><span>bKash fee (1.85%)</span><span>{formatBDT(fee)}</span></div>}<div className="summary-line total"><span>Total</span><span>{formatBDT(total)}</span></div><button className="primary-button" disabled={!cart.length || pending}>{pending ? 'Placing order…' : `Place order · ${formatBDT(total)}`}</button>{!cart.length && <p className="empty-cart-help">Your cart is empty. <Link href="/shop">Return to shop</Link>.</p>}<p><small>Authenticated checkout · Delivery across Bangladesh</small></p></aside></form></section>
}
