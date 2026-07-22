import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const migrationPath = `${process.cwd()}/src/migrations/20260722_081625_move_customers_out_of_admin.ts`

describe('customer identity migration', () => {
  it('moves legacy customer identities before removing the customer role and user profile columns', async () => {
    const source = await readFile(migrationPath, 'utf8')
    const copyCustomers = source.indexOf('INSERT INTO "customers"')
    const removeCustomerRole = source.indexOf('DROP TYPE "public"."enum_users_role"')
    const dropProfileFields = source.indexOf('ALTER TABLE "users" DROP COLUMN "first_name"')
    const downStart = source.indexOf('export async function down')
    const dropCustomerForeignKey = source.indexOf(
      'ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk"',
      downStart,
    )
    const dropCustomersTable = source.indexOf('DROP TABLE "customers" CASCADE', downStart)

    expect(copyCustomers).toBeGreaterThan(0)
    expect(copyCustomers).toBeLessThan(removeCustomerRole)
    expect(source).toContain('INSERT INTO "customers_sessions"')
    expect(source).toContain(`DELETE FROM "users" WHERE "role" = 'customer'`)
    expect(removeCustomerRole).toBeLessThan(dropProfileFields)
    expect(dropCustomerForeignKey).toBeGreaterThan(downStart)
    expect(dropCustomerForeignKey).toBeLessThan(dropCustomersTable)
  })
})
