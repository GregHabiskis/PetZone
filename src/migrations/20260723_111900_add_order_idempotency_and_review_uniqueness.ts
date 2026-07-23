import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN "idempotency_key" varchar;

   CREATE UNIQUE INDEX "orders_idempotency_key_idx" ON "orders" USING btree ("idempotency_key");

   CREATE UNIQUE INDEX "reviews_customer_product_slug_unique" ON "reviews" USING btree ("customer_id", "product_slug");

   -- Drift reconciliation: the preferred_at → pet_weight rename was applied to
   -- the database out-of-band, so this is a no-op where pet_weight already
   -- exists and a proper rename on databases replaying migrations from scratch.
   DO $$ BEGIN
     IF EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'preferred_at'
     ) THEN
       ALTER TABLE "appointments" RENAME COLUMN "preferred_at" TO "pet_weight";
     END IF;
   END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "reviews_customer_product_slug_unique";

   DROP INDEX "orders_idempotency_key_idx";

   ALTER TABLE "orders" DROP COLUMN "idempotency_key";`)
  // The pet_weight reconciliation is intentionally not reversed: it predates
  // this migration and the current schema depends on it.
}
