import type { Access, CollectionConfig, FieldAccess } from 'payload'

export const isStaff = ({ req: { user } }: Parameters<Access>[0]): boolean =>
  Boolean(user && ['admin', 'editor'].includes(String(user.role)))
const isStaffField: FieldAccess = ({ req: { user } }) =>
  Boolean(user && ['admin', 'editor'].includes(String(user.role)))

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
    loginWithUsername: { allowEmailLogin: true, requireEmail: false, requireUsername: true },
  },
  admin: { useAsTitle: 'phone', defaultColumns: ['firstName', 'lastName', 'phone', 'email', 'role'] },
  access: {
    admin: isStaff,
    create: () => true,
    read: ({ req: { user } }) => user?.role === 'admin' || (user ? { id: { equals: user.id } } : false),
    update: ({ req: { user } }) => user?.role === 'admin' || (user ? { id: { equals: user.id } } : false),
    delete: isStaff,
  },
  fields: [
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true, unique: true, index: true },
    { name: 'streetAddress', type: 'textarea', required: true },
    { name: 'city', type: 'text', required: true },
    { name: 'postalCode', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'customer',
      options: ['admin', 'editor', 'customer'],
      required: true,
      access: { create: isStaffField, update: isStaffField },
    },
  ],
}
