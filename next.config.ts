import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: { formats: ['image/avif', 'image/webp'] },
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
