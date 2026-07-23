import type { Access, CollectionConfig } from 'payload'

const isStaff: Access = ({ req: { user } }) =>
  Boolean(user?.collection === 'users' && ['admin', 'editor'].includes(String(user.role)))

const ownReview: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.collection === 'users' && ['admin', 'editor'].includes(String(user.role))) return true
  return { customer: { equals: user.id } }
}

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: { useAsTitle: 'comment', defaultColumns: ['productSlug', 'customer', 'rating', 'comment'] },
  access: {
    // Reviews are created exclusively through /api/store/reviews, which pins the
    // customer server-side. REST creation is disabled so nobody can forge a
    // review under another customer's identity.
    create: () => false,
    read: () => true,
    update: ownReview,
    delete: isStaff,
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      index: true,
      access: { update: () => false },
    },
    { name: 'productSlug', type: 'text', required: true, index: true },
    { name: 'rating', type: 'number', min: 1, max: 5, required: true },
    { name: 'comment', type: 'textarea', required: true },
  ],
}
