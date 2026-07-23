# Supabase setup for PetZone

Project: `sqwmabfgiofwtzbylmlg`  
Project URL: `https://sqwmabfgiofwtzbylmlg.supabase.co`

## What is already configured

- Supabase MCP access is working; no additional MCP authorization is required.
- The Storage bucket exists, is public for storefront delivery, allows image MIME types only, and limits files to 15 MB.
- `pg_trgm` and `unaccent` are enabled.
- The initial Payload migration was generated at `src/migrations/20260721_180500.ts`.
- An unsafe public execute permission on `public.rls_auto_enable()` was revoked.

## Database and Storage credentials

The database Session Pooler URI and Supabase Storage S3 credentials are configured locally in `.env.local`. Keep this file private and never commit or share its values.

Payload uses Supabase Storage's S3-compatible API with endpoint, region, bucket, and access-key configured in env vars.

## Migration status

Payload migration `20260721_180500` was applied successfully to Supabase project `sqwmabfgiofwtzbylmlg` as batch 1. The generated schema contains the Payload collections, localized tables, authentication sessions, orders, appointments, globals, and migration metadata.

For future schema changes, generate and apply a new migration, then run the quality gates:

```bash
cd /home/jimmy/Projects/PetZone
pnpm payload migrate:create
pnpm payload migrate
pnpm payload:generate
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Production should use Node 20 or 22. The current verification pass used Node 22, within the supported engine range declared in `package.json`.

## First administrator

After the migration and first start:

1. Open `/admin`.
2. Create the first administrator.
3. Use a unique email and phone number.
4. Confirm the role is `admin` before adding customers.

Customer registration is handled by `/register`; it always creates role `customer` and cannot set staff roles.

## Security model

- Payload email/phone login with secure HTTP-only cookies.
- Email is optional; phone is normalized as the required username.
- Guest checkout and guest order tracking are disabled.
- Orders and appointments are bound to the authenticated customer.
- Checkout prices, shipping, bKash fee, and totals are recalculated server-side.
- Terms and Privacy acceptance timestamps are stored on every order.
- S3 keys and database credentials stay server-side only.
