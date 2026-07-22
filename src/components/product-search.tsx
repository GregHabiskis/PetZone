'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { formatBDT, type Product } from '@/lib/commerce'

type ProductSearchProps = {
  products: Product[]
}

const DEBOUNCE_MS = 200
const MAX_RESULTS = 5

export function ProductSearch({ products }: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query])

  const results = useMemo(() => {
    if (debouncedQuery.length < 2) return []
    const needle = debouncedQuery.toLocaleLowerCase()
    return products.filter((product) => [
      product.name.en,
      product.name.bn,
      product.brand,
      product.category,
    ].some((value) => value.toLocaleLowerCase().includes(needle))).slice(0, MAX_RESULTS)
  }, [debouncedQuery, products])

  const showPanel = focused && !dismissed && debouncedQuery.length >= 2
  const activeProduct = activeIndex >= 0 ? results[activeIndex] : undefined

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setDismissed(true)
      setActiveIndex(-1)
      return
    }
    if (!showPanel || results.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => index <= 0 ? results.length - 1 : index - 1)
    } else if (event.key === 'Enter' && activeProduct) {
      event.preventDefault()
      document.querySelector<HTMLAnchorElement>(`#product-search-option-${activeProduct.id} a`)?.click()
    }
  }

  return <form className="header-search product-search" action="/shop" role="search" data-od-id="global-search">
    <Search aria-hidden="true" />
    <input
      name="q"
      value={query}
      role="combobox"
      aria-label="Search products"
      aria-autocomplete="list"
      aria-controls="product-search-results"
      aria-expanded={showPanel}
      aria-activedescendant={activeProduct ? `product-search-option-${activeProduct.id}` : undefined}
      autoComplete="off"
      placeholder="Search food, medicine, toys or brands"
      onChange={(event) => {
        setQuery(event.target.value)
        setDismissed(false)
        setActiveIndex(-1)
      }}
      onFocus={() => {
        setFocused(true)
        setDismissed(false)
      }}
      onBlur={() => window.setTimeout(() => setFocused(false), 150)}
      onKeyDown={handleKeyDown}
    />
    {showPanel && <div className="product-search-panel">
      {results.length > 0 ? <ul id="product-search-results" role="listbox" aria-label="Product suggestions">
        {results.map((product, index) => <li
          id={`product-search-option-${product.id}`}
          role="option"
          aria-selected={index === activeIndex}
          className={index === activeIndex ? 'is-active' : ''}
          key={product.id}
        >
          <Link href={`/product/${product.slug}`} onMouseDown={(event) => event.preventDefault()}>
            <Image src={product.image} alt="" width={56} height={56} />
            <span><strong>{product.name.en}</strong><small>{product.brand}</small></span>
            <b>{formatBDT(product.price)}</b>
          </Link>
        </li>)}
      </ul> : <p className="product-search-empty">No products found</p>}
    </div>}
  </form>
}
