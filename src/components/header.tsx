'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu, Moon, ShoppingBag, Sun, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { products } from '@/lib/data'
import { useStore } from './store-provider'
import { CartDrawer } from './cart-drawer'
import { ProductSearch } from './product-search'

const nav = [
  ['Offer Zone', '/offer-zone'], ['Cat', '/shop?pet=Cat'], ['Dog', '/shop?pet=Dog'], ['Bird', '/shop?pet=Bird'], ['Rabbit', '/shop?pet=Rabbit'], ['Small Pet Food', '/shop?pet=Small'], ['Shop By Brands', '/brands'], ['Pet Pharmacy', '/pet-pharmacy'], ['Blog', '/blog'],
]

export function Header() {
  const { cart, locale, openCartDrawer, setLocale } = useStore()
  const [open, setOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const count = cart.reduce((total, item) => total + item.quantity, 0)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('petzone-theme')
    const dark = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    const frame = window.requestAnimationFrame(() => setIsDark(dark))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  function toggleTheme() {
    const dark = !isDark
    setIsDark(dark)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    window.localStorage.setItem('petzone-theme', dark ? 'dark' : 'light')
  }

  return <>
    <div className="trust-bar" data-od-id="trust-bar"><span>Fast delivery across Bangladesh</span><Link href="/track-order">Track order</Link><button className="theme-toggle" type="button" aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} aria-pressed={isDark} onClick={toggleTheme}>{isDark ? <Moon /> : <Sun />}<span>{isDark ? 'Dark' : 'Light'}</span></button><a href="https://wa.me/88001787101001">Help</a><button onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}>{locale === 'en' ? 'EN / বাংলা' : 'বাংলা / EN'}</button></div>
    <header className="site-header" data-od-id="site-header">
      <div className="header-main shell">
        <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button>
        <Link href="/" className="logo-link" data-od-id="header-logo"><Image src="/media/petzone-logo.png" alt="Pet Zone" width={180} height={90} priority /></Link>
        <ProductSearch products={products} locale={locale} />
        <div className="header-actions"><Link href="/account" aria-label="Account"><UserRound /><span>Account</span></Link><button className="header-cart-button" type="button" aria-label={`Cart with ${count} items`} onClick={openCartDrawer}><ShoppingBag /><span>Cart</span>{count > 0 && <b>{count}</b>}</button></div>
      </div>
      <nav className="desktop-nav" aria-label="Primary navigation" data-od-id="primary-navigation">{nav.map(([label, href]) => <Link key={label} href={href} className={label === 'Offer Zone' ? 'offer-link' : ''}>{label}</Link>)}</nav>
    </header>
    {open && <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation"><button className="icon-button menu-close" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>{nav.map(([label, href]) => <Link key={label} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</div>}
    <CartDrawer />
  </>
}
