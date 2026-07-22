import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { getCustomerFromHeaders } from './customer-session'

export async function getCurrentUser() {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const user = await getCustomerFromHeaders(payload, requestHeaders)
  return { payload, user }
}
