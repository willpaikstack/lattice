# Bubble Follow-up Inspection — RFQ/Quote/Order Spine

Date: 2026-05-24

## Scope completed from public runtime

Inspected the public Bubble runtime surfaces for:

- `request_quote`
- `my_quotes_`
- `my_orders`
- runtime `dynamic.js` metadata for RFQ option sets and quote/order schema

## Key findings

### `request_quote`

The page confirms the product spine starts with buyer RFQ intake:

- upload-first CAD dropzone
- supported CAD file guidance: `STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT`
- customer details fields: `Customer PO#`, `Company Name`, `Project Names`, and notes-style input
- unfinished/debug state: `HEADER`, repeated `Quote Number`, and `yes(No quote line items)`
- submit CTA: `Request Quote`

Local translation decision:

- Keep upload-first RFQ intake.
- Do not copy the debug/placeholder header copy.
- Treat one or more quote line items as the next important flow concept.
- Use Bubble option sets to guide manufacturing choices.

### RFQ option sets extracted from runtime

Public `dynamic.js` exposes useful option sets that are now represented in owned code:

- fabrication capability / process options
- RFQ materials option set
- general tolerance options
- surface finish options
- quality documentation options

Local implementation file:

- `src/lib/rfq-options.ts`

### `my_quotes_`

Visible runtime surface:

- shared sidebar
- heading: `My Quotes`
- subtitle: `Track the status of your submitted RFQs`
- no visible quote rows, cards, tables, filters, detail panels, or explicit empty-state copy

Local translation decision:

- Keep `/quotes` as buyer-facing quote/RFQ status tracking.
- Keep `/operator/requests` as internal operator review queue.
- Do not infer a full buyer quote table from Bubble yet.

### `my_orders`

Visible runtime surface:

- shared sidebar
- heading: `MY ORDERS`
- subtitle: `Track the status of your purchases`
- no visible order rows, cards, tables, statuses, or explicit empty-state copy

Local translation decision:

- Keep `/orders` as quote-acceptance/order-tracking placeholder.
- Do not build order execution until quote acceptance/conversion exists.

## Blocked without Bubble editor or database access

The following items cannot be verified from the public runtime alone:

- click workflows for creating quote line items
- backend workflow on `Request Quote`
- quote number generation logic
- quote → order conversion workflow
- actual database records for quotes, quote line items, orders, materials, CAD files, users, or companies
- privacy rules and role permissions
- whether suppliers exist as users or external-only contacts

## Local build change made from this pass

Implemented Bubble-backed guided RFQ fields in the local app:

- process select
- material select
- general tolerance select
- surface finish select
- quality documentation checklist

Also persisted and displayed these values through the actual execution path:

`/requests/new` → POST `/api/requests` → Postgres/Prisma → `/operator/requests` → `/operator/requests/[requestId]`

Verification showed a submitted request rendering in operator detail with:

- `Material: SS 304`
- `Tolerance: ISO 2768 Medium (m)`
- `Finish: As machined (Ra 3.2 µm / Ra 126 µin)`
- `Quality docs: Standard Inspection`

## Recommended next step

To continue without editor access:

1. Build buyer `/quotes` from real local submitted requests.
2. Add the first quote status lifecycle: submitted → under review → priced/ready for buyer → purchased/order.
3. Add operator status mutation controls on request detail.

To continue with Bubble editor access:

1. Inspect workflows attached to `Request Quote`.
2. Inspect Bubble database rows for `quote`, `quote_line_items`, `orders`, `cadfile`, `material`.
3. Inspect privacy rules and role model.
