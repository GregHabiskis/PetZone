'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { addCartItem, type CartItem, type Product } from '@/lib/commerce'

type StoreContextValue = {
  cart: CartItem[]
  cartDrawerOpen: boolean
  openCartDrawer: () => void
  closeCartDrawer: () => void
  addToCart: (product: Product) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

const CART_STORAGE_KEY = 'petzone-cart-v1'

/** Persisted cart data is untrusted input — validate the shape before rendering. */
function sanitizeCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== 'object') return null
  const item = value as { product?: unknown; quantity?: unknown }
  const product = item.product as Partial<Product> | undefined
  if (!product || typeof product !== 'object') return null
  if (typeof product.id !== 'string' || typeof product.slug !== 'string') return null
  if (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0) return null
  if (typeof product.weightGrams !== 'number' || !Number.isFinite(product.weightGrams) || product.weightGrams < 0) return null
  if (!product.name || typeof product.name !== 'object' || typeof product.name.en !== 'string') return null
  if (typeof product.brand !== 'string' || typeof product.category !== 'string') return null
  const quantity = Number(item.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null
  return { product: product as Product, quantity }
}

function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(sanitizeCartItem).filter((item): item is CartItem => item !== null)
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY)
    return []
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  // The restore read must complete before any write, or the empty initial
  // state overwrites the persisted cart on every page load.
  const [hydrated, setHydrated] = useState(false)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const openCartDrawer = useCallback(() => setCartDrawerOpen(true), [])
  const closeCartDrawer = useCallback(() => setCartDrawerOpen(false), [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCart(readStoredCart())
      setHydrated(true)
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart, hydrated])

  const value = useMemo<StoreContextValue>(() => ({
    cart,
    cartDrawerOpen,
    openCartDrawer,
    closeCartDrawer,
    addToCart: (product) => {
      if (!product.inStock) return
      setCart((items) => addCartItem(items, product))
      setCartDrawerOpen(true)
    },
    updateQuantity: (id, quantity) => setCart((items) => quantity < 1 ? items.filter((item) => item.product.id !== id) : items.map((item) => item.product.id === id ? { ...item, quantity } : item)),
    clearCart: () => setCart([]),
  }), [cart, cartDrawerOpen, closeCartDrawer, openCartDrawer])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}
