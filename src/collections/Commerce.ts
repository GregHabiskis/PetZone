import type { Access, CollectionConfig } from 'payload'

const ownDocuments: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.collection === 'users' && ['admin', 'editor'].includes(String(user.role))) return true
  return { customer: { equals: user.id } }
}

const staffOnly: Access = ({ req: { user } }) =>
  Boolean(user?.collection === 'users' && ['admin', 'editor'].includes(String(user.role)))

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: { useAsTitle: 'orderNumber', defaultColumns: ['orderNumber', 'customer', 'status', 'paymentStatus', 'total'] },
  access: { create: () => false, read: ownDocuments, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'orderNumber', type: 'text', unique: true, index: true, required: true },
    { name: 'customer', type: 'relationship', relationTo: 'customers', required: true, index: true },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'streetAddress', type: 'textarea', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'postalCode', type: 'text', required: true },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products' },
        { name: 'productName', type: 'text', required: true },
        { name: 'sku', type: 'text' },
        { name: 'variant', type: 'text' },
        { name: 'quantity', type: 'number', min: 1, required: true },
        { name: 'unitPrice', type: 'number', min: 0, required: true },
        { name: 'unitWeightGrams', type: 'number', min: 0, required: true },
      ],
    },
    { name: 'subtotal', type: 'number', min: 0, required: true },
    { name: 'coupon', type: 'relationship', relationTo: 'coupons', index: true },
    { name: 'couponCode', type: 'text' },
    { name: 'couponDiscount', type: 'number', min: 0, defaultValue: 0, required: true },
    { name: 'totalWeightGrams', type: 'number', min: 0, required: true },
    { name: 'shippingMethod', type: 'select', options: ['home_delivery', 'local_pickup'], defaultValue: 'home_delivery', required: true },
    { name: 'shippingClass', type: 'select', options: ['Light Weight', 'Medium Weight', 'Heavy Weight', 'Very Heavy Weight', 'Local Pickup'], required: true },
    { name: 'shippingCost', type: 'number', min: 0, required: true },
    { name: 'paymentMethod', type: 'select', options: ['bkash', 'bank_transfer', 'cash_on_delivery'], defaultValue: 'bkash', required: true },
    { name: 'bkashNumber', type: 'text' },
    { name: 'bkashTransactionId', type: 'text' },
    { name: 'bkashFee', type: 'number', min: 0, defaultValue: 0, required: true },
    { name: 'total', type: 'number', min: 0, required: true },
    { name: 'termsAcceptedAt', type: 'date', required: true },
    { name: 'privacyAcceptedAt', type: 'date', required: true },
    { name: 'note', type: 'textarea' },
    { name: 'paymentStatus', type: 'select', options: ['pending', 'submitted', 'verified', 'failed', 'refunded'], defaultValue: 'pending', required: true },
    { name: 'status', type: 'select', options: ['received', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], defaultValue: 'received', required: true },
  ],
}

export const Appointments: CollectionConfig = {
  slug: 'appointments',
  admin: { useAsTitle: 'ownerName', defaultColumns: ['ownerName', 'petName', 'preferredAt', 'status'] },
  access: { create: () => false, read: ownDocuments, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'customer', type: 'relationship', relationTo: 'customers', required: true, index: true },
    { name: 'ownerName', type: 'text', required: true },
    { name: 'contact', type: 'text', required: true },
    { name: 'petName', type: 'text', required: true },
    { name: 'petType', type: 'select', options: ['Cat', 'Dog', 'Bird', 'Rabbit', 'Other'], required: true },
    { name: 'age', type: 'text' },
    { name: 'petWeight', type: 'text' },
    { name: 'reason', type: 'textarea', required: true },
    { name: 'attachment', type: 'relationship', relationTo: 'media' },
    { name: 'status', type: 'select', defaultValue: 'requested', options: ['requested', 'confirmed', 'completed', 'cancelled'], required: true },
  ],
}
