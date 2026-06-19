# Completed Work Log

Running daily record of meaningful Lattice OS tasks, features, fixes, and documentation work completed across computers.

Update this file at the end of a substantial work session. Keep entries concise, newest first, and focused on completed work. Open work, blockers, and next actions belong in `TODO.md`.

## Entry Format

```md
## YYYY-MM-DD

- Completed item, feature, fix, or documentation change.
- Verification: command or smoke test run, if applicable.
```

## 2026-06-18

- Added Hubs-aligned secondary surface finish controls to the RFQ request form, including cosmetic requirement choices, anodized/hardcoat/chromate color options, and powder coat RAL/Pantone custom entries; selected finish details now persist through local drafts and submitted RFQ line items.
- Removed stale buyer quote-list footer helper copy after the in-app footer text cleanup.
- Verification: `npm test -- src/components/request-form.test.tsx src/components/buyer-quotes.test.tsx`, `npm run typecheck`, `npm run lint`, and `git diff --check` passed.
- Tightened customer direct-URL ownership from interim email/domain matching to exact requester email only for quote/order lists, quote detail, checkout, order detail, order help, quote PDFs, invoice PDFs, checkout server actions, quote deletion, and submitted-file downloads.
- Added regression coverage for wrong-owner customer quote, checkout, order, invoice PDF, and checkout server-action access; unauthorized customer direct URLs now terminate before rendering PDFs, creating Stripe checkout state, recording payment state, saving PO files, or purchasing the quote.
- Updated project memory and QC documentation to record exact-requester-email v1 ownership, admin support access, and durable company membership as the future target.
- Added interim customer ownership checks for customer quote/order lists, detail pages, checkout, quote/invoice PDFs, revise/reorder prefill, checkout server actions, quote deletion, and local submitted-file downloads.
- Documented the interim permissions model: exact requester email matches are allowed, admins retain support access, and durable company/customer ID membership remains the target.
- Closed the confirmed customer privacy gaps from the live QC run: customer-role direct URLs now require matching requester email, and local submitted-file downloads are scoped to the owning RFQ/document context.
- Verification: `npm test` passed with 51 files and 214 tests, `npm run typecheck` passed, `npm run lint` passed, and `git diff --check` passed.
- Ran live local fixture QC with generated STEP/STP/PDF files against RFQ submission, file validation, admin quote review page load, supplier quote attachment upload, invoice PDF routes, and role redirects; 24 checks passed and 2 data-privacy probes failed.
- Confirmed privacy gaps before the fix: `/api/local-files/[storageKey]` was session-only rather than document/owner scoped, and customer quote detail pages allowed cross-company direct URL access.
- Verification before the fix: `npm test` passed with 50 files and 206 tests, `npm run typecheck` passed, and `npm run lint` passed after the manual QC run.
- Added a local manual CAD fixture pack under `fixtures/manual-testing/cad/` with mock STEP/STP files, duplicate basename folders, an edge-case filename, a zero-byte STEP file, and a mock drawing PDF for RFQ upload and drawing-required manual testing.
- Researched external CAD sample sources for real geometry viewer checks, with NIST, Xometry, and FreeCAD source links recorded in the fixture README.
- Added `docs/qc-testing-plan.md` covering RFQ submission, uploads/drawings, admin quote review, supplier quote entry, quote approval, PO/invoice generation, order tracking, email notifications, and role permissions.
- Added QC regression tests for request API authorization/upload edge cases, route authorization, local file-storage path safety, guest quote email copy, and PO/Stripe RFQ-to-order repository behavior.
- Updated the dashboard summary test expectations for the current `No quote` customer-facing lifecycle copy.
- Verification: focused QC tests passed, `npm run typecheck` passed, `npm run lint` passed, `npm test` passed with 50 files and 206 tests, and `git diff --check` passed.
- Added admin RFQ response outcomes for `Request information` and `No quote`; both require a customer-facing operator note and reuse the existing `NEEDS_INFO` and `CLOSED` request statuses without a schema migration.
- Updated buyer quote detail, dashboard Inbox, and notifications so request-info and no-quote outcomes surface the operator note through the same derived RFQ activity feed.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx src/lib/customer-notifications.test.ts src/app/notifications/page.test.tsx src/app/dashboard/page.test.tsx src/app/admin/quotes/actions.test.ts`, `npm run lint`, `git diff --check`, and browser smokes for `/admin/quotes?requestId=...`, `/dashboard`, `/notifications`, and `/quotes/[requestId]` passed.
- Added repeatable cleanup tooling with `npm run typecheck`, `npm run dead-code`, and `knip.json`; removed direct unused dependency declarations for `zod`, `pg`, and `@types/pg`.
- Removed runtime-dead RFQ/browser store code, obsolete quote actions, unused preview/template helpers, stale public exports, and tracked local Next dev logs.
- Retired the legacy operator request detail UI so `/operator/requests/[requestId]` redirects to `/admin/quotes?requestId=...`, and moved admin customer/vendor links to admin-native quote/order routes.
- Verification: `npm run typecheck`, `npm run lint`, `npm test`, `npm run dead-code`, `npm run build`, `git diff --check`, and authenticated route probes for `/requests/new`, `/admin/quotes?requestId=...`, `/dashboard`, `/notifications`, `/admin/customers`, `/admin/vendors`, and `/operator/requests/[requestId]` passed; `/quotes/[requestId]/checkout` returned 404 only because no local quoted request exists for checkout smoke data.
- Added Jucheng Precision (JC Proto) and Best Prototypes to the admin Overseas Vendors directory from public/vendor source information.
- Updated the app feature map and added vendor-directory regression coverage for the new overseas vendor seeds.
- Verification: `npm test -- src/lib/admin-vendors.test.ts`, `npm run lint`, `git diff --check`, and `/admin/vendors` browser smoke passed.
- Removed the top KPI card strip from `/admin/quotes` so Quote Submissions goes directly from the page header into drafts and submission review.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx`, `npm run lint`, `git diff --check`, and `/admin/quotes` browser smoke passed.
- Removed the `1. Intake`, `2. Supplier basis`, and `3. Issue quote` chips from the `/admin/quotes` header.
- Verification: `npm run lint`, `git diff --check`, and `/admin/quotes` browser smoke passed.
- Tightened the admin quote drawer pricing table so `Uploaded files` and `Qty` sit closer together.
- Verification: `npm run lint`, `git diff --check`, and `/admin/quotes?requestId=cmqil4boj00012mvmuhgxqqtm` browser spacing smoke passed; lint still reports the existing unused-export warnings in `invoice-pdf.ts` and `quote-xlsx.ts`.
- Replaced the admin RFQ response drawer's dashed header metadata line with labeled Quote, Customer, Process, Package, Quantity, and Files fields.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx`, `npm run lint`, and `git diff --check` passed.
- Reduced the admin RFQ response drawer pricing table gap between `Part` and `Specs`.
- Verification: `npm run lint`, `git diff --check`, and `/admin/quotes?requestId=cmqil4boj00012mvmuhgxqqtm` browser spacing smoke passed.
- Removed the `Files` chip from the admin RFQ response drawer header summary.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx`, `npm run lint`, `git diff --check`, and `/admin/quotes?requestId=cmqil4boj00012mvmuhgxqqtm` browser smoke passed.
- Removed the `Package` chip from the admin RFQ response drawer header summary.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx`, `npm run lint`, `git diff --check`, and `/admin/quotes?requestId=cmqil4boj00012mvmuhgxqqtm` browser smoke passed.
- Removed the `Quantity` chip from the admin RFQ response drawer header summary.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx`, `npm run lint`, `git diff --check`, and `/admin/quotes?requestId=cmqil4boj00012mvmuhgxqqtm` browser smoke passed.

## 2026-06-17

- Added a customer `/roadmap` page where buyers can review upcoming Lattice product/service capabilities and flag which ones they are interested in.
- Added server-side roadmap interest persistence through a new `RoadmapInterest` Prisma model with `.data/roadmap-interests.json` development fallback.
- Added customer navigation, route protection, guarded server action, and focused tests for the Roadmap page interaction.
- Added `docs/completed-work-log.md` as the shared daily record of completed Lattice OS work.
- Linked the completed-work log from the shared memory and handoff docs so future agents keep it updated across machines.
- Added `docs/app-feature-map.md` as the operator-facing feature map for routes, app areas, data sources, status, limitations, and maintenance rules.
- Added `docs/customer-inbox-notification-spec.md` as the editable working spec for customer Inbox and notification taxonomy decisions.
- Updated RFQ status notifications so the dashboard Inbox shows high-signal customer updates such as `RFQ submitted` and action-required quote review rows while keeping audit-style rows such as `Draft created` and `Quote closed` in the full notification history.
- Reclassified quote-issued rows under RFQ Progress as `Quote ready for review`, refreshed RFQ notification copy, and added dashboard/notification tests for the high-signal Inbox split.
- Removed photo-upload rows from the customer notification taxonomy, consolidated tracking availability into the `Order shipped` notification, and added a V1 order-detail package tracking link backed by the supplier tracking number.
- Truncated customer-facing order progress notifications to `Order placed`, `In Production`, and `Inspection In Progress`, while suppressing ready-to-ship, acknowledgment, and generic supplier-movement rows from customer notifications.
- Moved quote-ready notifications under RFQ Progress as `Quote ready for review`, removed `Supplier pricing started` from customer notifications, and documented what `Documents need review` means for quality/compliance uploads.
- Removed the right-side dashboard Orders/contact card so the dashboard focuses on KPIs, Inbox, and the main activity table.
- Replaced the dashboard `Quote activity` card with `Quote and Order Activity`, limited to customer quote-received events and customer order-placed events with direct quote/order links.
- Removed the `View Quotes` shortcut from the top of the customer Orders page header, leaving `Request Quote` as the only header action.
- Removed the remaining `Request Quote` shortcut from the top of the customer Orders page header.
- Updated CAD preview UX so Autodesk translation is presented as background processing, RFQ work can continue while translation runs, and the embedded Autodesk viewer exposes native controls plus top-level fit/full-screen shortcuts.
- Renamed the RFQ line-item CAD replacement action from `Replace` to `Replace Part`.
- Added RFQ CAD viewer toolbar shortcuts for Autodesk Measure, Explode, Section, Model Tree, and Properties extensions.
- Reworked the RFQ CAD viewer controls to use Autodesk native toolbar buttons instead of custom overlay buttons.
- Fixed Autodesk native toolbar attachment timing and visibility in the RFQ CAD preview card.
- Removed the duplicate Lattice-added CAD toolbar group so only Autodesk's native viewer toolbar controls remain visible.
- Trimmed the RFQ CAD preview toolbar to Autodesk's native Measure and Explode Model controls only.
- Added Autodesk's native Section Analysis control back to the focused RFQ CAD preview toolbar.
- Fixed the Section Analysis toolbar behavior by preserving Autodesk's native X/Y/Z plane and box section submenu controls.
- Added drawing-required behavior to dimensional/FAIR-style RFQ quality documentation options, including dropdown labeling, drawing-modal enforcement, submit validation, and generated RFQ notes.
- Removed the top-level `Supplier quote notes` field from the admin RFQ response drawer so customer-facing quote notes stay centralized in `Customer note`.
- Changed Section 2 of the admin RFQ response drawer so `Shop name` is selected from the saved Overseas Vendors directory instead of typed as free text.
- Removed the manual `Supplier quote total` field from Section 2; selected supplier quote totals now derive from supplier line-item costs plus shipping cost.
- Defaulted the admin customer-quote `Shipping speed` selector to `International` for new quote issuance.
- Removed the `Drawing / revision` column from Section 2 of the admin RFQ response drawer.
- Removed the Section 2 supplier line-item notes column so quote notes stay centralized in the customer note field.
- Removed the Section 2 `Supplier contact` field so supplier contact details stay in the uploaded supplier quote file.
- Changed the Section 2 `Country` field to a dropdown with `China`, `Vietnam`, and `India`, defaulting to `China`.
- Changed the Section 2 `Overall lead time days` field to a calculated read-only value from the longest supplier line lead time plus shipping duration.
- Retired the standalone admin Overview page from the sidebar; `/admin` now redirects to `/admin/quotes`, and Quote Submissions is the admin home.
- Removed the duplicate Section 2 supplier line-item pricing/lead-time table; Section 3 is now the single source for line-item unit prices, lead times, supplier quote totals, and calculated overall lead time.
- Changed Section 4 of the admin RFQ response drawer to a single-column Issue customer quote layout.
- Moved selected supplier shop, country, and calculated lead-time fields into Section 1 of the admin RFQ response drawer and removed the standalone Section 2.
- Verification: `npm test`, `npm run lint`, focused dashboard/notification tests, route smoke checks for `/dashboard` and `/notifications`, and `git diff --check` passed.
- Audited local Codex thread history and git milestones, then backfilled this timeline with completed work from prior Lattice OS sessions.

## 2026-06-16

- Reworked `/dashboard` and `/notifications` around derived customer activity from existing RFQ, quote, order, supplier update, shipping, tracking, and supplier document records.
- Added or consolidated the customer dashboard/notification helpers so dashboard metrics, Inbox rows, quote activity, and notification rows share existing request/order data without introducing a new activity/read-state table.
- Added buyer-facing lifecycle labels for quote rows, including `Draft`, `Quote Requested`, `Quote Received`, `In Production`, `Shipping`, `Delivered`, and `Archived`.
- Repaired the dashboard implementation after overlapping agent work left duplicate helper paths and temporary immutable file flags.
- Removed the unused `quoteMutedColor` lint warning from `src/lib/quote-pdf.ts`.
- Verification recorded in Codex thread audit: `npm test`, `npm run lint`, and `npm run build` passed during the dashboard stabilization pass.

## 2026-06-15

- Added direct server-side role guards for sensitive document routes, internal resource downloads, Autodesk CAD preview APIs, and role-specific mutation server actions.
- Added the public account-free `/simple-quote` lane for guest CAD-backed RFQs, tokenized quote review, quote PDF access, and card-only payment.
- Replaced the fake saved-card checkout path with Stripe inline card-only PaymentIntent checkout through Stripe-managed card fields.
- Added structured selected supplier quote data so order-specific supplier purchase order PDFs can render from supplier-side costs and line details instead of customer prices or unstructured attachments.
- Persisted buyer checkout payment choice on purchased orders, including purchase-order number, AP email, buyer notes, and customer PO attachment metadata for PO checkout.
- Ran a security-focused app audit covering tests/build, dependency audit, route probes, role boundaries, file access, Server Action authorization, upload limits, rate limiting, security headers, and guest quote token handling.
- Published the broad app/security update to GitHub as commit `2d5b376` with message `Add simple quote checkout and access hardening`.
- Verification recorded in Codex thread audit: `npm run prisma:generate`, `npm run db:push`, `npm test`, `npm run lint`, `npm run build`, local route smoke checks, and unauthenticated access probes.

## 2026-06-12

- Implemented supplier quote PDF viewer popup in the admin RFQ response drawer.
- Added `?preview=1` support to `/api/local-files/...` so PDFs can render inline while normal download behavior remains unchanged.
- Updated supplier quote attachment UI so PDF filenames open an inline viewer modal with close, title, iframe preview, and separate Download action.
- Updated project memory to note that supplier quote PDFs are previewable inline.
- Verification recorded in Codex thread audit: focused operator request detail tests passed and `npm run lint` passed with the then-existing `quoteMutedColor` warning.

## 2026-06-10

- Defined the expanded buyer-facing quote lifecycle vocabulary: `Draft`, `Quote Requested`, `Quote Received`, `In Production`, `Shipping`, `Delivered`, and `Archived`.
- Updated quote surfaces to avoid untagged submitted/internal-review rows and to reserve `Delivered` for a future durable delivery confirmation trigger.

## 2026-06-09

- Made customer RFQ intake batch-part friendly: drag/drop or multi-select CAD upload now treats each CAD file as a separate configurable line item.
- Updated the buyer material picker to use broad customer-facing material families modeled after Hubs/Protolabs Network-style groupings.
- Added draft storage behavior so selected CAD/drawing upload references are retained earlier in the RFQ flow when local draft upload storage is available.
- Removed the redundant `Explore Model` overlay button from the Autodesk CAD viewer while keeping the embedded model interactive.
- Verification recorded in Codex thread audit: focused request-form tests passed, `npm run lint` passed, and browser checks confirmed the removed viewer control.

## 2026-06-08

- Isolated customer, admin, and supplier app spaces with role-aware sessions and route protection.
- Added role-based navigation behavior: admins land in `/admin`, customers in `/dashboard`, suppliers in `/supplier/orders`, and admin support sessions can deliberately bridge to the customer workspace.
- Added server/session helpers for role derivation and route protection, including Google Workspace SSO support alongside the interim local credential gate.
- Added admin-native order/customer/vendor/resource routes and reduced accidental admin links into buyer-facing quote/order/RFQ routes.
- Added invoice PDF routes for purchased orders across buyer, admin, and supplier app spaces.
- Added order archive behavior through `Request.isArchived` without changing `status: PURCHASED`.
- Added editable admin vendor detail surfaces with local override persistence.
- Removed the customer quote `Files reviewed` card from buyer quote detail after browser review.
- Verification recorded in project/git history: large `6/8 update` committed as `1c71c0e`.

## 2026-06-06

- Promoted draft-backed RFQ uploads from `rfq-drafts/...` into permanent `rfq/...` storage on submission.
- Continued customer workflow polish around RFQ draft recovery and upload-time CAD preview behavior.
- Matched Hubs-style drawing bucket polish in the request form and increased the compact quote-name line to 24px after browser review.
- Documented practical database inspection workflow with Prisma Studio as the record editor/debugging tool, with schema changes still owned by `prisma/schema.prisma`.
- Verification recorded in Codex thread audit: focused request-form tests passed, `npm run lint` passed with existing warnings, and browser computed style confirmed the 24px quote-name line.

## 2026-06-05

- Attached received supplier quote files to RFQs and orders through `SupplierQuoteAttachment`, local supplier-quote upload storage, and admin quote/order detail surfaces.
- Added editable buyer company default through account settings and persisted `AccountDefaults.companyName`.
- Added purchased-order-only invoice PDF rendering for buyer, admin, and supplier order routes.
- Retired DOC-001 from admin resources so DOC-004 became the active customer quote reference.
- Added Google Workspace SSO to the existing session gate while retaining the interim local password fallback.

## 2026-06-04

- Froze DOC-004 customer quote PDF template as Rev 1.
- Expanded account defaults and RFQ snapshots so quote PDFs can use durable requester, buyer company, contact, and ship-to data instead of browser-only settings.
- Added quote dates, validity, shipping fields, customer notes, and quote revision/persistence plumbing across admin quote issuance and customer quote rendering.
- Added or updated admin resource template previews and route support for quote, invoice, and supplier purchase-order templates.
- Verification recorded in git history: `quote updates` committed as `2fb0634`.

## 2026-06-03

- Added local RFQ file storage under `.data/uploads` and persisted uploaded CAD/drawing `storageKey` metadata with RFQ records.
- Added customer quote PDF download/preview routes for buyer and admin quote views.
- Added request-specific Excel quote workbook export at `/admin/quotes/[requestId]/quote-template.xlsx`.
- Added admin resource-library document routes and backing template/resource files.
- Removed artificial seeded RFQs from the commissioned quote workflow and kept local fallback storage focused on real submitted RFQ records.
- Added customer profile icon/detail improvements and admin/customer quote management refinements.
- Verification recorded in git history: commits `c9398a2` and `d521488`.

## 2026-06-02

- Set up the production launch baseline: Vercel project, production domain, Vercel fallback alias, GitHub deployment connection, Neon Postgres project/database, and production env var wiring.
- Added Vercel Web Analytics instrumentation and `.vercelignore` protection for local env files.
- Added Autodesk Platform Services CAD preview setup documentation and configuration endpoint support.
- Added Google/SSO-related env placeholders, logout/password-reset/public-entry refinements, and production/local waiting-list persistence/email fallback improvements.
- Added brand/logo iteration assets for sidebar and signature exploration.
- Verification recorded in git history: production setup committed as `1382667`; earlier downloadable quote PDF work committed as `8951418`.

## 2026-06-01

- Added downloadable customer quote PDFs from buyer quote detail.
- Added quote-file and quote-PDF helpers plus tests for customer-facing quote artifact generation.
- Uploaded the app online and added Vercel deployment hygiene, brand/logo iteration assets, and waiting-list/email persistence updates.
- Verification recorded in git history: commits `8951418` and `f034a83`.

## 2026-05-31

- Expanded the app shell and authenticated customer workspace toward the current operations-console shape.
- Added account settings workspace, notification center, shipped orders, admin vendors, equipment/material/vendor source repositories, and source-document metadata.
- Added public/vendor source documents under `docs/vendor-sources/` and design-export prompt packages for equipment, quotes, and quote detail redesign work.
- Added buyer quote checkout and order help routes, richer buyer order/quote detail surfaces, and request-form dropdown redesign research/assets.
- Redesigned public landing/login/request-quote surfaces with Figma AI reference captures and introduced `custom-select` for improved RFQ dropdowns.
- Verification recorded in git history: commits `fdcf839`, `24672e3`, and `f48f8ca`.

## 2026-05-28

- Added manufacturing and interface icon/visual asset work for the app.
- Continued equipment, capability, and visual-system polish from earlier operational dashboard work.
- Verification recorded in git history: commits `b679f56` and `af92e54`.

## 2026-05-27

- Built invite-only access surfaces with login, waiting list, and public entry behavior.
- Added operational RFQ dashboards across buyer/admin areas, including customer/order/quote management refinements.
- Added waiting-list local persistence and email/local-outbox helpers.
- Added first pass of buyer orders, order detail, quote detail, and expanded RFQ form/operator review tests.
- Verification recorded in git history: commit `6c9b344`.

## 2026-05-26

- Added the customer quote builder workflow, quote Markdown/file helpers, and customer quote template documentation.
- Continued RFQ process updates and app-shell navigation adjustments.
- Added manufacturing photos and visual refresh assets.
- Verification recorded in git history: commits `fdd4b98`, `96f3f61`, `6ac6d80`, `b19dfc2`, and `8ce43fb`.

## 2026-05-25

- Built the owned Lattice app foundation from the Bubble prototype reference.
- Added the Next.js App Router app shell, RFQ creation route, operator request queue/detail, buyer quotes/orders, catalogs, placeholder analytics/projects, and API persistence skeleton.
- Added Prisma schema, Docker/Postgres development setup, request model/persistence/repository helpers, catalog data, RFQ option data, and initial Vitest coverage.
- Added Bubble audit/reference documentation and the initial Bubble emulation build plan.
- Verification recorded in git history: commit `92dd2f2`.

Initial backfill note: this log was created on 2026-06-17. Entries before then were reconstructed from local Codex thread summaries, `DECISIONS.md`, `PROJECT_CONTEXT.md`, and git history, so older daily history is selective rather than exhaustive.
