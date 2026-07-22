'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { filterProducts, formatBDT, normalizeCatalogFilters } from '@/lib/commerce'
import { products } from '@/lib/data'

function ShopCatalog() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const filters = normalizeCatalogFilters(products, {
    query: searchParams.get('q'),
    brand: searchParams.get('brand'),
    pet: searchParams.get('pet'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
  })
  const brands = ['All', ...Array.from(new Set(products.map((product) => product.brand)))]
  const pets = ['All', 'Cat', 'Dog', 'Bird', 'Rabbit', 'Fish', 'Small pets', 'Reptile']
  const visible = filterProducts(products, filters)

  function updateFilter(name: string, value: string, defaultValue = '') {
    const next = new URLSearchParams(searchParams.toString())
    if (!value || value === defaultValue) next.delete(name)
    else next.set(name, value)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return <><section className="page-hero"><div className="shell"><p className="eyebrow">SHOP</p><h1>Everything your pet needs.</h1><p>Search and filter authentic food, care, medicine and everyday essentials.</p></div></section><section className="section shell"><div className="content-grid"><aside className="filters"><h3>Filter products</h3><div className="field"><label htmlFor="catalog-search">Search</label><input id="catalog-search" value={filters.query} onChange={(event) => updateFilter('q', event.target.value)} placeholder="Product, pet or brand" /></div><div className="field"><label htmlFor="brand-filter">Brand</label><select id="brand-filter" value={filters.brand} onChange={(event) => updateFilter('brand', event.target.value, 'All')}>{brands.map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label htmlFor="pet-filter">Pet</label><select id="pet-filter" value={filters.pet} onChange={(event) => updateFilter('pet', event.target.value, 'All')}>{pets.map((item) => <option key={item}>{item}</option>)}</select></div><fieldset className="price-filter"><legend>Price Range</legend><div className="price-values"><output htmlFor="minimum-price">{formatBDT(filters.minPrice)}</output><span>to</span><output htmlFor="maximum-price">{formatBDT(filters.maxPrice)}</output></div><label htmlFor="minimum-price">Minimum price</label><input id="minimum-price" type="range" min={filters.priceFloor} max={filters.priceCeiling} value={filters.minPrice} onChange={(event) => updateFilter('minPrice', String(Math.min(Number(event.target.value), filters.maxPrice)), String(filters.priceFloor))} /><label htmlFor="maximum-price">Maximum price</label><input id="maximum-price" type="range" min={filters.priceFloor} max={filters.priceCeiling} value={filters.maxPrice} onChange={(event) => updateFilter('maxPrice', String(Math.max(Number(event.target.value), filters.minPrice)), String(filters.priceCeiling))} /></fieldset><button className="clear-filters" type="button" onClick={() => router.replace(pathname, { scroll: false })}>Clear filters</button><p aria-live="polite">{visible.length} results</p></aside><div>{visible.length > 0 ? <div className="product-grid">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No Products Found</h2><p>Try a broader search or clear your filters.</p></div>}</div></div></section></>
}

export default function ShopPage() {
  return <Suspense fallback={<section className="section shell" aria-busy="true">Loading products…</section>}><ShopCatalog /></Suspense>
}
