import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => mocks }))

import { RegistrationForm } from './registration-form'

describe('RegistrationForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('automatically signs new accounts into the customers collection', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ username: '01712345678' }), { status: 201 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<RegistrationForm />)

    const values: Record<string, string> = {
      firstName: 'Greg', lastName: 'Habiskis', streetAddress: '123 Test Road', city: 'Dhaka',
      postalCode: '1207', phone: '01712345678', email: 'greg@example.com', password: 'password123',
    }
    for (const [name, value] of Object.entries(values)) {
      fireEvent.change(document.querySelector(`[name="${name}"]`)!, { target: { value } })
    }
    fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form')!)

    await waitFor(() => expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/customers/login',
      expect.any(Object),
    ))
  })
})
