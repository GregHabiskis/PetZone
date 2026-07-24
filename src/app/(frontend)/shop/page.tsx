'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { Pagination } from '@/components/pagination'
import { brands } from '@/lib/brands'
import { filterProducts, formatBDT, normalizeCatalogFilters } from '@/lib/commerce'
import { products } from '@/lib/data'

const PAGE_SIZE_OPTIONS = [10, 20, 40, 60]
const DEFAULT_PAGE_SIZE = 20

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
  const filterBrands = ['All', ...brands]
  const pets = ['All', 'Cat', 'Dog', 'Bird', 'Rabbit', 'Fish']
  const visible = filterProducts(products, filters)

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = PAGE_SIZE_OPTIONS.includes(Number(searchParams.get('limit')))
    ? Number(searchParams.get('limit'))
    : DEFAULT_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(visible.length / limit))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * limit
  const paged = visible.slice(start, start + limit)

  function updateFilter(name: string, value: string, defaultValue = '') {
    const next = new URLSearchParams(searchParams.toString())
    if (!value || value === defaultValue) next.delete(name)
    else next.set(name, value)
    next.delete('page')
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function goToPage(n: number) {
    const next = new URLSearchParams(searchParams.toString())
    if (n <= 1) next.delete('page')
    else next.set('page', String(n))
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function setLimit(n: number) {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('page')
    if (n === DEFAULT_PAGE_SIZE) next.delete('limit')
    else next.set('limit', String(n))
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">SHOP</p>
          <h1>Everything your pet needs.</h1>
          <p>Search and filter authentic food, care, medicine and everyday essentials.</p>
        </div>
      </section>
      <section className="section shell">
        <div className="content-grid">
          <aside className="filters">
            <h3>Filter products</h3>
            <div className="field">
              <label htmlFor="brand-filter">Brand</label>
              <select
                id="brand-filter"
                value={filters.brand}
                onChange={(event) => updateFilter('brand', event.target.value, 'All')}
              >
                {filterBrands.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pet-filter">Pet</label>
              <select
                id="pet-filter"
                value={filters.pet}
                onChange={(event) => updateFilter('pet', event.target.value, 'All')}
              >
                {pets.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <fieldset className="price-filter">
              <legend>Price Range</legend>
              <div className="price-values">
                <output htmlFor="minimum-price">{formatBDT(filters.minPrice)}</output>
                <span>to</span>
                <output htmlFor="maximum-price">{formatBDT(filters.maxPrice)}</output>
              </div>
              <label htmlFor="minimum-price">Minimum price</label>
              <input
                id="minimum-price"
                type="range"
                min={filters.priceFloor}
                max={filters.priceCeiling}
                value={filters.minPrice}
                onChange={(event) =>
                  updateFilter(
                    'minPrice',
                    String(Math.min(Number(event.target.value), filters.maxPrice)),
                    String(filters.priceFloor),
                  )
                }
              />
              <label htmlFor="maximum-price">Maximum price</label>
              <input
                id="maximum-price"
                type="range"
                min={filters.priceFloor}
                max={filters.priceCeiling}
                value={filters.maxPrice}
                onChange={(event) =>
                  updateFilter(
                    'maxPrice',
                    String(Math.max(Number(event.target.value), filters.minPrice)),
                    String(filters.priceCeiling),
                  )
                }
              />
            </fieldset>
            <button className="clear-filters" type="button" onClick={() => router.replace(pathname, { scroll: false })}>
              Clear filters
            </button>
            <p aria-live="polite">{visible.length} results</p>
          </aside>
          <div>
            {paged.length > 0 ? (
              <div className="product-grid">
                {paged.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="empty-state">
                <h2>No Products Found</h2>
                <p>Try a broader search or clear your filters.</p>
              </div>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={limit}
              onPageChange={goToPage}
              onPageSizeChange={setLimit}
            />
          </div>
        </div>
      </section>
    </>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<section className="section shell" aria-busy="true">Loading products…</section>}>
      <ShopCatalog />
    </Suspense>
  )
}
