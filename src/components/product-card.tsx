'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { formatBDT, type Product } from '@/lib/commerce'
import { useStore } from './store-provider'

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore()
  return <article className="product-card" data-od-id={`product-card-${product.id}`}>
    <div className="product-image"><Image src={product.image} alt={product.name.en} fill sizes="(max-width: 767px) 50vw, 25vw" />{product.badge && <span className="badge">{product.badge}</span>}<button className="wish" aria-label={`Save ${product.name.en}`}><Heart /></button></div>
    <div className="product-body"><p className="product-brand">{product.brand}</p>    <h3><Link href={`/product/${product.slug}`}>{product.name.en}</Link></h3><div className="price-row"><strong>{formatBDT(product.price)}</strong>{product.compareAtPrice && <del>{formatBDT(product.compareAtPrice)}</del>}</div><p className={product.inStock ? 'stock' : 'out'}>{product.inStock ? 'In stock · ships in 1–2 days' : 'Out of stock'}</p><div className="card-actions"><button className="commerce-button" disabled={!product.inStock} onClick={() => addToCart(product)}><ShoppingBag />Add to cart</button></div></div>
  </article>
}
