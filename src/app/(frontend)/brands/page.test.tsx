import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} data-next-link="true" {...props}>{children}</a>,
}))

import BrandsPage from './page'

describe('BrandsPage', () => {
  it('uses client-side links with encoded brand filter destinations', () => {
    render(<BrandsPage />)

    expect(screen.getByRole('link', { name: 'Reflex Plus' })).toHaveAttribute('href', '/shop?brand=Reflex%20Plus')
    expect(screen.getAllByRole('link')).toHaveLength(108)
    expect(screen.getAllByRole('link').every((link) => link.dataset.nextLink === 'true')).toBe(true)
  })
})
