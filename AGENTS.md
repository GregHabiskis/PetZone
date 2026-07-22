# AGENTS.md — PetZone

## Product purpose

PetZone is a bilingual Bangladesh pet-commerce and care website. It combines product discovery, authenticated ordering, pharmacy/vet information, protected order history, and Payload CMS administration.

## Locked business and UX rules

- Guest checkout and guest order tracking are forbidden. Do not add bypasses.
- Checkout and order creation require a valid Payload-authenticated user from secure HTTP-only cookies.
- Every button and button-style CTA uses `#EE5F27` with white text. This brand choice has a documented 3.33:1 normal-text contrast tradeoff; retain bold labels and visible focus rings.
- Keep the exact primary menu labels and order in `src/components/header.tsx`.
- Preserve English/Bangla localization, PetZone palette, the white footer-logo squircle, responsive Vet Center image, WhatsApp widget, and Go to Top behavior.
- Coupon rules are managed in Payload. Clients never provide authoritative discount, shipping, fee, or order totals.
- Product CSV import/export is staff-only, SKU-based, validated before commit, and atomic. Product names are never destructive identifiers.

## Stack and runtime

- Next.js 16 App Router, React 19, strict TypeScript.
- Payload CMS 3 with `@payloadcms/db-postgres`.
- Supabase PostgreSQL and S3-compatible Supabase Storage.
- Tailwind/PostCSS plus the project CSS system in `src/app/globals.css`.
- Vitest + Testing Library.
- Required project runtime: Node `22.23.1`; package manager: pnpm.

Run all commands from `/home/jimmy/Projects/PetZone`:

```bash
node --version
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm payload:generate
pnpm exec payload migrate:status
pnpm exec payload migrate
pnpm build
pnpm start
pnpm smoke:routes
```

Cold development compilation can exceed 60 seconds. `scripts/smoke-routes.mjs` defaults to a 120-second request budget; override with `SMOKE_TIMEOUT_MS` and `SMOKE_BASE_URL` when needed.

## App Router map and boundaries

### Storefront

- `src/app/(frontend)/layout.tsx`: global storefront shell.
- `/`: landing page and merchandising.
- `/shop`: URL-driven catalog (`q`, `brand`, `pet`, `minPrice`, `maxPrice`).
- `/brands`: brand directory; links into `/shop?brand=...`.
- `/product/[slug]`: product detail and shared cart action.
- `/cart`: persisted client cart, quantity controls, totals, and relevant upsells.
- `/checkout`: authenticated checkout or account-required state.
- `/account`, `/orders`, `/track-order`: authenticated customer surfaces.
- `/register`: customer registration.
- `/offer-zone`, `/pet-pharmacy`, `/vet-care`, `/blog`, `/about`, and legal pages: content/service routes.

### Payload and APIs

- `/admin`: Payload Admin login/application.
- `/api/[...slug]`, `/api/graphql`: Payload API surfaces.
- `/api/health`: health probe.
- `/api/store/register`: customer registration.
- `/api/store/coupons/validate`: authenticated, server-authoritative coupon preview.
- `/api/store/orders`: authenticated, server-authoritative order creation.
- `/api/store/appointments`: appointment creation.
- `/api/admin/products/export`: staff-only UTF-8 CSV export.
- `/api/admin/products/import`: staff-only same-origin dry-run/commit CSV import.

### Component/data boundaries

- `src/components/store-provider.tsx` owns locale, cart persistence, quantities, and cart-drawer state.
- `src/components/cart-drawer.tsx` owns modal presentation/focus; it must not duplicate cart state.
- `src/lib/commerce.ts` owns catalog filtering, shipping, cart totals, and deterministic recommendations.
- `src/lib/coupons.ts` owns pure coupon/discount calculations; route handlers perform Payload lookup/auth/locking.
- `src/lib/product-csv.ts` owns the stable CSV schema, parser, serializer, row validation, and error CSV.
- `src/lib/admin-product-csv.ts` owns staff checks, relation resolution, dry-run planning, and transactional SKU upsert.
- Current storefront catalog/search previews use `src/lib/data.ts` static fixtures. Do not claim they are live CMS data until a Payload-backed catalog reader is implemented.

## Payload and Supabase

Collections are configured in `src/payload.config.ts`:

- `users`: auth, profile, roles (`customer`, `editor`, `admin`); only staff can access Payload Admin.
- `media`: uploads stored through Supabase's S3-compatible endpoint.
- `brands`, `categories`: localized taxonomy.
- `products`: localized product/SEO/details, variants, relationships, required unique SKU, stock/status.
- `pages`, `posts`: localized managed content.
- `orders`, `appointments`: authenticated commerce/service records.
- `coupons`: staff-managed rules; no public collection read.
- `site-settings`: global navigation/contact/SEO settings.

`postgresAdapter` uses `push: false`. Schema changes are migration-only. Never turn development schema push back on against the shared Supabase database.

Migrations live under `src/migrations/` and are registered by `src/migrations/index.ts`. After a schema change:

1. Change the Payload collection/global config.
2. Run `pnpm payload:generate`.
3. Create a named migration with `pnpm exec payload migrate:create <snake_case_name>`.
4. Inspect generated SQL and `down` behavior.
5. Check the target for incompatible/null data.
6. Apply with `pnpm exec payload migrate`.
7. Run `pnpm exec payload migrate:status` and Supabase security/performance advisors.

The coupon/order-snapshot and required-product-SKU migrations are applied to the current Supabase project. A former Payload `dev` schema-push record was reconciled before migration-driven mode was locked.

## Product CSV architecture

### Permissions and request security

- Payload authenticates the request. Never trust a role from JSON, form fields, headers, or CSV.
- Only `admin` and `editor` users may import/export.
- Import is POST-only and must pass same-origin validation against the request host and configured site origin.
- Do not log uploaded content, cookies, or secrets.

### Stable schema

The fixed column order is exported by `PRODUCT_CSV_HEADERS` in `src/lib/product-csv.ts`. It includes:

- identity/status: `sku`, `slug`, `status`;
- localized name and description;
- price, compare-at price, stock, and weight;
- brand/category IDs and pet types;
- existing media IDs only;
- validated `variants_json`;
- localized ingredient, usage, storage, safety, SEO title/description;
- origin, prescription flag, and canonical URL.

Relationship lists use `|`. Export is RFC 4180, CRLF, deterministic by SKU, UTF-8/Bangla-safe, and spreadsheet-formula-safe.

### Import/recovery workflow

1. Download a fresh export.
2. Edit without changing headers or SKU identity.
3. Select a `.csv` no larger than 2 MiB / 2,000 rows.
4. Validate. Review create/update/reject counts and row-level errors.
5. Download the error CSV if present; correct every error and validate again.
6. Import is enabled only for the exact validated file.
7. Commit performs SKU-based create/update in one Payload transaction with localized `en` and `bn` writes. Any failure rolls back the transaction.
8. Export again and compare supported fields for round-trip recovery.

Blank status defaults to `draft`. Unknown/ambiguous brand, category, or media references are rejected. The importer never auto-creates relationships and never downloads remote images.

## Authentication and forbidden flows

- Cookies are Payload-managed, HTTP-only, `SameSite=Lax`, and secure in production.
- Use `getCurrentUser()` for server-rendered storefront authentication.
- Order/history queries must be scoped to the authenticated user's ID even when server code uses `overrideAccess`.
- `/api/store/orders` must reject unauthenticated requests before reading cart/order data.
- Never add guest order IDs, email-only tracking, public coupon reads, or client-authoritative pricing.

## Commerce invariants

- Rebuild cart line prices and weights from the server catalog; ignore submitted prices/discounts/totals.
- Home-delivery shipping is calculated by total weight; local pickup is zero.
- Coupon discount applies to eligible merchandise before shipping.
- bKash fee is exactly `(discounted subtotal + shipping) × 1.85%`, rounded by the shared helper.
- Order creation re-fetches and locks a coupon when a usage cap applies, revalidates usage in the same transaction, and stores `coupon`, `couponCode`, and `couponDiscount` snapshots.
- Terms and privacy acceptance are required.
- Cart recommendations exclude cart IDs and out-of-stock products, rank same pet/category before same brand, are deterministic, unique, and capped.

## Cart and URL conventions

- Cart data is persisted under `petzone-cart-v1`; validate persisted IDs against the current product source.
- `addToCart` opens the global cart drawer for immediate feedback.
- Drawer dismissal supports close button, backdrop, Escape, and focus restoration; keep its focus trap and reduced-motion behavior.
- URL search parameters are the sole durable shop-filter state. Use `router.replace(..., { scroll: false })`, preserve unrelated parameters, and let refresh/back/forward reproduce the same results.
- The exact empty catalog message is `No Products Found`.

## Quality workflow

Use RED → GREEN → REFACTOR for behavior changes:

1. Add a focused failing test that expresses the requirement.
2. Confirm the failure for the expected reason.
3. Apply the smallest fix.
4. Run the focused test, then the full suite.
5. Refactor only while tests remain green.

Before deployment, run:

```bash
pnpm payload:generate
pnpm test
pnpm lint
pnpm typecheck
pnpm build
fallow audit --format json --quiet --base HEAD~1 2>/dev/null || true
```

Then run exactly one production server and verify `/api/health`, `/admin`, `/checkout`, `/cart`, `/shop`, and `/brands`. Do not leave multiple `next-server` processes competing for the same port.

## Environment variables

Names only; never commit or print values:

- `DATABASE_URI`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_STORAGE_BUCKET`
- `SUPABASE_S3_ACCESS_KEY_ID`
- `SUPABASE_S3_SECRET_ACCESS_KEY`
- `SUPABASE_S3_ENDPOINT`
- `SUPABASE_S3_REGION`
- `SMOKE_BASE_URL` (verification override)
- `SMOKE_TIMEOUT_MS` (verification override)

## Current implementation status and deferred work

Implemented: stable route smoke loop; migration-only Payload startup; cart drawer and upsells; checkout coupon UI and authoritative totals; coupon collection/order snapshots and applied migrations; URL catalog filters/price controls; predictive search; card action spacing; trust-bar theme toggle; staff-only transactional CSV UI/routes; generated Payload types/import map; design-system addendum.

Still deployment-dependent or intentionally deferred:

- Storefront products/search still use static fixtures rather than a live Payload catalog endpoint.
- Full authenticated browser order placement and Payload Admin CSV round-trip require valid local staff/customer credentials and controlled test records.
- Production responsive/browser verification must cover 360, 390, 430, 600, 768, 820, 1024, 1366, 1440, and 1920 px in light/dark mode.
- Supabase advisors contain legacy/public-schema informational warnings outside this change; review them before production hardening rather than deleting Payload-generated indexes blindly.
