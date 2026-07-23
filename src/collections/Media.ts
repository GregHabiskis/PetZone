import type { CollectionConfig } from 'payload'
import { isStaff } from './Users'

export const Media: CollectionConfig = {
  slug: 'media',
  // Explicit access is mandatory: Payload's default is "any authenticated user",
  // which includes storefront customers and would let them upload arbitrary files.
  access: {
    create: isStaff,
    read: () => true,
    update: isStaff,
    delete: isStaff,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'],
    imageSizes: [
      { name: 'thumbnail', width: 480, height: 480, position: 'centre' },
      { name: 'card', width: 800, height: 800, position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, position: 'centre', formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', localized: true, required: true },
    { name: 'caption', type: 'textarea', localized: true },
  ],
}
