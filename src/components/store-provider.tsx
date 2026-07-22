'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { addCartItem, type CartItem, type Product } from '@/lib/commerce'

type Locale = 'en' | 'bn'
type StoreContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
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
  const [locale, setLocaleState] = useState<Locale>('en')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const openCartDrawer = useCallback(() => setCartDrawerOpen(true), [])
  const closeCartDrawer = useCallback(() => setCartDrawerOpen(false), [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedLocale = localStorage.getItem('petzone-locale') as Locale | null
      const storedCart = localStorage.getItem('petzone-cart')
      if (storedLocale === 'bn' || storedLocale === 'en') setLocaleState(storedLocale)
      if (storedCart) {
        try { setCart(JSON.parse(storedCart) as CartItem[]) } catch { localStorage.removeItem('petzone-cart') }
      }
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => { localStorage.setItem('petzone-cart', JSON.stringify(cart)) }, [cart])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    localStorage.setItem('petzone-locale', next)
    document.documentElement.lang = next === 'bn' ? 'bn' : 'en'
  }

  const value = useMemo<StoreContextValue>(() => ({
    locale,
    setLocale,
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
  }), [cart, cartDrawerOpen, closeCartDrawer, locale, openCartDrawer])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}
