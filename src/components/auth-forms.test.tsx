import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => mocks }))

import { LoginForm, LogoutButton } from './auth-forms'

describe('customer authentication forms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
  })

  it('signs storefront customers in through the customers auth collection', async () => {
    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText('Phone number or email'), { target: { value: '01712345678' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!)

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/store/login', expect.any(Object)))
  })

  it('signs storefront customers out through the customers auth collection', async () => {
    render(<LogoutButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/store/logout', expect.any(Object)))
  })
})
