import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor, HeadingFeature, BoldFeature, ItalicFeature, UnderlineFeature, StrikethroughFeature, InlineCodeFeature, OrderedListFeature, UnorderedListFeature, ChecklistFeature, LinkFeature, BlockquoteFeature, HorizontalRuleFeature, AlignFeature, IndentFeature, SubscriptFeature, SuperscriptFeature, FixedToolbarFeature, InlineToolbarFeature, UploadFeature, EXPERIMENTAL_TableFeature, lexicalHTMLField } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import nextEnv from '@next/env'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Customers, Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Brands, Categories } from './collections/Taxonomies'
import { Pages, Posts } from './collections/Content'
import { Orders, Appointments } from './collections/Commerce'
import { SiteSettings } from './globals/SiteSettings'
import { Coupons } from './collections/Coupons'
import { Reviews } from './collections/Reviews'
import { siteOrigins } from './lib/site-origins'

nextEnv.loadEnvConfig(process.cwd())

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'payload-media'
const s3AccessKey = process.env.SUPABASE_S3_ACCESS_KEY_ID
const s3SecretKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY
const siteURL = process.env.NEXT_PUBLIC_SITE_URL

if (!process.env.DATABASE_URI) throw new Error('DATABASE_URI is required')
if (!process.env.PAYLOAD_SECRET) throw new Error('PAYLOAD_SECRET is required')

export default buildConfig({
  serverURL: siteURL,
  // Allow both localhost and 127.0.0.1 when SITE_URL is either (see siteOrigins).
  csrf: siteOrigins(siteURL),
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    dependencies: {
      '@payloadcms/storage-s3/client#S3ClientUploadHandler': {
        type: 'function',
        path: '@payloadcms/storage-s3/client#S3ClientUploadHandler',
      },
    },
  },
  collections: [Users, Customers, Media, Brands, Categories, Products, Pages, Posts, Coupons, Orders, Appointments, Reviews],
  globals: [SiteSettings],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      InlineToolbarFeature(),
      AlignFeature(),
      IndentFeature(),
      EXPERIMENTAL_TableFeature(),
      ChecklistFeature(),
      SubscriptFeature(),
      SuperscriptFeature(),
    ],
  }),
  localization: {
    locales: [{ label: 'English', code: 'en' }, { label: 'বাংলা', code: 'bn' }],
    defaultLocale: 'en',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    push: false,
  }),
  sharp: sharp as unknown as NonNullable<import('payload').Config['sharp']>,
  plugins: [
    s3Storage({
      alwaysInsertFields: true,
      enabled: Boolean(s3AccessKey && s3SecretKey),
      bucket,
      collections: { media: { prefix: 'media' } },
      config: {
        endpoint: process.env.SUPABASE_S3_ENDPOINT,
        region: process.env.SUPABASE_S3_REGION || 'ap-northeast-1',
        forcePathStyle: true,
        credentials: s3AccessKey && s3SecretKey ? { accessKeyId: s3AccessKey, secretAccessKey: s3SecretKey } : undefined,
      },
    }),
  ],
})
