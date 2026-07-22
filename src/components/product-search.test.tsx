import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { products } from '@/lib/data'
import { ProductSearch } from './product-search'

describe('ProductSearch', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('debounces previews until two characters and limits matching results', () => {
    vi.useFakeTimers()
    render(<ProductSearch products={products} />)
    const input = screen.getByRole('combobox', { name: 'Search products' })
    fireEvent.focus(input)

    fireEvent.change(input, { target: { value: 'c' } })
    act(() => vi.advanceTimersByTime(250))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'cat' } })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(200))

    expect(screen.getByRole('listbox', { name: 'Product suggestions' })).toBeInTheDocument()
    expect(screen.getAllByRole('option').length).toBeLessThanOrEqual(5)
    expect(screen.getByText('Royal Canin Regular Fit 32 Adult Cat Food')).toBeInTheDocument()
  })

  it('shows empty results for queries matching nothing', () => {
    vi.useFakeTimers()
    render(<ProductSearch products={products} />)
    const input = screen.getByRole('combobox', { name: 'Search products' })
    fireEvent.focus(input)

    fireEvent.change(input, { target: { value: 'zzzzz' } })
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByText('No products found')).toBeInTheDocument()
  })

  it('supports arrow selection, Enter navigation, Escape, and normal search submission', () => {
    vi.useFakeTimers()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    render(<ProductSearch products={products} />)
    const form = screen.getByRole('search')
    const input = screen.getByRole('combobox', { name: 'Search products' })
    fireEvent.focus(input)

    fireEvent.change(input, { target: { value: 'cat' } })
    act(() => vi.advanceTimersByTime(200))
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', 'product-search-option-royal-canin-fit')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(click).toHaveBeenCalledOnce()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'dog treats' } })
    const submit = new Event('submit', { bubbles: true, cancelable: true })
    form.dispatchEvent(submit)
    expect(submit.defaultPrevented).toBe(false)
    expect(form).toHaveAttribute('action', '/shop')
    expect(input).toHaveAttribute('name', 'q')
    click.mockRestore()
  })
})
