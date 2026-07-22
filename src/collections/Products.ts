import type { CollectionConfig } from 'payload'
import { isStaff } from './Users'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sku', 'brand', 'price', 'stock', 'status'],
    components: {
      beforeList: ['/components/admin/product-csv-manager#ProductCSVManager'],
    },
  },
  access: {
    create: isStaff,
    read: () => true,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    { name: 'slug', type: 'text', unique: true, index: true, required: true },
    { name: 'description', type: 'richText', localized: true },
    { name: 'brand', type: 'relationship', relationTo: 'brands', required: true },
    { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true },
    { name: 'petTypes', type: 'select', hasMany: true, options: ['Cat', 'Dog', 'Bird', 'Rabbit', 'Fish', 'Small pets', 'Reptile'] },
    { name: 'images', type: 'relationship', relationTo: 'media', hasMany: true, required: true },
    { name: 'price', type: 'number', min: 0, required: true },
    {
      name: 'weightGrams',
      type: 'number',
      min: 1,
      required: true,
      admin: { description: 'Shipping weight for one unit, in grams' },
    },
    { name: 'compareAtPrice', type: 'number', min: 0 },
    { name: 'sku', type: 'text', unique: true, index: true, required: true },
    { name: 'stock', type: 'number', min: 0, defaultValue: 0, required: true },
    { name: 'status', type: 'select', defaultValue: 'draft', options: ['draft', 'active', 'archived'] },
    {
      name: 'variants',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', localized: true },
        { name: 'sku', type: 'text' },
        { name: 'price', type: 'number' },
        { name: 'stock', type: 'number' },
      ],
    },
    {
      name: 'details',
      type: 'group',
      fields: [
        { name: 'ingredients', type: 'richText', localized: true },
        { name: 'usage', type: 'richText', localized: true },
        { name: 'storage', type: 'richText', localized: true },
        { name: 'origin', type: 'text' },
        { name: 'prescriptionRequired', type: 'checkbox', defaultValue: false },
        { name: 'safetyNote', type: 'textarea', localized: true },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'image', type: 'relationship', relationTo: 'media' },
        { name: 'canonical', type: 'text' },
      ],
    },
  ],
}
