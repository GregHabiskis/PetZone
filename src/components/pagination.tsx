'use client'

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = [1]
  if (current > 3) pages.push('ellipsis')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)
  return pages
}

const PAGE_SIZES = [10, 20, 40, 60]

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}) {
  const [sizeOpen, setSizeOpen] = useState(false)
  const sizeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sizeRef.current && !sizeRef.current.contains(e.target as Node)) {
        setSizeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (totalPages <= 1 && !onPageSizeChange) return null

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <nav className="pagination" aria-label="Product pagination">
      <div className="pagination-controls">
        {totalPages > 1 && (
          <>
            <button
              className="pagination-prev-next"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <div className="pagination-pages">
              {pages.map((page, i) =>
                page === 'ellipsis' ? (
                  <span key={`e${i}`} className="pagination-ellipsis" aria-hidden="true">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    className={`pagination-page${page === currentPage ? ' active' : ''}`}
                    onClick={() => onPageChange(page)}
                    aria-label={`Page ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              className="pagination-prev-next"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Next page"
            >
              Next
              <ChevronRight size={17} />
            </button>
          </>
        )}
      </div>

      {onPageSizeChange && (
        <div className="pagination-size" ref={sizeRef}>
          <button
            type="button"
            className="pagination-size-trigger"
            onClick={() => setSizeOpen(!sizeOpen)}
            aria-haspopup="listbox"
            aria-expanded={sizeOpen}
            aria-label="Items per page"
          >
            <span>{pageSize} Items</span>
            <ChevronDown size={16} className={`pagination-size-chevron${sizeOpen ? ' open' : ''}`} />
          </button>
          {sizeOpen && (
            <ul className="pagination-size-dropdown" role="listbox" aria-label="Items per page">
              {PAGE_SIZES.map((size) => (
                <li
                  key={size}
                  role="option"
                  aria-selected={size === pageSize}
                  className={`pagination-size-option${size === pageSize ? ' selected' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onPageSizeChange(size)
                    setSizeOpen(false)
                  }}
                >
                  {size} Items
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </nav>
  )
}
