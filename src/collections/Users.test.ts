import { describe, expect, it } from 'vitest'
import { Customers, Users } from './Users'

const fieldNames = (fields: typeof Users.fields) => fields.map((field) => 'name' in field ? field.name : '')

describe('Payload identity collections', () => {
  it('keeps admin users staff-only without customer profile fields', () => {
    expect(fieldNames(Users.fields)).toEqual(['role'])
    const role = Users.fields.find((field) => 'name' in field && field.name === 'role')
    expect(role && 'options' in role ? role.options : []).toEqual(['admin', 'editor'])
  })

  it('keeps storefront customer profiles out of the admin panel', () => {
    expect(Customers.admin && 'hidden' in Customers.admin ? Customers.admin.hidden : false).toBe(true)
    expect(fieldNames(Customers.fields)).toEqual([
      'firstName', 'lastName', 'phone', 'streetAddress', 'city', 'postalCode',
    ])
  })
})
