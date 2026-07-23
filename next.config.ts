import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
    : []),
]

const nextConfig: NextConfig = {
  // Netlify's OpenNext adapter does not support output:'standalone'.
  // Hostinger (production) needs it. NETLIFY=true is injected by the build environment.
  output: process.env.NETLIFY === 'true' ? undefined : 'standalone',
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async redirects() {
    return [
      { source: '/brand/:slug', destination: '/brands/:slug', permanent: true },
      { source: '/product-category/brands/:slug', destination: '/brands/:slug', permanent: true },
      { source: '/book-an-appointment', destination: '/vet-care', permanent: true },
      { source: '/booking', destination: '/vet-care', permanent: true },
      { source: '/my-account', destination: '/account', permanent: true },
    ]
  },
}

export default withPayload(nextConfig)
