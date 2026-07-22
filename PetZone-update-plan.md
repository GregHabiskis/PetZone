# PetZone Cart, Checkout, Catalog, and Admin Fix Plan

> **For Hermes:** Execute this plan task-by-task with strict RED → GREEN → REFACTOR cycles and root-cause debugging before production changes.

**Goal:** Finish the requested PetZone storefront interactions and repairs: cart drawer, cart upsells, CMS coupons, checkout/admin recovery, functional URL-driven filtering, predictive search, improved card spacing, relocated theme toggle, Payload Admin CSV product import/export, updated design documentation, and a project `AGENTS.md`.

**Architecture:** Keep the existing Next.js App Router + Payload CMS v3 + Supabase/PostgreSQL stack. Extend the existing store context for cart-drawer state, make shop filters URL-driven and share one filtering/search model across header and catalog, validate coupons only on the server against Payload, and preserve authenticated-only checkout/order creation. Add a staff-only Payload Admin product CSV utility with schema validation, dry-run preview, SKU-based upsert, and round-trip export. Diagnose the `/checkout` and `/admin` failures on a clean single Node 22 process before changing their implementations.

**Tech stack:** Next.js 16, React 19, strict TypeScript, Payload CMS 3, PostgreSQL/Supabase, Tailwind/CSS, Vitest, Testing Library, Node.js 22.23.1, pnpm.

---

## Locked requirements

- Guest checkout and guest order tracking remain forbidden.
- Checkout requires Payload authentication and secure HTTP-only cookies.
- Every button retains `#EE5F27` with white text, including drawer, coupon, filter, and theme controls.
- The existing English/Bangla localization, PetZone palette, white footer logo squircle, responsive Vet Center image, WhatsApp widget, and Go to Top behavior remain intact.
- The exact header menu labels/order remain unchanged.
- Coupon values, limits, validity, and activation status are manageable in Payload CMS.
- Authorized staff can import and export products as UTF-8 CSV from Payload Admin; importing must never publish invalid rows or silently overwrite by product name.
- Update `/home/jimmy/Projects/0-PetZone-Website-Redesign/design.md` after implementation.
- Create `/home/jimmy/Projects/PetZone/AGENTS.md` with architecture, workflows, commands, invariants, and current progress.

## Current evidence from inspection

- `src/app/(frontend)/shop/page.tsx` initializes local `query` and `brand` state to empty/`All` and never reads URL search params. This explains why `/shop?brand=...`, `/shop?pet=...`, and menu/brand links do not filter.
- `src/lib/commerce.ts#filterProducts` currently accepts only `query` and `brand`; it has no pet/category or price-range support.
- Header search is a plain GET form and has no preview surface.
- The cart exists only as `/cart`; header cart currently navigates directly to that route.
- `Commerce.ts` has orders and appointments only; no coupon collection or immutable coupon snapshot exists on orders.
- The attached checkout screenshot shows the unauthenticated “New customer?” card with the CTA pressed directly against the preceding paragraph. The fix must apply systematically to card action zones, not just that one instance.
- `/checkout` rendered successfully once in the mounted browser, but both `/checkout` and `/admin` later timed out after the admin navigation attempt. Two long-lived `next-server` processes were active. Treat this as runtime evidence, not a proven root cause; reproduce on one clean Node 22 server and capture logs.

---

## User flows and screen behavior

### Header cart drawer

1. User clicks the header Cart control.
2. A right-side drawer slides in from right to left with a backdrop.
3. Drawer lists cart items, quantities, line totals, subtotal, and empty state.
4. Quantity changes and removals update the global cart immediately.
5. “Go to Cart” closes the drawer and navigates to `/cart`.
6. “Proceed to Checkout” closes the drawer and navigates to `/checkout`.
7. Escape, backdrop click, and close button dismiss the drawer; focus returns to the Cart control.

### Cart upsell

- `/cart` shows a “You may also need” section only when the cart is non-empty.
- Recommendations are relevant by category/pet first, then brand, exclude products already in the cart, exclude out-of-stock items, and are capped to a small deterministic set.
- Upsell cards reuse `ProductCard` and open the drawer/add to cart through the existing store behavior.

### Coupon checkout

1. Authenticated user enters a coupon on checkout.
2. Server validates normalized code, active state, date window, usage cap, minimum subtotal, and eligible products/categories if configured.
3. Checkout displays an explicit success/error result and recalculated totals.
4. Order creation revalidates the code server-side and stores an immutable coupon code/discount snapshot.
5. Coupon discount is applied before shipping; bKash 1.85% is calculated from the discounted subtotal plus shipping.

### Shop filtering and predictive search

- Shop initializes from `q`, `brand`, `pet`, `minPrice`, and `maxPrice` URL params.
- Brand and header menu links work on direct load, client navigation, refresh, and back/forward history.
- Price Range uses an accessible min/max slider bounded by the actual catalog prices and updates URL state.
- When the active query or filters return zero results, the catalog shows the exact empty-state message “No Products Found”.
- Header search shows keyboard-accessible product previews before Enter, with image, product name, brand, and price; selecting a preview opens the product page.
- Submitting the search still navigates to `/shop?q=...`.

### Payload Admin product CSV import/export

1. Authorized staff opens a Product CSV utility from Payload Admin.
2. Export downloads a UTF-8 CSV using a documented, stable column order and preserves English/Bangla localized fields.
3. Import accepts `.csv` only, parses safely, validates every row, and shows a dry-run summary before writing.
4. Rows are matched by non-empty SKU; existing SKUs update and new SKUs create products. Product names are never used as destructive identifiers.
5. Invalid rows are rejected with row number, field, and message; valid rows are not partially committed when the file contains errors.
6. Imported products default to `draft` unless the CSV explicitly contains a valid status and the current staff user is authorized.
7. Exported CSV can be imported back without losing supported product data.

---

## Implementation tasks

### Task 1 — Establish clean Node 22 reproduction loops

**Objective:** Isolate `/checkout` and `/admin` failures before editing either route.

**Inspect:**
- `package.json`
- `src/app/(frontend)/checkout/page.tsx`
- `src/lib/current-user.ts`
- `src/app/(payload)/layout.tsx`
- `src/app/(payload)/admin/[[...segments]]/page.tsx`
- `src/app/(payload)/admin/importMap.ts`
- `src/payload.config.ts`
- `.env.local` variable presence only; never print values.

**Steps:**
1. Stop only stale PetZone Next processes after confirming their working directory/port ownership.
2. Start exactly one Node `v22.23.1` development server with captured logs.
3. Add or run focused HTTP/browser probes for `/`, `/checkout`, `/admin`, and `/api/health` with timeouts.
4. Capture server stderr, browser console, network failure, response status, and first failing stack frame.
5. State ranked, falsifiable root-cause hypotheses; change one variable at a time.
6. Add a regression test or deterministic smoke script that is red for the confirmed fault.

**Acceptance:** One server process; `/checkout` and `/admin` failures are reproducible or both consistently respond; root cause is evidenced before any route fix.

### Task 2 — Repair Payload Admin and checkout loading

**Objective:** Make `/admin` reliably show the Payload login/admin UI and `/checkout` reliably render authenticated or login-required state.

**Likely files:**
- Modify only after Task 1 identifies the cause:
  - `src/app/(payload)/layout.tsx`
  - `src/app/(payload)/admin/[[...segments]]/page.tsx`
  - `src/app/(payload)/admin/importMap.ts`
  - `src/payload.config.ts`
  - `src/lib/current-user.ts`
  - `next.config.ts`
- Add: `tests/e2e/admin-checkout-smoke.*` or a focused `scripts/smoke-routes.*` if no browser test harness exists.

**Steps:**
1. Verify the regression loop fails for the confirmed reason.
2. Apply the smallest root-cause fix.
3. Regenerate Payload import map/types if config or admin components changed.
4. Verify unauthenticated checkout shows login + registration CTA; authenticated checkout shows delivery/payment form.
5. Verify `/admin` shows Payload login and authenticated admin navigation.

**Acceptance:** `/admin` and `/checkout` return 200 without hanging on repeated cold/warm loads; no console/server errors.

### Task 3 — Add cart drawer state and accessible animation

**Objective:** Convert the header Cart control into an accessible right-side drawer trigger.

**Files:**
- Modify: `src/components/store-provider.tsx`
- Modify: `src/components/header.tsx`
- Create: `src/components/cart-drawer.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/cart-drawer.test.tsx`

**RED tests:**
- Clicking Cart opens the drawer.
- Drawer exposes `role="dialog"`, modal semantics, accessible label, close button, focus behavior, Escape/backdrop dismissal.
- Items, quantities, line totals, subtotal, empty state, “Go to Cart,” and “Proceed to Checkout” render correctly.
- Reduced-motion mode removes sliding animation.

**Implementation notes:**
- Add `cartDrawerOpen`, `openCartDrawer`, and `closeCartDrawer` to store context.
- Change the header Cart from a direct link to a button while preserving count and accessible name.
- Use a fixed backdrop and `transform: translateX(100%) → translateX(0)` transition; lock body scroll only while open.
- Keep all drawer actions orange/white and touch targets at least 44px.

### Task 4 — Add relevant cart upsells

**Objective:** Recommend deterministic, relevant products on `/cart`.

**Files:**
- Modify: `src/lib/commerce.ts`
- Modify: `src/app/(frontend)/cart/page.tsx`
- Test: `src/lib/commerce.test.ts`

**RED tests:**
- Excludes cart items and out-of-stock items.
- Prioritizes same category/pet, then same brand.
- Returns no duplicates and respects the cap.

**Acceptance:** Non-empty cart shows relevant `ProductCard` recommendations; empty cart does not show upsells.

### Task 5 — Model coupons in Payload and migrate Supabase

**Objective:** Make coupon rules CMS-manageable and persist applied discounts safely.

**Files:**
- Create: `src/collections/Coupons.ts`
- Modify: `src/payload.config.ts`
- Modify: `src/collections/Commerce.ts`
- Modify: `src/payload-types.ts` via generator only
- Create: new timestamped file under `src/migrations/`
- Modify: `src/migrations/index.ts`

**Coupon fields:**
- `code` (uppercase normalized, unique, indexed)
- localized internal/display name if needed
- `active`
- `discountType`: `percentage | fixed`
- `discountValue`
- `minimumSubtotal`
- `startsAt`, `endsAt`
- optional `usageLimit`
- optional eligible product/category relationships
- internal notes

**Order snapshot fields:**
- `coupon` relationship (optional)
- `couponCode` text snapshot
- `couponDiscount` numeric snapshot

**Access:** Staff-only create/update/delete/read in admin; storefront validation goes through a server route/action, never direct public collection read.

**Migration:** Generate using Payload CLI under Node 22, inspect SQL, apply to `sqwmabfgiofwtzbylmlg`, verify tables/indexes/constraints, then run Supabase security/performance advisors.

### Task 6 — Implement server-authoritative coupon calculation

**Objective:** Validate and apply coupons without trusting client totals.

**Files:**
- Create: `src/lib/coupons.ts`
- Create: `src/lib/coupons.test.ts`
- Create: `src/app/api/store/coupons/validate/route.ts`
- Modify: `src/app/api/store/orders/route.ts`
- Modify: `src/lib/commerce.ts`

**RED tests:**
- Code normalization and not-found behavior.
- Inactive, not-yet-started, expired, usage-limit, minimum-subtotal, and eligibility failures.
- Percentage and fixed discounts cannot produce a negative subtotal.
- Order route revalidates coupon and ignores client-supplied discount values.
- bKash fee uses `(discounted subtotal + shipping) × 1.85%`.

**Acceptance:** API returns normalized coupon summary and recalculated totals; order persists the same server-calculated snapshot.

### Task 7 — Add checkout coupon UI and finish checkout resilience

**Objective:** Let authenticated users apply/remove coupons with explicit loading, success, and error states.

**Files:**
- Modify: `src/components/checkout-form.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/checkout-form.test.tsx`

**Behavior:**
- Coupon input + Apply button in order summary.
- Applied state shows code, discount, and Remove action.
- Changing cart contents invalidates/revalidates the coupon before order submission.
- Empty cart keeps Place Order disabled and offers a route back to shop/cart.
- Preserve terms/privacy requirements and authenticated-only checkout.

### Task 8 — Make shop filters URL-driven and add Price Range

**Objective:** Fix all brand/menu filtering and add an accessible price slider.

**Files:**
- Modify: `src/app/(frontend)/shop/page.tsx`
- Modify: `src/lib/commerce.ts`
- Modify: `src/lib/commerce.test.ts`
- Modify: `src/app/globals.css`

**RED tests:**
- `brand=Reflex Plus` filters correctly.
- `pet=Cat`, `Dog`, `Bird`, `Rabbit`, and `Small` filter correctly.
- `q` combines with brand/pet/price filters.
- Inclusive min/max price boundaries work.
- Invalid/out-of-range URL values normalize safely.
- Any zero-result filter combination renders the exact message `No Products Found` instead of an empty grid.

**Implementation notes:**
- Use `useSearchParams`, `useRouter`, and `usePathname`; initialize controls from URL and update via `router.replace` without scroll jumps.
- Extend `filterProducts` to `{ query, brand, pet, minPrice, maxPrice }`.
- Use actual catalog min/max values; provide visible numeric values and keyboard-operable range controls.
- Preserve query params when one filter changes; add a clear-filters action.

### Task 9 — Fix brand and menu navigation filtering

**Objective:** Ensure every existing link lands on a correctly filtered catalog.

**Files:**
- Modify: `src/app/(frontend)/brands/page.tsx`
- Verify/modify only if required: `src/components/header.tsx`
- Verify/modify only if required: `src/app/(frontend)/page.tsx`

**Steps:**
1. Replace raw brand anchors with Next `Link` while preserving encoded brand names.
2. Verify exact header menu labels/order remain unchanged.
3. Verify desktop and mobile nav share identical destinations.
4. Test direct load, click navigation, refresh, and browser back/forward.

### Task 10 — Add predictive product previews to header search

**Objective:** Show product previews before Enter without compromising normal search submission.

**Files:**
- Create: `src/components/product-search.tsx`
- Modify: `src/components/header.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/product-search.test.tsx`

**Behavior:**
- Debounced local/catalog lookup after 2 characters.
- Maximum 5 matching products with image, localized name, brand, and price.
- Arrow Up/Down, Enter, Escape, focus/blur, and `aria-activedescendant` support.
- Enter with no selected preview submits `/shop?q=...`.
- Empty state is concise; no previews for blank queries.

**Data note:** Use the current product source for this pass; structure the component so the source can be replaced by a Payload-backed search endpoint when catalog loading moves fully to CMS.

### Task 11 — Fix card content/action spacing globally

**Objective:** Add consistent breathing room between text blocks and CTAs without changing unrelated layout.

**Files:**
- Modify: `src/app/globals.css`
- Verify components: `src/app/(frontend)/checkout/page.tsx`, `src/components/product-card.tsx`, authentication cards, empty states, summary cards, and promotional cards.

**Rules:**
- Make card content wrappers flex columns with deliberate vertical gaps.
- Add a minimum 20–24px separation before action rows/CTAs.
- For product cards, let body copy grow and pin the commerce button to the bottom so card actions align.
- Do not add one-off margins to every button; define reusable `.card-actions`/structural rules.
- Specifically verify the attached “New customer?” checkout card no longer has the CTA touching the paragraph.

### Task 12 — Relocate and preserve the theme toggle

**Objective:** Place the pill-shaped mode toggle immediately left of “Help” in the trust bar.

**Files:**
- Modify: `src/components/header.tsx`
- Modify: `src/app/globals.css`

**Behavior:**
- Order: delivery/track content as currently designed, then theme toggle, then Help, then localization control, with exact responsive prioritization.
- Toggle shows icon + active mode name (`Light`/`Dark`) like the localization pill.
- Remove it from `.header-actions`; Account and Cart remain there.
- Persist mode in `localStorage`, respect initial system preference, and preserve dark token blending.

### Task 13 — Add staff-only product CSV import/export to Payload Admin

**Objective:** Give authorized staff a safe, reversible CSV workflow for bulk product maintenance.

**Files:**
- Modify: `src/collections/Products.ts`
- Modify: `src/payload.config.ts`
- Create: `src/components/admin/product-csv-manager.tsx`
- Create: `src/app/api/admin/products/export/route.ts`
- Create: `src/app/api/admin/products/import/route.ts`
- Create: `src/lib/product-csv.ts`
- Test: `src/lib/product-csv.test.ts`
- Test: `src/app/api/admin/products/product-csv-routes.test.ts`
- Regenerate: `src/app/(payload)/admin/importMap.ts`

**Stable CSV schema:**
- Identity/status: `sku`, `slug`, `status`.
- Localized content: `name_en`, `name_bn`, `description_en`, `description_bn`.
- Commerce: `price`, `compare_at_price`, `stock`, `weight_grams`.
- Taxonomy: `brand`, `categories`, `pet_types` using documented delimiter-separated values.
- Media: `image_ids` referencing existing Payload Media records; do not download arbitrary remote URLs during import.
- Variants: `variants_json`, validated against the existing variant shape.
- Details/SEO: localized ingredient, usage, storage, safety, title, and description columns plus `origin`, `prescription_required`, and `canonical`.

**RED tests:**
- Export uses fixed headers, RFC 4180 quoting, UTF-8/Bangla-safe content, and deterministic ordering.
- Import rejects wrong MIME/extension, oversized files, duplicate SKUs within the file, malformed CSV/JSON, unknown relations, invalid numbers/statuses, and spreadsheet-formula prefixes where applicable.
- Dry run performs zero writes and returns create/update/reject counts plus row-level errors.
- Commit mode uses SKU-based create/update in one transaction so a failing row cannot leave a partial import.
- Export → import round trip preserves every supported scalar, localized, relationship, media-ID, and variant field.
- Unauthenticated and non-staff requests return 401/403; CSRF/origin protection follows the existing authenticated admin pattern.

**Implementation notes:**
1. Inspect existing Payload user roles/access helpers and reuse them; never trust a client-supplied role.
2. Use a maintained CSV parser already in the dependency graph when available; otherwise add one small, audited dependency rather than hand-rolling CSV parsing.
3. Cap upload size and row count, parse on the server, normalize line endings/BOM, and never log CSV contents or secrets.
4. Resolve brands/categories/media by stable IDs or unambiguous names and report unknown/ambiguous values; do not silently create taxonomy or media.
5. Mount the manager as a Payload Admin custom view or Products collection action with Download CSV, Select CSV, Validate, and Import controls.
6. Return the failed-row report as downloadable CSV so staff can correct and retry.

**Acceptance:** A staff user can export products, validate a modified CSV, review the dry-run counts, import it, and export again with a lossless supported-field round trip; unauthorized users cannot reach either API.

### Task 14 — Update documentation and agent guide

**Objective:** Make the project conventions and final implementation state reusable.

**Files:**
- Modify: `/home/jimmy/Projects/0-PetZone-Website-Redesign/design.md`
- Create: `/home/jimmy/Projects/PetZone/AGENTS.md`

**`design.md` additions:**
- Cart drawer motion, overlay, focus, and reduced-motion rules.
- Coupon/discount presentation and status-message rules.
- Predictive search and price-range filter patterns.
- Product CSV admin workflow, supported columns, safe SKU-upsert behavior, dry-run/error-report rules, and file limits.
- Card content/action spacing standard.
- Theme toggle placement and pill treatment.
- Reaffirm orange/white button rule and document its known 3.33:1 normal-text contrast tradeoff.

**`AGENTS.md` sections:**
- Product purpose and locked business rules.
- Stack and Node 22/pnpm commands.
- App Router route map and component/data boundaries.
- Payload collections/globals, Supabase storage/database, migrations.
- Product CSV import/export architecture, schema, permissions, and recovery workflow.
- Authentication and forbidden guest flows.
- Shipping, payment, coupon, and bKash calculation invariants.
- Cart/store state and URL-filter conventions.
- Testing, build, lint, typecheck, Payload generation, migration workflow.
- Environment-variable names without secret values.
- Deployment preparation status and remaining deferred work.

### Task 15 — Full verification and responsive browser pass

**Objective:** Prove all fixes work together under Node 22.

**Automated gates:**
```bash
pnpm payload:generate
pnpm test
pnpm lint
pnpm typecheck
pnpm build
fallow audit --format json --quiet --base HEAD~1 2>/dev/null || true
```

**Runtime checks:**
- Start one production server under Node `v22.23.1`.
- Verify `/api/health`, `/admin`, `/checkout`, `/cart`, `/shop`, `/brands`.
- Register/login, add products, open/close drawer, alter quantities, use cart upsells, apply valid/invalid coupon, place an authenticated order, inspect persisted coupon snapshot, and track from protected order history.
- In `/admin`, export products, dry-run a valid and invalid CSV, verify row-level errors, import a controlled SKU update/create set, and confirm export/import round-trip fidelity.
- Verify `/shop?brand=Reflex%20Plus`, each pet menu link, query search, min/max prices, combined filters, refresh, and back/forward.
- Verify a known zero-result combination displays exactly `No Products Found` in both light and dark modes.
- Verify predictive search with mouse and keyboard.
- Verify theme persistence and toggle placement in both themes.

**Responsive widths:** 360, 390, 430, 600, 768, 820, 1024, 1366, 1440, 1920px.

**Visual gates:**
- No horizontal overflow, clipping, accidental overlap, or broken drawer at any width.
- Drawer remains usable on small screens and does not cover its close control.
- Product/card buttons have consistent spacing and aligned action zones.
- All buttons remain orange with white text.
- Dark mode covers drawer, search previews, filters, coupons, admin-independent storefront surfaces, and overlays.

**CMS/database gates:**
- Coupon create/edit/deactivate works in `/admin`.
- Product CSV import/export is visible only to staff; dry-run, atomic SKU upsert, failed-row report, Bangla text, variants, relationships, and media references are verified.
- Applied migration is recorded by Payload.
- Supabase security and performance advisors are reviewed after DDL.

---

## Likely file-change map

**Create**
- `/home/jimmy/Projects/PetZone/src/components/cart-drawer.tsx`
- `/home/jimmy/Projects/PetZone/src/components/product-search.tsx`
- `/home/jimmy/Projects/PetZone/src/collections/Coupons.ts`
- `/home/jimmy/Projects/PetZone/src/lib/coupons.ts`
- `/home/jimmy/Projects/PetZone/src/lib/coupons.test.ts`
- `/home/jimmy/Projects/PetZone/src/app/api/store/coupons/validate/route.ts`
- `/home/jimmy/Projects/PetZone/src/components/cart-drawer.test.tsx`
- `/home/jimmy/Projects/PetZone/src/components/product-search.test.tsx`
- `/home/jimmy/Projects/PetZone/src/components/checkout-form.test.tsx`
- `/home/jimmy/Projects/PetZone/src/components/admin/product-csv-manager.tsx`
- `/home/jimmy/Projects/PetZone/src/app/api/admin/products/export/route.ts`
- `/home/jimmy/Projects/PetZone/src/app/api/admin/products/import/route.ts`
- `/home/jimmy/Projects/PetZone/src/lib/product-csv.ts`
- `/home/jimmy/Projects/PetZone/src/lib/product-csv.test.ts`
- `/home/jimmy/Projects/PetZone/src/app/api/admin/products/product-csv-routes.test.ts`
- `/home/jimmy/Projects/PetZone/src/migrations/<timestamp>.ts`
- `/home/jimmy/Projects/PetZone/src/migrations/<timestamp>.json`
- `/home/jimmy/Projects/PetZone/AGENTS.md`

**Modify**
- `/home/jimmy/Projects/PetZone/src/components/header.tsx`
- `/home/jimmy/Projects/PetZone/src/components/store-provider.tsx`
- `/home/jimmy/Projects/PetZone/src/app/(frontend)/cart/page.tsx`
- `/home/jimmy/Projects/PetZone/src/app/(frontend)/shop/page.tsx`
- `/home/jimmy/Projects/PetZone/src/app/(frontend)/brands/page.tsx`
- `/home/jimmy/Projects/PetZone/src/components/checkout-form.tsx`
- `/home/jimmy/Projects/PetZone/src/lib/commerce.ts`
- `/home/jimmy/Projects/PetZone/src/lib/commerce.test.ts`
- `/home/jimmy/Projects/PetZone/src/app/api/store/orders/route.ts`
- `/home/jimmy/Projects/PetZone/src/collections/Commerce.ts`
- `/home/jimmy/Projects/PetZone/src/payload.config.ts`
- `/home/jimmy/Projects/PetZone/src/collections/Products.ts`
- `/home/jimmy/Projects/PetZone/src/app/(payload)/admin/importMap.ts`
- `/home/jimmy/Projects/PetZone/src/migrations/index.ts`
- `/home/jimmy/Projects/PetZone/src/app/globals.css`
- `/home/jimmy/Projects/0-PetZone-Website-Redesign/design.md`

## Risks and decisions

- **Admin/checkout timeouts:** Current evidence includes two simultaneous Next server processes and a hang after `/admin`, but correlation is not causation. Do not “fix” route code until clean-server logs isolate the fault.
- **Coupon concurrency:** A simple usage-count query can race. If usage limits are enforced, use a transaction/lock or database-backed atomic reservation during order creation.
- **Price slider semantics:** A two-thumb slider may need a small accessible dependency; prefer native paired range inputs unless the existing dependency policy allows a proven accessible component.
- **Search data source:** Current products are static fixtures while Payload models exist. Keep this pass compatible, but do not claim CMS previews are live until product fetching is moved to Payload.
- **CSV relationship ambiguity:** Brand/category names can collide or change. Export stable IDs alongside readable labels where useful, reject ambiguous imports, and never auto-create taxonomy/media.
- **CSV formulas and resource exhaustion:** Prefix formula-like exported values safely, enforce MIME/extension, byte/row limits, and parse server-side. Do not use spreadsheet evaluation or remote image fetching.
- **Button contrast:** White on `#EE5F27` is 3.33:1 for normal text. Preserve the explicit user requirement and compensate with 700 weight, adequate size, and clear focus states; document the exception.

## Open questions / TODO markers

- [ ] Confirm whether coupon percentages need a maximum-discount cap. Default plan: omit until requested.
- [ ] Confirm whether coupons may be restricted by customer. Default plan: global coupons only.
- [ ] Confirm whether cart drawer should open automatically after Add to Cart. Default plan: yes, because it provides immediate feedback and exposes checkout/cart actions.

These defaults do not block implementation and can be changed during review.

## Next step

Review this file and edit any coupon rules, auto-open behavior, or recommendation policy you want changed. After approval, switch to Design/Build execution and implement the tasks in order, beginning with the clean Node 22 reproduction of `/admin` and `/checkout`.
