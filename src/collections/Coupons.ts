import type { Access, CollectionConfig, NumberFieldValidation } from 'payload'
import { normalizeCouponCode } from '@/lib/coupons'

const staffOnly: Access = ({ req: { user } }) => Boolean(user?.collection === 'users' && ['admin', 'editor'].includes(String(user.role)))
const validateDiscountValue: NumberFieldValidation = (value, { siblingData }) =>
  (siblingData as { discountType?: string }).discountType === 'percentage' && Number(value) > 100
    ? 'Percentage discounts cannot exceed 100.'
    : true

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  admin: { useAsTitle: 'code', defaultColumns: ['code', 'name', 'active', 'discountType', 'discountValue', 'endsAt'] },
  access: { create: staffOnly, read: staffOnly, update: staffOnly, delete: staffOnly },
  hooks: {
    beforeValidate: [({ data }) => {
      if (typeof data?.code === 'string') data.code = normalizeCouponCode(data.code)
      return data
    }],
  },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', localized: true, required: true },
    { name: 'active', type: 'checkbox', defaultValue: true, required: true },
    { name: 'discountType', type: 'select', options: ['percentage', 'fixed'], required: true },
    {
      name: 'discountValue',
      type: 'number',
      min: 0,
      required: true,
      validate: validateDiscountValue,
    },
    { name: 'minimumSubtotal', type: 'number', min: 0 },
    { name: 'startsAt', type: 'date' },
    { name: 'endsAt', type: 'date' },
    { name: 'usageLimit', type: 'number', min: 1 },
    { name: 'eligibleProducts', type: 'relationship', relationTo: 'products', hasMany: true },
    { name: 'eligibleCategories', type: 'relationship', relationTo: 'categories', hasMany: true },
    { name: 'notes', type: 'textarea' },
  ],
}
