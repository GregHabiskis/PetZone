import type { Access, CollectionConfig, FieldAccess } from 'payload'

export const isStaff = ({ req: { user } }: Parameters<Access>[0]): boolean =>
  Boolean(user?.collection === 'users' && ['admin', 'editor'].includes(String(user.role)))
// Only admins may grant or change roles — editors must never self-promote.
const isAdminField: FieldAccess = ({ req: { user } }) =>
  Boolean(user?.collection === 'users' && user.role === 'admin')

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
    loginWithUsername: { allowEmailLogin: true, requireEmail: false, requireUsername: true },
  },
  admin: { useAsTitle: 'username', defaultColumns: ['username', 'email', 'role'] },
  access: {
    admin: isStaff,
    create: isStaff,
    read: ({ req: { user } }) => user?.collection === 'users' && (user.role === 'admin' || { id: { equals: user.id } }),
    update: ({ req: { user } }) => user?.collection === 'users' && (user.role === 'admin' || { id: { equals: user.id } }),
    delete: isStaff,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      options: ['admin', 'editor'],
      required: true,
      access: { create: isAdminField, update: isAdminField },
    },
  ],
}

const ownCustomer: Access = ({ req: { user } }) => {
  if (user?.collection === 'users' && ['admin', 'editor'].includes(String(user.role))) return true
  return user?.collection === 'customers' ? { id: { equals: user.id } } : false
}

export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: {
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
    loginWithUsername: { allowEmailLogin: true, requireEmail: false, requireUsername: true },
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
  },
  admin: { hidden: true, useAsTitle: 'phone', defaultColumns: ['firstName', 'lastName', 'phone', 'email'] },
  access: {
    admin: () => false,
    create: () => false,
    read: ownCustomer,
    update: ownCustomer,
    delete: ownCustomer,
  },
  fields: [
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true, unique: true, index: true },
    { name: 'streetAddress', type: 'textarea', required: true },
    { name: 'city', type: 'text', required: true },
    { name: 'postalCode', type: 'text', required: true },
  ],
}
