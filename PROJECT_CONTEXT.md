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
- Manufacturing account defaults now persist server-side when possible and fall back to `.data/account-settings.json` locally; submitted RFQs snapshot requester email/phone and ship-to contact/address data so quote PDFs can be generated from durable RFQ data instead of browser-only account settings.
- Local development RFQ file uploads now store actual CAD/drawing bytes under gitignored `.data/uploads/rfq/<date>/...` and persist `UploadedFile.storageKey` with the RFQ. This is a temporary local storage bridge; production still needs Cloudflare R2 or another S3-compatible object store.
- Local development incomplete RFQ drafts now store selected CAD/drawing bytes under gitignored `.data/uploads/rfq-drafts/<date>/...` as soon as the buyer selects them, then persist those `storageKey` references in the browser draft so reopening `/requests/new?draft=local_draft_*` can submit without requiring CAD/PDF reupload. When a draft-backed RFQ is submitted, the API copies any `rfq-drafts/...` CAD/drawing files into permanent `.data/uploads/rfq/<date>/...` storage before persisting the submitted request. Drafts created before draft file storage may still be filename-only and require one replacement upload.
- Artificial seeded RFQs have been removed from the runtime quote workflow as of 2026-06-03. Local development now keeps only real submitted RFQ records in `.data/requests.json` when Prisma/Postgres is unavailable.
- DOC-004, the generated customer quote PDF template, is frozen as Rev 1 as of 2026-06-04. Rev 1 uses the current Hubs-inspired PDF renderer and should not be changed without starting a Rev 2 iteration.
- Customer records now have schema and repository support for durable customer-facing IDs in the format `CUST-000001`. `CustomerSequence` allocates the next global sequence, and `Company.customerId` stores the public customer identifier.
- Customer invoice issuance now has schema and repository support for durable annual invoice IDs in the format `INV-YYYY-000001`. `InvoiceSequence` allocates the next annual sequence, and `Invoice` stores issued invoice snapshots, including optional quote number and shipping terms traceability fields. The DOC-003 resource preview remains a non-issuing template and should not consume invoice IDs.
- Purchased orders can now render order-specific customer invoice PDFs from accepted quote/order data at buyer, admin, and supplier order invoice routes. These generated order invoice downloads use stable order-derived invoice references for repeatable rendering; connecting them to durable issued `Invoice` records remains a separate accounting hardening step.
- Account settings now include an editable buyer company default, persisted as `AccountDefaults.companyName` when Postgres is available and in `.data/account-settings.json` locally. New RFQs use this value as the default Company Name, while revisions/reorders preserve the copied request's original company.
- Admins can attach the quote file received from the Chinese/overseas machine shop to an RFQ/order. Supplier quote attachments upload through the multipart route handler at `/api/supplier-quote-files`, are stored as local uploads under `.data/uploads/supplier-quotes` in development, tracked on `LatticeRequest.supplierQuoteFiles`, persisted in Postgres through `SupplierQuoteAttachment`, and surfaced in the admin quote drawer plus quote/order detail pages.
- Admins can archive placed orders from `/admin/orders`. Archived orders keep `status: PURCHASED` and are hidden from the active admin placed-order list through `Request.isArchived`, preserving buyer/supplier lifecycle semantics and invoice eligibility.
- Resend and Cloudflare R2/S3 production storage are still pending. Workspace routes are protected by a signed HTTP-only session cookie; the login page supports both the interim local password gate and Google Workspace SSO through Google OAuth/OIDC when `GOOGLE_SSO_*` environment variables are configured.

The current working vertical slice:

1. Buyer creates a request.
2. Buyer starts with a CAD file upload; customer and manufacturing configuration fields are revealed after a file is attached, each uploaded CAD file becomes a configurable line item, buyers can upload additional CAD files from the request form to add more line items, and the request form can start an Autodesk Platform Services preview translation when APS credentials are configured. Draft RFQs persist selected CAD/drawing storage keys plus restorable Autodesk preview states so a refresh can recover the uploaded files and translated viewer from saved references when local draft storage is available.
3. Request form submits through the Next.js API layer.
4. Local development stores submitted CAD/drawing file bytes in `.data/uploads` and attaches storage keys to the RFQ file records.
5. Request is validated/transformed by local business logic.
6. Prisma persists the request to PostgreSQL.
7. Draft customer quotes are visible from admin quote submissions in a separate draft table, including same-browser incomplete RFQ drafts and durable `DRAFT` requests.
8. Submitted requests appear in admin quote submissions, where admins open a minimal RFQ review drawer focused on downloading uploaded files, checking configured part details, and entering critical quote feedback: one unit price per configured part, lead time, shipping cost, shipping method, shipping terms, estimated delivery date, quote created date, quote valid-until date, and notes.
9. From the admin RFQ review drawer, operators attach received Chinese/overseas shop quote files, enter unit pricing, lead time, shipping cost, shipping terms, quote dates, delivery date, and quote notes in the app, then can export a request-specific Excel quote workbook at `/admin/quotes/[requestId]/quote-template.xlsx` and manually download the latest saved customer quote PDF at `/admin/quotes/[requestId]/quote.pdf`; both are populated from the saved RFQ, uploaded files, quote feedback, customer quote version, and shipping fields.
10. As of 2026-06-03, artificial seeded/demo RFQs are removed from runtime quote fallbacks. The local fallback store currently keeps only the real aluminum plate RFQ submitted by William while the workflow moves into real commissioning.
11. The older, fuller customer quote packet builder still exists in code for future customer-facing quote version work, but the first admin RFQ review drawer is intentionally minimal.
12. Buyer quote rows at `/quotes` are split into in-progress RFQs and quote-received requests, and open a consistent quote detail template at `/quotes/[requestId]` with a summary-of-order table, per-part unit prices, saved customer quote versions, lead time, files, supplier quote basis, activity, purchase conversion, and an edit/resubmit action for active priced quotes.
13. Buyers can edit and resubmit active non-final quote/RFQ records by opening `/requests/new?revise=[requestId]` from submitted, needs-info, supplier-pricing, or quote-received states. The flow preloads the existing RFQ as a new request draft rather than mutating the original record. Revision drafts reuse saved CAD/drawing `storageKey` references when available, so buyers only need to upload replacements or repair older filename-only records.
14. Purchased quotes leave the buyer Quotes page and live in `/orders`; opening a purchased quote detail route redirects to the matching order detail. Purchased order detail surfaces expose customer invoice preview/download actions generated from the order's accepted quote, line items, shipping, tax, bill-to, and ship-to snapshot.
15. Buyer-facing quote statuses are intentionally limited to `Draft`, `Quote received`, `Ordered`, and `Closed`. More granular submitted, needs-info, and supplier-review states remain internal RFQ workflow states rather than customer quote statuses.

Important routes:

- `/` - public invite-only landing page with Log in and Request access entry points.
- `/login` - public invite-only login page that uses the same public visual system and authenticates with Google Workspace SSO when configured, with the interim local credential gate retained as a fallback.
- `/forgot-password` - public password reset request page for the interim local credential gate; it does not reveal whether an email exists and records/sends reset instructions when supported.
- `/waiting-list` - public waiting list request page that writes local waitlist entries for admin review, blocks exact duplicate emails with an on-page notice, emails same-domain requesters with the existing waitlist contact, and triggers a thank-you email for new entries.
- `/dashboard` - command center/dashboard.
- `/requests/new` - buyer RFQ/request creation; supports `?reorder=[requestId]` to prefill a new RFQ draft from a prior purchased order and `?revise=[requestId]` to prefill a new RFQ draft from an active priced quote.
- `/operator/requests` - redirects to `/admin/quotes`; the separate RFQ queue page was retired as redundant.
- `/operator/requests/[requestId]` - legacy/focused operator request detail screen; primary quote-submission review now lives in `/admin/quotes`.
- `/quotes` and `/quotes/[requestId]` - buyer quote/RFQ tracking, split into in-progress and quoted-request tables; purchased quotes are excluded and handled in orders.
- `/quotes/[requestId]/checkout` - buyer checkout step for quoted RFQs, collecting delivery, import/compliance, payment/PO, tax, and purchasing terms before order placement.
- `/orders`, `/orders/[requestId]`, `/orders/[requestId]/help`, and `/orders/[requestId]/invoice.pdf` - buyer order tracking, detail, order-specific help request, and placed-order customer invoice PDF preview/download.
- `/shipped` - buyer shipped-order tracking.
- `/notifications` - buyer platform notification center for RFQ, order, document, and action alerts.
- `/supplier/orders`, `/supplier/orders/[requestId]`, and `/supplier/orders/[requestId]/invoice.pdf` - supplier-facing order views and placed-order invoice PDF access.
- `/admin` - critical quote request overview dashboard for active RFQ intake, blocked requests, supplier outreach, overdue items, and buyer decision follow-up.
- `/admin/orders/[requestId]/invoice.pdf` - admin placed-order invoice PDF route using the same order-backed invoice renderer.
- `/admin/customers` and `/admin/customers/[companyId]` - customer management, including a waiting list viewer.
- `/admin/vendors` and `/admin/vendors/[vendorId]` - Notion-database-inspired overseas vendor directory and detail records for shop contacts, onboarding status, capabilities, quality notes, RFQ history, and order coverage. Detail-page edits persist locally through `.data/admin-vendor-overrides.json` until full supplier/vendor database tables are introduced.
- `/admin/quotes` - admin quote submissions command center for RFQ review, status updates, supplier quote context, and customer quote issuance.
- `/admin/quotes/[requestId]/quote-template.xlsx` - admin download route for a data-connected customer quote Excel workbook generated from the selected RFQ.
- `/admin/quotes/[requestId]/quote.pdf` - admin manual-download route for the latest saved customer quote PDF generated from the selected RFQ and quote version.
- `/admin/orders` and `/admin/orders/[requestId]` - admin active placed-order management, archive action, and placed-order detail review inside the admin app.
- `/admin/resources` - admin resource library for downloadable and previewable internal templates and reference files. DOC-001 was retired on 2026-06-05; the page currently includes DOC-002 supplier purchase order PDF template, DOC-003 domestic customer invoice PDF template, and DOC-004 customer quote PDF template Rev 1. PDF templates render inline while retaining download behavior.
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
- `fixtures/` - currently disabled for RFQ seeding so artificial quote records do not re-enter the commissioned workflow.
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
- admin surfaces should feel visually distinct from the customer app, using an Airbnb-inspired palette: Rausch coral `#FF5A5F` for primary admin actions and active accents, pale Rausch tints for admin surfaces, Babu teal `#00A699`-based success states, Arches orange `#FC642D` warnings, and Airbnb neutral grays `#484848` and `#767676` for text

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
- `src/lib/auth-crypto.ts`, `src/lib/session.ts`, `src/lib/google-sso.ts`, `src/app/login/actions.ts`, `src/app/api/auth/google/`, and `src/proxy.ts` - local credential authentication, Google Workspace SSO, signed session cookie helpers, login action, and optimistic route protection.
- `src/lib/account-settings.ts` and `src/lib/account-settings-shared.ts` - server-visible manufacturing account defaults, browser-safe defaults/types, editable buyer company default, and RFQ quote-contact snapshot helpers.
- `src/components/request-form.tsx` - buyer RFQ form.
- `src/components/cad-upload-preview.tsx` and `src/components/autodesk-model-viewer.tsx` - upload-time CAD preview and Autodesk Viewer integration.
- `src/components/operator-queue.tsx` - operator request queue.
- `src/components/operator-request-detail.tsx` - internal request review.
- `src/components/buyer-quotes.tsx` and `src/components/buyer-quote-detail.tsx` - buyer quote views.
- `src/components/buyer-orders.tsx` and `src/components/buyer-order-detail.tsx` - buyer order views.
- `src/components/supplier-orders.tsx` and `src/components/supplier-order-detail.tsx` - supplier order views.
- `src/components/supplier-quote-files.tsx` and `src/app/api/supplier-quote-files/route.ts` - internal Chinese/overseas shop quote attachment list, download links, and durable multipart upload route.
- `src/components/admin-*.tsx` - admin operation surfaces, including the quote-request overview dashboard and admin quote submissions command center.
- `resources/admin/`, `src/app/admin/resources/`, `src/lib/admin-document-templates.ts`, `src/lib/purchase-order-pdf.ts`, and `src/lib/invoice-pdf.ts` - internal admin template/reference files, generated workbook/PDF templates, preview models, and the admin resource-library download page/routes, including supplier purchase order PDF template, domestic invoice PDF template, and customer quote PDF template Rev 1.
- `docs/admin-document-templates.md` - durable source of truth for admin document template IDs, backing files, routes, reference assets, and usage rules, including DOC-001's retired status.
- `src/components/admin-vendor-database.tsx`, `src/components/admin-vendor-detail.tsx`, `src/lib/admin-vendors.ts`, and `src/lib/admin-vendor-overrides.ts` - overseas vendor database/detail UI, request-derived vendor summaries, and local persisted overrides for editable vendor-detail fields.
- `src/components/customer-quote-builder.tsx` and `src/lib/quote-file.ts` - customer-facing quote assembly, Markdown generation, and quote-version form helpers.
- `src/lib/quote-xlsx.ts` - dependency-free Excel workbook generator for data-connected customer quote templates.
- `src/lib/request-model.ts` - core request types, statuses, and transitions.
- `src/lib/request-persistence.ts` - app/database mapping.
- `src/lib/request-repository.ts` - database operations.
- `src/lib/local-request-store.ts` - development-only server-side RFQ fallback store used when local Postgres is unavailable.
- `src/lib/local-file-storage.ts` and `/api/local-files/[...storageKey]` - temporary local CAD/drawing file storage and download path for development RFQs.
- `src/components/supplier-quote-files.tsx`, `src/app/admin/quotes/actions.ts`, and `SupplierQuoteAttachment` in `prisma/schema.prisma` - internal received supplier quote attachment upload/listing flow used by admin quote review and quote/order detail pages.
- `fixtures/demo-rfqs.json` - empty disabled RFQ fixture manifest retained only as a placeholder if isolated non-production test data is deliberately reintroduced.
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
