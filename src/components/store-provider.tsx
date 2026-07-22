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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const openCartDrawer = useCallback(() => setCartDrawerOpen(true), [])
  const closeCartDrawer = useCallback(() => setCartDrawerOpen(false), [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedCart = localStorage.getItem('petzone-cart')
      if (storedCart) {
        try { setCart(JSON.parse(storedCart) as CartItem[]) } catch { localStorage.removeItem('petzone-cart') }
      }
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => { localStorage.setItem('petzone-cart', JSON.stringify(cart)) }, [cart])

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
