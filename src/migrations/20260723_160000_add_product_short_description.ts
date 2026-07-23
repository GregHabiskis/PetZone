import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'products_locales' AND column_name = 'short_description'
     ) THEN
       ALTER TABLE "products_locales" ADD COLUMN "short_description" varchar;
     END IF;
   END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     IF EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'products_locales' AND column_name = 'short_description'
     ) THEN
       ALTER TABLE "products_locales" DROP COLUMN "short_description";
     END IF;
   END $$;`)
}
