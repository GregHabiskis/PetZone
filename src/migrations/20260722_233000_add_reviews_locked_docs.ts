import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reviews_id" integer;

   ALTER TABLE "payload_preferences_rels" ADD COLUMN "reviews_id" integer;

   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;

   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;

   CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");

   CREATE INDEX "payload_preferences_rels_reviews_id_idx" ON "payload_preferences_rels" USING btree ("reviews_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reviews_fk";

   ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_reviews_fk";

   DROP INDEX "payload_locked_documents_rels_reviews_id_idx";

   DROP INDEX "payload_preferences_rels_reviews_id_idx";

   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reviews_id";

   ALTER TABLE "payload_preferences_rels" DROP COLUMN "reviews_id";`)
}
