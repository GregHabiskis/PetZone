import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/current-user', () => ({ getCurrentUser: async () => ({ user: null }) }))
vi.mock('@/components/auth-forms', () => ({ LoginForm: () => <form aria-label="Login" /> }))
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }))

import CheckoutPage from './page'

describe('CheckoutPage guest card', () => {
  it('separates the new customer CTA with the reusable card action row', async () => {
    render(await CheckoutPage())
    expect(screen.getByRole('link', { name: 'Create customer account' }).parentElement).toHaveClass('card-actions')
  })
})
