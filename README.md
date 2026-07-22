# PetZone

PetZone is a bilingual pet-commerce and veterinary-care application for Bangladesh. It combines a responsive Next.js storefront with Payload CMS administration, PostgreSQL/Supabase persistence, S3-compatible media storage, authenticated customer accounts, authoritative checkout calculations, coupons, and staff product CSV operations.

## Stack

- Next.js App Router, React, strict TypeScript, and Tailwind CSS
- Payload CMS v3
- PostgreSQL on Supabase
- Supabase S3-compatible Storage
- Vitest and Testing Library
- Node.js 20 or 22 and pnpm

## Local setup

```bash
cp .env.example .env.local
pnpm install
pnpm exec payload migrate
pnpm payload:generate
pnpm payload:seed
pnpm dev
```

Open:

- Storefront: <http://localhost:3000>
- Payload Admin: <http://localhost:3000/admin>

`pnpm payload:seed` idempotently creates the storefront fixture catalog in Payload so checkout prices, stock, SKU, weight, and coupon eligibility are server-authoritative.

## Quality gates

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm payload:generate
pnpm exec payload migrate:status
pnpm build
pnpm smoke:routes
```

## Production

The repository includes a multi-stage Node 22 `Dockerfile` and `compose.yml`. Configure the variables documented in `.env.production.example`; never commit `.env.local` or production credentials.

See [`AGENTS.md`](AGENTS.md) for architecture and development rules, and [`SUPABASE-SETUP.md`](SUPABASE-SETUP.md) for database and storage notes.
