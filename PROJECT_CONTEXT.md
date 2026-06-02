# Project Context

This file is durable project memory for AI agents working on Lattice OS from multiple computers. Keep it concise and current.

## Product

Lattice OS is an owned-code manufacturing RFQ, procurement, and supplier-network workflow platform.

The product is intended to operate similarly to Xometry, Fictiv, Hubs, or Protolabs, but specifically for machine shops. Lattice is backed by William's network of machine shops in China that offer lower-cost custom machining and fabrication services. Domestic companies and machine shops can use Lattice to outsource work to this network so they can access additional machines, labor, materials, and process capabilities without taking on additional CAPEX.

The core use case is helping domestic shops accept jobs they might otherwise no-quote because they are at capacity, lack the right machines, lack available materials, lack labor, or want to advertise capabilities that can be fulfilled through the Lattice supplier network even when those capabilities are not in-house.

The app is being rebuilt from a Bubble prototype into a local Next.js application. The Bubble prototype is a product and UI reference, not an implementation source to copy directly.

Core users:

- Buyers submit RFQs with CAD files, materials, quantities, due dates, and notes.
- Lattice operators review incoming RFQs, identify missing information, and prepare supplier outreach.
- Domestic machine shops use Lattice to route overflow or out-of-capability jobs to the supplier network instead of no-quoting.
- Suppliers and downstream order workflows are future phases.
- Admin/customer management surfaces support internal operations.

## Current App State

Production launch baseline as of 2026-06-02:

- Vercel project: `willpaikstacks-projects/lattice`.
- Production custom domain: `https://latticeos.co`.
- Vercel fallback alias: `https://lattice-phi-plum.vercel.app`.
- GitHub repo connected for automatic Vercel deployments: `willpaikstack/lattice`.
- Neon project/database created for production Postgres: project `lattice`, database `neondb`, production branch in AWS US East 1.
- Prisma schema has been pushed to the Neon production database.
- Vercel production/development env vars include `DATABASE_URL` and `AUTH_SECRET`.
- `.vercelignore` excludes local env files from CLI deployment uploads.
- Public waiting-list requests persist to Neon via Prisma; email outbox fallback is non-fatal when Resend is not configured.
- Local development RFQ submissions use PostgreSQL when available and fall back to `.data/requests.json` only when Prisma/Postgres is unreachable, matching the local waiting-list fallback style so sample submissions can still be tested on machines without Docker.
- Resend, Cloudflare R2/S3 production storage, custom domain, and multi-user production authentication are still pending. A local single-account credential gate now protects workspace routes through a signed HTTP-only session cookie.

The current working vertical slice:

1. Buyer creates a request.
2. Buyer starts with a CAD file upload; customer and manufacturing configuration fields are revealed after a file is attached, each uploaded CAD file becomes a configurable line item, buyers can upload additional CAD files from the request form to add more line items, and the request form can start an Autodesk Platform Services preview translation when APS credentials are configured. Draft RFQs persist restorable Autodesk preview states so a refresh can recover the translated viewer from its saved URN.
3. Request form submits through the Next.js API layer.
4. Request is validated/transformed by local business logic.
5. Prisma persists the request to PostgreSQL.
6. Draft customer quotes are visible from admin quote submissions in a separate draft table, including same-browser incomplete RFQ drafts and durable `DRAFT` requests.
7. Submitted requests appear in admin quote submissions, where admins open an RFQ command drawer with review controls, a Fictiv-style quote package worksheet, buyer intake, files, line items, supplier quote basis, readiness checks, and status history.
8. Admin quote issuance lives inside the `/admin/quotes` RFQ command drawer and can save durable customer quote versions linked to an RFQ, including quote number, line-item pricing, Markdown output, validity dates, logistics/terms text, and total value.
9. Buyer quote rows at `/quotes` are split into in-progress RFQs and quoted requests, and open a consistent quote detail template at `/quotes/[requestId]` with pricing, saved customer quote versions, lead time, line-item requirements, files, supplier quote basis, activity, and purchase conversion.
10. Purchased quotes leave the buyer Quotes page and live in `/orders`; opening a purchased quote detail route redirects to the matching order detail.
11. Buyer-facing quote statuses are intentionally limited to `Draft`, `Quoted`, `Ordered`, and `Closed`. More granular submitted, needs-info, and supplier-review states remain internal RFQ workflow states rather than customer quote statuses.

Important routes:

- `/` - public invite-only landing page with Log in and Request access entry points.
- `/login` - public invite-only login page that uses the same public visual system and authenticates the current single local account before entering the workspace.
- `/forgot-password` - public password reset request page for the interim local credential gate; it does not reveal whether an email exists and records/sends reset instructions when supported.
- `/waiting-list` - public waiting list request page that writes local waitlist entries for admin review, blocks exact duplicate emails with an on-page notice, emails same-domain requesters with the existing waitlist contact, and triggers a thank-you email for new entries.
- `/dashboard` - command center/dashboard.
- `/requests/new` - buyer RFQ/request creation; supports `?reorder=[requestId]` to prefill a new RFQ draft from a prior purchased order.
- `/operator/requests` - redirects to `/admin/quotes`; the separate RFQ queue page was retired as redundant.
- `/operator/requests/[requestId]` - legacy/focused operator request detail screen; primary quote-submission review now lives in `/admin/quotes`.
- `/quotes` and `/quotes/[requestId]` - buyer quote/RFQ tracking, split into in-progress and quoted-request tables; purchased quotes are excluded and handled in orders.
- `/quotes/[requestId]/checkout` - buyer checkout step for quoted RFQs, collecting delivery, import/compliance, payment/PO, tax, and purchasing terms before order placement.
- `/orders`, `/orders/[requestId]`, and `/orders/[requestId]/help` - buyer order tracking, detail, and order-specific help request.
- `/shipped` - buyer shipped-order tracking.
- `/notifications` - buyer platform notification center for RFQ, order, document, and action alerts.
- `/supplier/orders` and `/supplier/orders/[requestId]` - supplier-facing order views.
- `/admin` - critical quote request overview dashboard for active RFQ intake, blocked requests, supplier outreach, overdue items, and buyer decision follow-up.
- `/admin/customers` and `/admin/customers/[companyId]` - customer management, including a waiting list viewer.
- `/admin/vendors` - Notion-database-inspired overseas vendor directory for shop contacts, capabilities, quality notes, RFQ history, and order coverage.
- `/admin/quotes` - admin quote submissions command center for RFQ review, status updates, supplier quote context, and customer quote issuance.
- `/admin/orders` - admin order management.
- `/materials` - customer-facing material catalog grouped by material family and subgroup; vendor source/provenance stays out of this page and is retained only in internal repositories.
- `/capabilities` - fabrication capabilities.
- `/equipment` - vendor equipment catalog sourced from China machine-shop contacts so buyers/operators can inspect real capacity, limits, and source provenance before routing RFQs.
- `/analytics` and `/projects` - placeholder/future modules.

Important folders:

- `src/app/` - Next.js App Router pages, nested routes, and API routes.
- `src/components/` - reusable UI components.
- `src/lib/` - business logic, typed data, persistence, and repository code.
- `prisma/` - database schema.
- `docs/` - product research, Bubble audit notes, and implementation plans.
- `docs/autodesk-aps-cad-preview.md` - Autodesk Platform Services CAD preview setup and secret-handling guidance.
- `public/equipment/` - manufacturing/equipment imagery.

## Stack

- Next.js App Router 16.2.6.
- React 19.2.4.
- TypeScript.
- Tailwind CSS 4.
- Prisma 7 with PostgreSQL.
- Production hosting on Vercel.
- Production database on Neon Postgres.
- Vitest and Testing Library.
- Docker Compose for local Postgres and MinIO/S3-compatible storage placeholders.

Important: this repo uses a newer Next.js with breaking changes. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.

## Product Direction

The authenticated product UI should move toward a light B2B operations console:

- persistent left sidebar
- clear RFQ/order/dashboard navigation
- neutral light background
- dense but readable operational lists/tables
- restrained accents
- manufacturing-specific fields and language
- supplier-network trust signals that prove real capacity, equipment, source provenance, and process limits rather than generic capability claims
- admin surfaces should feel visually distinct from the customer app, using `#FFD3AC` as the primary peach palette

Avoid making the app feel like a generic startup landing page. Lattice is an operational tool for RFQs, procurement, manufacturing partners, quotes, and orders.

The public website entry point is intentionally minimal and invite-only. `/` and `/login` currently use the Figma AI-designed dark technical drawing/grid visual system, but the visible choices should stay constrained to logging in or requesting access.

The Bubble reference worth preserving:

- app shell/sidebar information architecture
- `Request Quote` as a primary action
- dashboard metrics, customer notification inbox, and activity lists
- upload-first RFQ flow
- materials and fabrication capabilities as resource catalogs

The Bubble reference worth improving:

- remove placeholder/debug text
- replace generic users/transactions with manufacturing RFQ/order data
- separate buyer, operator, supplier, and admin workflows more clearly
- make statuses and next actions explicit

## Key Files To Know

- `src/components/app-shell.tsx` - shared shell/navigation.
- `src/components/public-entry.tsx` - shared public greeting-page header and dark technical background used by `/`, `/login`, `/forgot-password`, and the waiting-list confirmation page.
- `src/lib/auth-crypto.ts`, `src/lib/session.ts`, `src/app/login/actions.ts`, and `src/proxy.ts` - local single-account credential authentication, signed session cookie helpers, login action, and optimistic route protection.
- `src/components/request-form.tsx` - buyer RFQ form.
- `src/components/cad-upload-preview.tsx` and `src/components/autodesk-model-viewer.tsx` - upload-time CAD preview and Autodesk Viewer integration.
- `src/components/operator-queue.tsx` - operator request queue.
- `src/components/operator-request-detail.tsx` - internal request review.
- `src/components/buyer-quotes.tsx` and `src/components/buyer-quote-detail.tsx` - buyer quote views.
- `src/components/buyer-orders.tsx` and `src/components/buyer-order-detail.tsx` - buyer order views.
- `src/components/supplier-orders.tsx` and `src/components/supplier-order-detail.tsx` - supplier order views.
- `src/components/admin-*.tsx` - admin operation surfaces, including the quote-request overview dashboard and admin quote submissions command center.
- `src/components/admin-vendor-database.tsx` and `src/lib/admin-vendors.ts` - overseas vendor database UI and request-derived vendor summaries.
- `src/components/customer-quote-builder.tsx` and `src/lib/quote-file.ts` - customer-facing quote assembly, Markdown generation, and quote-version form helpers.
- `src/lib/request-model.ts` - core request types, statuses, and transitions.
- `src/lib/request-persistence.ts` - app/database mapping.
- `src/lib/request-repository.ts` - database operations.
- `src/lib/local-request-store.ts` - development-only server-side RFQ fallback store used when local Postgres is unavailable.
- `src/lib/customer-notifications.ts` - buyer notification derivation for quote-ready and missing-info RFQ states, with static fallback notifications.
- `src/lib/autodesk-platform-services.ts` - APS authentication, OSS upload, Model Derivative translation, and viewer token helpers.
- `src/lib/request-queue.ts` - legacy operator queue filtering/sorting kept for tests and future reuse if needed.
- `src/lib/catalog-data.ts` - materials/capabilities data.
- `src/lib/cnc-material-library.ts` - quote-selectable CNC material library researched from Fictiv, Hubs/Protolabs Network, and Xometry.
- `src/lib/vendor-materials.ts` - vendor-provided material offering repository with source document traceability for admin/operator use.
- `src/lib/customer-profiles.ts` - demo/customer profile data.
- `src/lib/vendor-source-documents.ts` and `docs/vendor-sources/` - vendor document archive metadata and received source files used to populate materials/equipment data.
- `src/lib/waiting-list.ts` - local JSON-backed waiting list request store and duplicate/same-domain detection for early admin review.
- `src/lib/waiting-list-email.ts` - waiting list thank-you and same-domain contact email composition and delivery; uses Resend when configured and a local outbox otherwise.
- `prisma/schema.prisma` - database model.

## Verification

Use the smallest verification set that matches the change risk. For meaningful workflow changes, prefer:

```bash
npm test
npm run lint
npm run build
```

For database schema changes:

```bash
npm run prisma:generate
npm run db:push
```

For UI changes, start the app and browser-check the changed route(s).

## Updating This File

Update this file when:

- the app's purpose or user roles change
- a major route/workflow is added or removed
- the architecture changes
- important files move
- the working vertical slice changes
