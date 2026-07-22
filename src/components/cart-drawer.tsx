'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cartTotal, formatBDT } from '@/lib/commerce'
import { useStore } from './store-provider'

export function CartDrawer() {
  const { cart, cartDrawerOpen, closeCartDrawer, updateQuantity } = useStore()
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!cartDrawerOpen) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>('button, a')?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeCartDrawer()
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)')]
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [cartDrawerOpen, closeCartDrawer])

  if (!cartDrawerOpen) return null
  const subtotal = cartTotal(cart)

  return <div className="cart-drawer-layer">
    <button className="cart-drawer-backdrop" data-testid="cart-drawer-backdrop" aria-label="Close cart drawer" onClick={closeCartDrawer} />
    <aside ref={panelRef} className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="cart-drawer-heading"><div><p className="eyebrow">YOUR CART</p><h2>Shopping cart</h2></div><button className="icon-button" aria-label="Close shopping cart" onClick={closeCartDrawer}><X /></button></div>
      <div className="cart-drawer-items">
        {cart.length === 0 ? <div className="empty-state"><h3>Your cart is empty.</h3><p>Add an everyday essential to get started.</p></div> : cart.map(({ product, quantity }) => <div className="drawer-cart-row" key={product.id}>
          <Image src={product.image} alt="" width={72} height={72} />
          <div className="drawer-cart-copy"><strong>{product.name.en}</strong><span>{product.brand}</span><b>{formatBDT(product.price * quantity)}</b></div>
          <div className="drawer-cart-controls">
            <div className="quantity"><button aria-label={`Decrease ${product.name.en}`} onClick={() => updateQuantity(product.id, quantity - 1)}><Minus /></button><span>{quantity}</span><button aria-label={`Increase ${product.name.en}`} onClick={() => updateQuantity(product.id, quantity + 1)}><Plus /></button></div>
            <button className="drawer-remove" aria-label={`Remove ${product.name.en}`} onClick={() => updateQuantity(product.id, 0)}><Trash2 /></button>
          </div>
        </div>)}
      </div>
      <div className="cart-drawer-footer"><div className="summary-line total"><span>Subtotal</span><strong>{formatBDT(subtotal)}</strong></div><Link className="primary-button" href="/cart" onClick={closeCartDrawer}>Go to Cart</Link><Link className="primary-button" href="/checkout" onClick={closeCartDrawer}>Proceed to Checkout</Link></div>
    </aside>
  </div>
}
