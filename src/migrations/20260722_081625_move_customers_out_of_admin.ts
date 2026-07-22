import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "customers_sessions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "created_at" timestamp(3) with time zone,
    "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "customers" (
    "id" serial PRIMARY KEY NOT NULL,
    "first_name" varchar NOT NULL,
    "last_name" varchar NOT NULL,
    "phone" varchar NOT NULL,
    "street_address" varchar NOT NULL,
    "city" varchar NOT NULL,
    "postal_code" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "email" varchar,
    "username" varchar NOT NULL,
    "reset_password_token" varchar,
    "reset_password_expiration" timestamp(3) with time zone,
    "salt" varchar,
    "hash" varchar,
    "login_attempts" numeric DEFAULT 0,
    "lock_until" timestamp(3) with time zone
  );

  ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_users_id_fk";

  ALTER TABLE "appointments" DROP CONSTRAINT "appointments_customer_id_users_id_fk";

  INSERT INTO "customers" (
    "id", "first_name", "last_name", "phone", "street_address", "city", "postal_code",
    "updated_at", "created_at", "email", "username", "reset_password_token",
    "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until"
  )
  SELECT
    "id", "first_name", "last_name", "phone", "street_address", "city", "postal_code",
    "updated_at", "created_at", "email", "username", "reset_password_token",
    "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until"
  FROM "users"
  WHERE "role" = 'customer';

  INSERT INTO "customers_sessions" ("_order", "_parent_id", "id", "created_at", "expires_at")
  SELECT sessions."_order", sessions."_parent_id", sessions."id", sessions."created_at", sessions."expires_at"
  FROM "users_sessions" AS sessions
  INNER JOIN "users" ON "users"."id" = sessions."_parent_id"
  WHERE "users"."role" = 'customer';

  SELECT setval(
    pg_get_serial_sequence('customers', 'id'),
    COALESCE((SELECT MAX("id") FROM "customers"), 1),
    EXISTS(SELECT 1 FROM "customers")
  );

  DELETE FROM "users" WHERE "role" = 'customer';

  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP INDEX "users_phone_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customers_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "customers_id" integer;
  ALTER TABLE "customers_sessions" ADD CONSTRAINT "customers_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "customers_sessions_order_idx" ON "customers_sessions" USING btree ("_order");
  CREATE INDEX "customers_sessions_parent_id_idx" ON "customers_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE UNIQUE INDEX "customers_email_idx" ON "customers" USING btree ("email");
  CREATE UNIQUE INDEX "customers_username_idx" ON "customers" USING btree ("username");
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_preferences_rels_customers_id_idx" ON "payload_preferences_rels" USING btree ("customers_id");
  ALTER TABLE "users" DROP COLUMN "first_name";
  ALTER TABLE "users" DROP COLUMN "last_name";
  ALTER TABLE "users" DROP COLUMN "phone";
  ALTER TABLE "users" DROP COLUMN "street_address";
  ALTER TABLE "users" DROP COLUMN "city";
  ALTER TABLE "users" DROP COLUMN "postal_code";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_role" ADD VALUE 'customer';
  ALTER TABLE "customers_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk";

  ALTER TABLE "appointments" DROP CONSTRAINT "appointments_customer_id_customers_id_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customers_fk";

  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_customers_fk";

  DROP INDEX "payload_locked_documents_rels_customers_id_idx";
  DROP INDEX "payload_preferences_rels_customers_id_idx";
  DROP TABLE "customers_sessions" CASCADE;
  DROP TABLE "customers" CASCADE;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer';
  ALTER TABLE "users" ADD COLUMN "first_name" varchar NOT NULL;
  ALTER TABLE "users" ADD COLUMN "last_name" varchar NOT NULL;
  ALTER TABLE "users" ADD COLUMN "phone" varchar NOT NULL;
  ALTER TABLE "users" ADD COLUMN "street_address" varchar NOT NULL;
  ALTER TABLE "users" ADD COLUMN "city" varchar NOT NULL;
  ALTER TABLE "users" ADD COLUMN "postal_code" varchar NOT NULL;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "users_phone_idx" ON "users" USING btree ("phone");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "customers_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "customers_id";`)
}
