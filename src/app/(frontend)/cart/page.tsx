"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus } from 'lucide-react'
import { cartTotal, formatBDT } from '@/lib/commerce'
import { recommendCartProducts } from '@/lib/commerce'
import { useStore } from '@/components/store-provider'
import { ProductCard } from '@/components/product-card'
import { products } from '@/lib/data'

export default function CartPage() {
  const { cart, updateQuantity } = useStore()
  const total = cartTotal(cart)
  const recommendations = recommendCartProducts(products, cart)
  return <><section className="page-hero"><div className="shell"><p className="eyebrow">YOUR CART</p><h1>Ready when you are.</h1></div></section><section className="section shell">{cart.length === 0 ? <div className="empty-state"><h2>Nothing in your cart yet.</h2><p>Start with your pet, or search for a favorite brand.</p><Link className="primary-button" href="/shop">Start shopping</Link></div> : <><div className="checkout-grid"><div className="form-card">{cart.map(({ product, quantity }) => <div className="cart-row" key={product.id}><Image src={product.image} alt={product.name.en} width={84} height={84} /><div><b>{product.name.en}</b><p>{product.brand}</p></div><div className="quantity"><button aria-label={`Decrease ${product.name.en}`} onClick={() => updateQuantity(product.id, quantity - 1)}><Minus /></button><span>{quantity}</span><button aria-label={`Increase ${product.name.en}`} onClick={() => updateQuantity(product.id, quantity + 1)}><Plus /></button></div><strong>{formatBDT(product.price * quantity)}</strong></div>)}</div><aside className="summary-card"><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><b>{formatBDT(total)}</b></div><div className="summary-line"><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-line total"><span>Total</span><span>{formatBDT(total)}</span></div><Link href="/checkout" className="primary-button">Checkout · {formatBDT(total)}</Link></aside></div>{recommendations.length > 0 && <section className="cart-upsells" aria-labelledby="cart-upsells-title"><div className="section-heading"><div><p className="eyebrow">COMPLETE THEIR ROUTINE</p><h2 id="cart-upsells-title">You may also need</h2></div></div><div className="product-grid">{recommendations.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}</>}</section></>
}
