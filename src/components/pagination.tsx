'use client'

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

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
        <div className="pagination-size">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Items per page"
          >
            {[10, 20, 40, 60].map((size) => (
              <option key={size} value={size}>
                {size} Items
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pagination-size-chevron" aria-hidden="true" />
        </div>
      )}
    </nav>
  )
}
