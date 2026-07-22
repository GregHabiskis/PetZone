import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_coupons_discount_type" AS ENUM('percentage', 'fixed');
  CREATE TABLE "coupons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"active" boolean DEFAULT true NOT NULL,
  	"discount_type" "enum_coupons_discount_type" NOT NULL,
  	"discount_value" numeric NOT NULL,
  	"minimum_subtotal" numeric,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"usage_limit" numeric,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "coupons_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "coupons_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"categories_id" integer
  );
  
  ALTER TABLE "orders" ADD COLUMN "coupon_id" integer;
  ALTER TABLE "orders" ADD COLUMN "coupon_code" varchar;
  ALTER TABLE "orders" ADD COLUMN "coupon_discount" numeric DEFAULT 0 NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "coupons_id" integer;
  ALTER TABLE "coupons_locales" ADD CONSTRAINT "coupons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");
  CREATE INDEX "coupons_updated_at_idx" ON "coupons" USING btree ("updated_at");
  CREATE INDEX "coupons_created_at_idx" ON "coupons" USING btree ("created_at");
  CREATE UNIQUE INDEX "coupons_locales_locale_parent_id_unique" ON "coupons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "coupons_locales_parent_id_idx" ON "coupons_locales" USING btree ("_parent_id");
  CREATE INDEX "coupons_rels_order_idx" ON "coupons_rels" USING btree ("order");
  CREATE INDEX "coupons_rels_parent_idx" ON "coupons_rels" USING btree ("parent_id");
  CREATE INDEX "coupons_rels_path_idx" ON "coupons_rels" USING btree ("path");
  CREATE INDEX "coupons_rels_products_id_idx" ON "coupons_rels" USING btree ("products_id");
  CREATE INDEX "coupons_rels_categories_id_idx" ON "coupons_rels" USING btree ("categories_id");
  ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupons_fk" FOREIGN KEY ("coupons_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_coupon_idx" ON "orders" USING btree ("coupon_id");
  CREATE INDEX "payload_locked_documents_rels_coupons_id_idx" ON "payload_locked_documents_rels" USING btree ("coupons_id");
  ALTER TABLE "coupons" ADD CONSTRAINT "coupons_code_normalized_check" CHECK ("code" <> '' AND "code" = upper(btrim("code")));
  ALTER TABLE "coupons" ADD CONSTRAINT "coupons_discount_value_check" CHECK ("discount_value" >= 0 AND ("discount_type" <> 'percentage' OR "discount_value" <= 100));
  ALTER TABLE "coupons" ADD CONSTRAINT "coupons_minimum_subtotal_check" CHECK ("minimum_subtotal" IS NULL OR "minimum_subtotal" >= 0);
  ALTER TABLE "coupons" ADD CONSTRAINT "coupons_usage_limit_check" CHECK ("usage_limit" IS NULL OR "usage_limit" >= 1);
  ALTER TABLE "coupons" ADD CONSTRAINT "coupons_date_window_check" CHECK ("starts_at" IS NULL OR "ends_at" IS NULL OR "ends_at" >= "starts_at");
  ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "coupons_locales" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "coupons_rels" ENABLE ROW LEVEL SECURITY;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP CONSTRAINT "orders_coupon_id_coupons_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_coupons_fk";
  
  DROP INDEX "orders_coupon_idx";
  DROP INDEX "payload_locked_documents_rels_coupons_id_idx";
  DROP INDEX "coupons_locales_parent_id_idx";
  ALTER TABLE "orders" DROP COLUMN "coupon_id";
  ALTER TABLE "orders" DROP COLUMN "coupon_code";
  ALTER TABLE "orders" DROP COLUMN "coupon_discount";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "coupons_id";
  ALTER TABLE "coupons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coupons_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coupons_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "coupons_rels";
  DROP TABLE "coupons_locales";
  DROP TABLE "coupons";
  DROP TYPE "public"."enum_coupons_discount_type";`)
}
