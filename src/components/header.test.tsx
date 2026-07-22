import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const setLocale = vi.fn()
vi.mock('./store-provider', () => ({
  useStore: () => ({ cart: [], locale: 'en', openCartDrawer: vi.fn(), setLocale }),
}))
vi.mock('./cart-drawer', () => ({ CartDrawer: () => null }))
vi.mock('next/image', () => ({ default: ({ alt }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => <span role="img" aria-label={alt} /> }))
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }))

import { Header } from './header'

const labels = ['Offer Zone', 'Cat', 'Dog', 'Bird', 'Rabbit', 'Small Pet Food', 'Shop By Brands', 'Pet Pharmacy', 'Blog']
const hrefs = ['/offer-zone', '/shop?pet=Cat', '/shop?pet=Dog', '/shop?pet=Bird', '/shop?pet=Rabbit', '/shop?pet=Small', '/brands', '/pet-pharmacy', '/blog']

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1 })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('keeps the exact menu order and identical desktop/mobile destinations', () => {
    render(<Header />)
    const desktop = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(desktop).getAllByRole('link').map((link) => link.textContent)).toEqual(labels)
    expect(within(desktop).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(hrefs)

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const mobile = screen.getByRole('dialog', { name: 'Navigation' })
    expect(within(mobile).getAllByRole('link').map((link) => link.textContent)).toEqual(labels)
    expect(within(mobile).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(hrefs)
  })

  it('places the theme pill immediately before Help and outside header actions', async () => {
    localStorage.setItem('petzone-theme', 'dark')
    const { container } = render(<Header />)

    const help = screen.getByRole('link', { name: 'Help' })
    const toggle = await screen.findByRole('button', { name: 'Switch to light mode' })
    expect(help.previousElementSibling).toBe(toggle)
    expect(toggle).toHaveTextContent('Dark')
    expect(container.querySelector('.header-actions .theme-toggle')).toBeNull()

    fireEvent.click(toggle)
    await waitFor(() => expect(toggle).toHaveTextContent('Light'))
    expect(localStorage.getItem('petzone-theme')).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('renders the predictive search in the main header', () => {
    render(<Header />)
    expect(screen.getByRole('combobox', { name: 'Search products' })).toHaveAttribute('aria-autocomplete', 'list')
  })
})
