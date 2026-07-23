import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "public"."products_pet_types"
   WHERE "value" = 'Reptile';

   ALTER TYPE "public"."enum_products_pet_types" RENAME TO "enum_products_pet_types_old";
   CREATE TYPE "public"."enum_products_pet_types" AS ENUM('Cat', 'Dog', 'Bird', 'Rabbit', 'Fish');
   ALTER TABLE "public"."products_pet_types"
     ALTER COLUMN "value" TYPE "public"."enum_products_pet_types"
     USING "value"::text::"public"."enum_products_pet_types";
   DROP TYPE "public"."enum_products_pet_types_old";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_products_pet_types" RENAME TO "enum_products_pet_types_old";
   CREATE TYPE "public"."enum_products_pet_types" AS ENUM('Cat', 'Dog', 'Bird', 'Rabbit', 'Fish', 'Reptile');
   ALTER TABLE "public"."products_pet_types"
     ALTER COLUMN "value" TYPE "public"."enum_products_pet_types"
     USING "value"::text::"public"."enum_products_pet_types";
   DROP TYPE "public"."enum_products_pet_types_old";`)
}
