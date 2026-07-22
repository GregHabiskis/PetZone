import { describe, expect, it } from 'vitest'

import { CUSTOMER_SESSION_COOKIE } from '@/lib/customer-session'
import { POST } from './route'

describe('POST /api/store/logout', () => {
  it('expires the customer session cookie without touching the staff cookie', async () => {
    const response = await POST()
    expect(response.status).toBe(200)
    const cookie = response.headers.get('set-cookie') || ''
    expect(cookie).toContain(`${CUSTOMER_SESSION_COOKIE}=`)
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970')
    expect(cookie).not.toContain('payload-token')
  })
})
