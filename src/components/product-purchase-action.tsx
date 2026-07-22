'use client'

import type { Product } from '@/lib/commerce'
import { useStore } from './store-provider'

export function ProductPurchaseAction({ product }: { product: Product }) {
  const { addToCart } = useStore()
  return <div className="card-actions">
    <button
      type="button"
      className="primary-button"
      disabled={!product.inStock}
      onClick={() => addToCart(product)}
    >
      {product.inStock ? 'Add to cart' : 'Out of stock'}
    </button>
  </div>
}
