import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export async function getCurrentUser() {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  return { payload, user: user?.collection === 'customers' ? user : null }
}
