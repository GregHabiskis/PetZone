import type { Access, CollectionConfig } from 'payload'
import { isStaff } from './Users'

// Public readers only ever see published documents; staff see drafts too.
// Without this, Payload's default access would let any authenticated user
// (including storefront customers) rewrite or delete site content.
const publishedRead: Access = ({ req: { user } }) => {
  if (user?.collection === 'users') return true
  return { _status: { equals: 'published' } }
}

const contentAccess = { create: isStaff, read: publishedRead, update: isStaff, delete: isStaff }

const seo = {
  name: 'seo',
  type: 'group' as const,
  fields: [
    { name: 'title', type: 'text' as const, localized: true },
    { name: 'description', type: 'textarea' as const, localized: true },
    { name: 'image', type: 'relationship' as const, relationTo: 'media' as const },
    { name: 'canonical', type: 'text' as const },
    { name: 'noIndex', type: 'checkbox' as const },
  ],
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: contentAccess,
  versions: { drafts: true },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'slug', type: 'text', unique: true, index: true, required: true },
    { name: 'heroImage', type: 'relationship', relationTo: 'media' },
    { name: 'content', type: 'richText', localized: true, admin: { style: { minHeight: '500px' } } },
    seo,
  ],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: contentAccess,
  versions: { drafts: true },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'publishedAt', '_status'] },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'slug', type: 'text', unique: true, index: true, required: true },
    { name: 'excerpt', type: 'textarea', localized: true },
    { name: 'content', type: 'richText', localized: true, admin: { style: { minHeight: '500px' } } },
    { name: 'contentHtml', type: 'code', admin: { description: 'Optional raw HTML — overrides the rich text content when filled. Must be sanitized before any frontend rendering.' } },
    { name: 'featuredImage', type: 'relationship', relationTo: 'media' },
    { name: 'publishedAt', type: 'date' },
    seo,
  ],
}
