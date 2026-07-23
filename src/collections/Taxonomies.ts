import type { CollectionConfig } from 'payload'
import { isStaff } from './Users'

// Public read (storefront taxonomy), staff-only writes. Never rely on Payload's
// default access: it allows any authenticated user, including customers.
const shared = (slug: string): CollectionConfig => ({
  slug,
  access: { create: isStaff, read: () => true, update: isStaff, delete: isStaff },
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    { name: 'slug', type: 'text', unique: true, index: true, required: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
      ],
    },
  ],
})

export const Brands = shared('brands')
export const Categories = shared('categories')
