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
- Vercel Web Analytics instrumentation is installed via `@vercel/analytics` and mounted in the root App Router layout; deploy and visit production before expecting data in Vercel Analytics.
- Neon project/database created for production Postgres: project `lattice`, database `neondb`, production branch in AWS US East 1.
- Prisma schema has been pushed to the Neon production database.
- A separate Neon project, `lattice-development`, is available for local development. Its non-committed connection URL belongs in `.env.local`; its current schema was initialized from `prisma/schema.prisma` on 2026-08-19. Keep it separate from staging and production customer data.
- Vercel Production environment includes `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `WAITLIST_EMAIL_FROM`, `WAITLIST_EMAIL_APP_NAME`, and `APP_BASE_URL`. The Resend key is also currently present in Preview; use a separate restricted Preview key before preview deployments are permitted to send customer email.
- `.vercelignore` excludes local env files from CLI deployment uploads.
- Public waiting-list requests persist to Neon via Prisma; email outbox fallback is non-fatal when Resend is not configured.
- Local development RFQ submissions use PostgreSQL when available and fall back to `.data/requests.json` only when Prisma/Postgres is unreachable, matching the local waiting-list fallback style so sample submissions can still be tested on machines without Docker.
- Runtime request data is selected by `LATTICE_DATA_MODE`: local development defaults to `mock`, customer-safe mode uses `.data/requests.json` and hides artificial `demo_`/`fixture_` records, and mock mode uses `.data/mock/requests.json` with demo RFQ/order fixtures for UI/product iteration. Production refuses `LATTICE_DATA_MODE=mock`.
- Manufacturing account settings use database-only persistence: personal identity and phone fields are stored for the signed-in user, while shipping, billing address, and billing-contact defaults are stored on the shared `Company` record. Failed saves surface an error rather than falling back to browser or local-file storage. Existing populated legacy user defaults are adopted into an otherwise empty company record on first read. Submitted RFQs snapshot requester email/phone and ship-to contact/address data so quote PDFs can be generated from durable RFQ data. When an in-review RFQ snapshot is incomplete, its detail page displays the signed-in customer's saved shipping default; that snapshot can then be deliberately refreshed from the account shipping editor. Issued quotes retain their delivery snapshot until checkout. New customer accounts are directed through shipping and billing address setup before their normal customer workspace route.
- Local development RFQ file uploads now store actual CAD/drawing bytes under gitignored `.data/uploads/rfq/<date>/...` and persist `UploadedFile.storageKey` with the RFQ. Submitted CAD files can also persist `UploadedFile.cadPreviewUrn` from Autodesk Platform Services so customer quote detail pages can show APS thumbnail previews. APS credentials are configured in Vercel Development, Preview, and Production as of 2026-08-18; production still needs Cloudflare R2 or another S3-compatible object store.
- Local development incomplete RFQ drafts now store selected CAD/drawing bytes under gitignored `.data/uploads/rfq-drafts/<date>/...` as soon as the buyer selects them, then persist those `storageKey` references in the browser draft so reopening `/requests/new?draft=local_draft_*` can submit without requiring CAD/PDF reupload. When a draft-backed RFQ is submitted, the API copies any `rfq-drafts/...` CAD/drawing files into permanent `.data/uploads/rfq/<date>/...` storage before persisting the submitted request. Drafts created before draft file storage may still be filename-only and require one replacement upload.
- Artificial seeded RFQs have been removed from the customer runtime quote workflow as of 2026-06-03. As of 2026-08-06, they are permitted only behind `LATTICE_DATA_MODE=mock`, which stores mock fallback records separately under `.data/mock/requests.json`.
- DOC-004, the generated customer quote PDF template, is frozen as Rev 1 as of 2026-06-04. Rev 1 uses the current Hubs-inspired PDF renderer and should not be changed without starting a Rev 2 iteration.
- Customer records now have schema and repository support for durable customer-facing IDs in the format `CUST-000001`. `CustomerSequence` allocates the next global sequence, and `Company.customerId` stores the public customer identifier.
- Customer invoice issuance now has schema and repository support for durable annual invoice IDs in the format `INV-YYYY-000001`. `InvoiceSequence` allocates the next annual sequence, and `Invoice` stores issued invoice snapshots, including optional quote number and shipping terms traceability fields. The DOC-003 resource preview remains a non-issuing template and should not consume invoice IDs.
- Purchased orders can now render order-specific customer invoice PDFs from accepted quote/order data at buyer, admin, and supplier order invoice routes. These generated order invoice downloads use stable order-derived invoice references for repeatable rendering; connecting them to durable issued `Invoice` records remains a separate accounting hardening step.
- Account settings include an editable buyer company name and shared company shipping/billing defaults. The latter are persisted on `Company` rather than browser-local or user-scoped fallback storage. New RFQs use the buyer company name as the default Company Name, while revisions/reorders preserve the copied request's original company.
- Stripe card checkout now renders inline on `/quotes/[requestId]/checkout` using a card-only Stripe PaymentIntent and `@stripe/react-stripe-js` `CardElement`. Stripe-managed card fields collect card details in the existing checkout form, Bank/Klarna/dynamic payment methods are intentionally not shown, and the quote is converted to a purchased order only after Stripe confirms the card payment.
- Admins can attach the quote file received from the Chinese/overseas machine shop to an RFQ/order. Supplier quote attachments upload through the multipart route handler at `/api/supplier-quote-files`, are stored as local uploads under `.data/uploads/supplier-quotes` in development, tracked on `LatticeRequest.supplierQuoteFiles`, persisted in Postgres through `SupplierQuoteAttachment`, and surfaced in the admin quote drawer plus quote/order detail pages. PDF supplier quote attachments can be opened in an inline viewer popup from the admin RFQ response drawer while retaining a separate download action.
- Quote checkout now treats William's account as approved for either saved-card checkout or purchase-order checkout. Placing an order persists `purchasePayment` details on the request/order; card checkout stores only non-sensitive saved-card metadata, while PO checkout requires a PO number, AP email, and uploaded customer PO file stored locally under `.data/uploads/customer-purchase-orders` in development and tracked through `CustomerPurchaseOrderAttachment`.
- The public site leads with a manufacturing-proof landing page for domestic machine shops managing overflow and cyclical demand. The hero describes Lattice as qualified global CNC machining and fabrication capacity that protects scheduled commitments, lead times, and customer responsiveness; its quality section explains that requested inspection reports and material documentation are uploaded to Lattice for customer review before shipment. A partner-network experience section communicates source-backed industry coverage without customer logos, downstream company names, or implied endorsement. The header keeps `/how-it-works` as its sole public informational route beside Log in and the primary `Request an account` action. The invite-only waiting-list flow explains qualified capacity, managed execution, and pre-shipment quality evidence before collecting company and work details. The former account-free `/simple-quote` workflow has been retired; approved customers submit RFQs through `/requests/new`. Legacy `GUEST_SIMPLE_QUOTE` request-origin fields remain in the data model only for compatibility with existing records.
- Admin quote issuance can now capture a structured selected Chinese shop quote alongside the received supplier quote attachment: shop details plus pricing and lead-time line items entered once in the quote pricing section. Supplier quote total and overall lead time are calculated from those line items plus shipping inputs. Purchased orders with a selected structured supplier quote can render an order-specific DOC-002 supplier purchase order PDF at `/admin/orders/[requestId]/supplier-purchase-order.pdf`; old orders or selected supplier quotes without structured line items show a pending supplier PO state instead of generating a PO from customer prices or an unstructured attachment.
- Admins can archive placed orders from `/admin/orders`. Archived orders keep `status: PURCHASED` and are hidden from the active admin placed-order list through `Request.isArchived`, preserving buyer/supplier lifecycle semantics and invoice eligibility.
- Purchased orders now use a shared manual Lattice progress record: status, assigned Lattice owner, next milestone/date, responsible party, tracking number, and customer-facing update. Admins publish updates from `/admin/orders/[requestId]`; customer dashboard, notifications, order list, and order detail read the same data and flag past milestones as overdue. Supplier/carrier integrations remain future enhancements to this same lifecycle.
- The customer dashboard now separates work from event history: `src/lib/customer-action-center.ts` derives prioritized multi-step workflows for supplier clarification, quote review/expiration, overdue milestones, and customer document review; `/dashboard` shows those workflows in Needs Attention plus a separate Recent Updates preview, while `/notifications` retains the complete chronological feed and is reachable from a global bell. V1 does not persist read state or manual checklist completion.
- Customer, admin, and supplier app spaces are role-aware at the session/proxy layer. Signed sessions carry an `admin`, `customer`, or `supplier` role; customers are redirected to `/dashboard`, admins to `/admin/quotes`, and suppliers to `/supplier/orders` when they attempt to enter another app family. Admin users can also operate customer routes such as `/dashboard`, `/requests/new`, `/quotes`, and `/orders` for development and customer-support simulation. The admin shell exposes a deliberate `Customer workspace` bridge, and admin sessions operating customer routes see an `Admin workspace` bridge back to `/admin/quotes`; customer-role sessions do not see the admin shortcut.
- Customer-facing RFQ, quote, order, checkout, invoice, and submitted-file access is scoped below the role guards by durable customer-company membership. `User` records carry a `WorkspaceRole` (`LATTICE_ADMIN`, `CUSTOMER_ADMIN`, or `CUSTOMER_MEMBER`), optional `companyId`, salted password credentials, verified-email-change state, and temporary-password state; every provisioned user at a customer company can access that company's work, while the Lattice Admin retains global support access. `/admin/customers` is the company-grouped user-management hub: the Lattice Admin can create a customer company and its first Customer Admin in one Clerk-synchronized operation, then add, remove, reset, assign Customer Admin/Member roles, request a verified email change, and open a clearly labelled support session as a provisioned customer user. That support session is company-scoped, is backed by the signed session cookie, and can exit back to the original Lattice Admin; it does not create separate per-tab browser authentication. The existing email remains active until the new inbox confirms its 24-hour single-use link. Passwords are never readable after issuance. Generated temporary passwords expire after 72 hours and force `/account/set-password` before normal workspace access; user-chosen reset-link and custom passwords clear that requirement. Password and Google sign-in both require a provisioned membership (apart from the local Lattice Admin bootstrap), and deleting a membership, changing a password, or confirming a new email invalidates the previous session. New customer RFQs are connected to the signed-in company. Suppliers remain operator-managed without platform access in this phase.
- Sensitive route handlers and server actions now enforce role checks directly through `src/lib/route-authorization.ts`, covering quote PDFs, invoice PDFs, supplier PO PDFs, admin quote workbooks/templates, CAD preview APIs, and role-specific mutations. Public simple-quote review and quote PDFs remain intentionally token-scoped instead of account-scoped.
- The product/services roadmap implementation is retained in source for future use, but `/roadmap` is currently hidden from customer navigation and customer-role access. Admins retain access for future internal review; interest data remains available through `RoadmapInterest` in Prisma or the local development fallback.
- `support@latticeos.co` is configured as a Google Workspace alias for receiving customer support requests, including customer sign-in-email-change requests, and is verified for Resend outbound delivery. A local delivery smoke test succeeded on 2026-08-20. Source now includes automated first-cohort invitation delivery from the Lattice Admin customer workflow, with password-free admin responses and durable `CustomerInvitation` sent/failed/revoked audit records; apply the schema and deploy before treating it as Production-ready. Workspace routes are protected by a signed HTTP-only session cookie; the login page presents work email and password together, with Google Workspace SSO through Google OAuth/OIDC available when configured. Durable Lattice/customer role and company membership records now hydrate server sessions and the Google callback; password recovery uses hashed single-use tokens and durable audit events. MFA/passkeys, SSO enforcement, session/device controls, and later activation-link hardening remain future work.

The current working vertical slice:

1. Buyer creates a request.
2. Buyer starts with a CAD file upload; before upload, `/requests/new` surfaces recoverable local draft RFQs and server-known in-progress RFQs so buyers can resume existing work before creating another request. Customer and manufacturing configuration fields are revealed after a file is attached, drag-and-drop or multi-select CAD upload creates one configurable line item per CAD file, buyers can upload additional CAD files from the request form to add more line items, and the material selector groups grades into Hubs/Protolabs Network-style broad families such as Aluminum, Stainless steel, Tool steel, Brass, Copper, Titanium, and plastics families. The request form can start an Autodesk Platform Services preview translation when APS credentials are configured. Draft RFQs persist selected CAD/drawing storage keys plus restorable Autodesk preview states so a refresh can recover the uploaded files and translated viewer from saved references when local draft storage is available; submitted RFQs persist CAD preview URNs for reusable static thumbnails.
3. Request form submits through the Next.js API layer, then redirects the buyer to the submitted quote detail route at `/quotes/[requestId]` so the RFQ immediately appears as a requested quote.
4. Local development stores submitted CAD/drawing file bytes in `.data/uploads` and attaches storage keys to the RFQ file records.
5. Request is validated/transformed by local business logic.
6. Prisma persists the request to PostgreSQL.
7. Draft customer quotes are visible from admin quote submissions in a separate draft table, including same-browser incomplete RFQ drafts and durable `DRAFT` requests.
8. Submitted requests appear in admin quote submissions, where admins open a minimal RFQ review drawer focused on downloading uploaded files, checking configured part details, and entering critical quote feedback: one unit price per configured part, lead time, shipping cost, shipping method, shipping terms, estimated delivery date, quote created date, quote valid-until date, and notes.
9. From the admin RFQ review drawer, operators can request more information from the customer or no-quote the RFQ with a required customer-facing note, attach received Chinese/overseas shop quote files, enter unit pricing, lead time, shipping cost, shipping terms, quote dates, delivery date, and quote notes in the app, then can export a request-specific Excel quote workbook at `/admin/quotes/[requestId]/quote-template.xlsx` and manually download the latest saved customer quote PDF at `/admin/quotes/[requestId]/quote.pdf`; both are populated from the saved RFQ, uploaded files, quote feedback, customer quote version, and shipping fields. Once a customer quote has been issued, the same admin drawer presents the saved quote data as read-only by default and exposes an explicit `Edit quote` action for correction/reissue work.
10. As of 2026-08-06, artificial seeded/demo RFQs are available only in mock mode. `src/lib/demo-requests.ts` provides a mature-account scenario with draft, clarification, supplier-ready, quoted, active production, quality-document, shipped, and delivered records so customer UI work can be exercised across the full lifecycle without entering customer mode.
11. The older, fuller customer quote packet builder still exists in code for future customer-facing quote version work, but the first admin RFQ review drawer is intentionally minimal.
12. Buyer quote rows at `/quotes` are split into in-progress RFQs and quote-received requests, show a compact first-part CAD preview with a `+N` badge for additional line items, and open a consistent quote detail template at `/quotes/[requestId]` with a status/next-step summary, responsive part-and-pricing rows, per-part CAD thumbnail previews when APS URNs are available, per-part unit prices, saved customer quote versions, lead time, files, activity, and purchase conversion. Buyer quote-request modification is intentionally deferred for now.
13. Buyers can reorder from purchased orders through `/requests/new?reorder=[requestId]`, which preloads the previous order as a new RFQ draft rather than mutating the original order.
14. Purchased quotes leave the buyer Quotes page and live in `/orders`; opening a purchased quote detail route redirects to the matching order detail. Purchased order detail surfaces expose customer invoice preview/download actions generated from the order's accepted quote, line items, shipping, tax, bill-to, ship-to snapshot, and captured checkout payment/PO context.
15. Buyer-facing quote lifecycle tags are `Draft`, `Quote Requested`, `Quote Received`, and `Archived`. Purchased work leaves Quotes for Orders, where the detailed lifecycle is `Awaiting supplier acknowledgment`, `In production`, `Quality review`, `Quality documents ready`, `Ready to ship`, `Shipping`, and `Delivered`. Admins manually record the next milestone and customer update until supplier/carrier integrations are introduced.
16. Admin surfaces use admin-native quote/order/customer/vendor routes and should not send operators into buyer-facing quote, order, or RFQ creation routes. If an admin needs to create an RFQ on behalf of a customer later, build a dedicated admin flow instead of reusing `/requests/new`.

Important routes:

- `/` - public invite-only landing page with Log in and Request access entry points.
- `/login` - public invite-only login page that keeps work email and password together, offers Google Workspace SSO when configured, and retains the interim local credential gate with accessible error and recovery behavior.
- `/forgot-password` - public password reset request page for the interim local credential gate; it does not reveal whether an email exists and records/sends reset instructions when supported.
- `/waiting-list` - public waiting list request page that writes local waitlist entries for admin review, blocks exact duplicate emails with an on-page notice, emails same-domain requesters with the existing waitlist contact, and triggers a thank-you email for new entries.
- `/how-it-works` - public account-safe one-pager explaining how approved accounts share overflow work, align a production plan, receive managed production coordination, and review requested quality documentation before shipment.
- `/dashboard` - command center/dashboard.
- `/requests/new` - buyer RFQ/request creation; supports `?reorder=[requestId]` to prefill a new RFQ draft from a prior purchased order.
- `/operator/requests` - redirects to `/admin/quotes`; the separate RFQ queue page was retired as redundant.
- `/operator/requests/[requestId]` - legacy deep links redirect to `/admin/quotes?requestId=...`; primary quote-submission review now lives in the admin quote command center.
- `/quotes` and `/quotes/[requestId]` - buyer quote/RFQ tracking, split into in-progress and quoted-request tables; purchased quotes are excluded and handled in orders.
- `/quotes/[requestId]/checkout` - buyer checkout step for quoted RFQs, collecting delivery, import/compliance, payment/PO, tax, and purchasing terms before order placement.
- `/orders`, `/orders/[requestId]`, `/orders/[requestId]/help`, and `/orders/[requestId]/invoice.pdf` - buyer order tracking, detail, order-specific help request, and placed-order customer invoice PDF preview/download.
- `/shipped` - buyer shipped-order tracking.
- `/notifications` - buyer platform notification center for RFQ, order, document, and action alerts.
- `/supplier/orders`, `/supplier/orders/[requestId]`, and `/supplier/orders/[requestId]/invoice.pdf` - supplier-facing order views and placed-order invoice PDF access.
- `/admin` - redirects to `/admin/quotes`; the standalone admin Overview page was retired so Quote Submissions is the admin home.
- `/admin/orders/[requestId]/invoice.pdf` - admin placed-order invoice PDF route using the same order-backed invoice renderer.
- `/admin/orders/[requestId]/supplier-purchase-order.pdf` - admin-only placed-order supplier PO PDF route using DOC-002 with the selected structured Chinese shop quote; `?preview=1` serves inline and the default response downloads the PDF.
- `/admin/customers` and `/admin/customers/[companyId]` - customer management, including a waiting list viewer.
- `/admin/vendors` and `/admin/vendors/[vendorId]` - Notion-database-inspired overseas vendor directory and detail records for shop contacts, onboarding status, capabilities, quality notes, RFQ history, and order coverage. Detail-page edits persist locally through `.data/admin-vendor-overrides.json` until full supplier/vendor database tables are introduced.
- `/admin/quotes` - admin quote submissions command center for RFQ review, status updates, supplier quote context, and customer quote issuance.
- `/admin/quotes/[requestId]/quote-template.xlsx` - admin download route for a data-connected customer quote Excel workbook generated from the selected RFQ.
- `/admin/quotes/[requestId]/quote.pdf` - admin manual-download route for the latest saved customer quote PDF generated from the selected RFQ and quote version.
- `/admin/orders` and `/admin/orders/[requestId]` - admin active placed-order management, archive action, and placed-order detail review inside the admin app.
- `/admin/material-inquiries` - admin review queue for customer-requested unlisted materials, including `New`, `Reviewing`, and `Resolved` workflow states plus internal supplier/sourcing notes.
- `/admin/resources` - admin resource library for downloadable and previewable internal templates and reference files. DOC-001 was retired on 2026-06-05; the page currently includes DOC-002 supplier purchase order PDF template, DOC-003 domestic customer invoice PDF template, and DOC-004 customer quote PDF template Rev 1. PDF templates render inline while retaining download behavior.
- `/materials` - customer-facing material catalog grouped by material family and subgroup. Its Aluminum directory renders normalized alloy offerings (for example, `6061 Aluminum`) with their supported conditions (`T6`, `T651`) rather than duplicate peer rows; raw source labels remain in internal datasets. Typical mechanical-property values are condition-specific and linked to public literature. When a supplier listing omits temper but a defensible reference exists, the page labels the stated temper/form as a reference condition rather than a supply guarantee; unsupported values remain blank. Vendor source/provenance stays out of this page and is retained only in internal repositories.
- `/materials/inquiry` - authenticated customer form for materials not represented in the catalog. It captures the designation/specification, company, desired stock form, quantity, application requirements, and notes; submissions persist through `MaterialInquiry` with a development `.data/material-inquiries.json` fallback and enter the admin review queue. Family search is intentionally absent from the Materials atlas.
- `/capabilities` - fabrication capabilities.
- `/equipment` - customer equipment catalog sourced from China machine-shop contacts. The current customer catalog is intentionally limited to CNC Milling, CNC Lathe, QC & Inspection, and Sheet Metal while the remaining process sections are withheld for photo/data cleanup. Every available image remains visible for visual reference; unverified or representative imagery carries a light-yellow `Photo pending verification` label, while confirmed same-model/actual-machine images carry their stronger classification. Compact qualification cards expose known capacity, supplier-reported precision, machine limits, best-fit guidance, technical data sheets, and an RFQ evaluation action; supplier identity, review dates, and source provenance stay in internal repositories.
- `/roadmap` - retained roadmap implementation, temporarily unavailable to customer accounts; admin access remains available for future review/reactivation.
- `/analytics` and `/projects` - placeholder/future modules.

Important folders:

- `src/app/` - Next.js App Router pages, nested routes, and API routes.
- `src/components/` - reusable UI components.
- `src/lib/` - business logic, typed data, persistence, and repository code.
- `prisma/` - database schema.
- `docs/` - product research, Bubble audit notes, and implementation plans.
- `docs/app-feature-map.md` - operator-facing map of app features, routes, data sources, maturity status, limitations, and maintenance checklist.
- `docs/completed-work-log.md` - daily completed-work log for cross-computer handoff history.
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
- customer-facing supplier-network trust signals should explain real capacity, precision claim basis, and process limits; vendor/source provenance belongs in admin/operator evidence views rather than customer cards
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
- `src/lib/session.ts`, `src/lib/workspace-user.ts`, `src/lib/route-authorization.ts`, `src/proxy.ts`, and `src/app/login/` - Clerk-managed authentication combined with Lattice's provisioned Prisma `User`/`Company` authorization. A verified Clerk identity is linked to a matching Lattice user on first sign-in; it does not create app access by itself.
- `src/lib/account-settings.ts` and `src/lib/account-settings-shared.ts` - server-visible manufacturing account defaults, browser-safe defaults/types, editable buyer company default, Stripe customer/payment-method lookup, and RFQ quote-contact snapshot helpers. Saved-card ownership is being migrated from the current user-scoped setup to the customer Company; future card-level user/role permissions are roadmap work.
- `src/lib/stripe.ts`, `src/lib/stripe-checkout.ts`, `src/components/stripe-elements-payment.tsx`, `src/app/api/stripe/webhook/route.ts`, `src/app/quotes/[requestId]/stripe/success`, and `src/app/quotes/[requestId]/stripe/cancel` - Stripe integration for inline card-only quote payments, setup-mode saved cards, webhook reconciliation, and buyer return/cancel handling.
- `src/components/request-form.tsx` - buyer RFQ form.
- `src/components/cad-upload-preview.tsx` and `src/components/autodesk-model-viewer.tsx` - upload-time CAD preview and Autodesk Viewer integration. Preview translation is asynchronous and should not block RFQ work; the embedded viewer exposes Autodesk native controls plus fit/full-screen shortcuts.
- `src/components/operator-queue.tsx` - operator request queue.
- `src/components/buyer-quotes.tsx` and `src/components/buyer-quote-detail.tsx` - buyer quote views.
- `src/components/buyer-orders.tsx` and `src/components/buyer-order-detail.tsx` - buyer order views.
- `src/components/supplier-orders.tsx` and `src/components/supplier-order-detail.tsx` - supplier order views.
- `src/components/supplier-quote-files.tsx` and `src/app/api/supplier-quote-files/route.ts` - internal Chinese/overseas shop quote attachment list, download links, and durable multipart upload route.
- `src/components/admin-*.tsx` - admin operation surfaces, including the quote-request overview dashboard and admin quote submissions command center.
- `resources/admin/`, `src/app/admin/resources/`, `src/app/admin/orders/[requestId]/supplier-purchase-order.pdf`, `src/lib/admin-document-templates.ts`, `src/lib/purchase-order-pdf.ts`, and `src/lib/invoice-pdf.ts` - internal admin template/reference files, generated workbook/PDF templates, order-specific supplier PO/invoice routes, preview models, and the admin resource-library download page/routes, including supplier purchase order PDF template, domestic invoice PDF template, and customer quote PDF template Rev 1.
- `docs/admin-document-templates.md` - durable source of truth for admin document template IDs, backing files, routes, reference assets, and usage rules, including DOC-001's retired status.
- `src/components/admin-vendor-database.tsx`, `src/components/admin-vendor-detail.tsx`, `src/lib/admin-vendors.ts`, and `src/lib/admin-vendor-overrides.ts` - overseas vendor database/detail UI, request-derived vendor summaries, and local persisted overrides for editable vendor-detail fields.
- `src/components/customer-quote-builder.tsx` and `src/lib/quote-file.ts` - customer-facing quote assembly, Markdown generation, and quote-version form helpers.
- `src/lib/quote-xlsx.ts` - dependency-free Excel workbook generator for data-connected customer quote templates.
- `src/lib/request-model.ts` - core request types, statuses, and transitions.
- `src/lib/request-persistence.ts` - app/database mapping.
- `src/lib/request-repository.ts` - database operations.
- `src/lib/data-mode.ts` and `src/lib/local-request-store.ts` - environment-driven customer/mock data-mode selection and development-only server-side RFQ fallback stores used when local Postgres is unavailable.
- `src/lib/local-file-storage.ts` and `/api/local-files/[...storageKey]` - temporary local CAD/drawing file storage and download path for development RFQs.
- `src/components/supplier-quote-files.tsx`, `src/app/admin/quotes/actions.ts`, and `SupplierQuoteAttachment` in `prisma/schema.prisma` - internal received supplier quote attachment upload/listing flow used by admin quote review and quote/order detail pages.
- `fixtures/demo-rfqs.json` - empty disabled RFQ fixture manifest retained only as a placeholder if isolated non-production test data is deliberately reintroduced.
- `src/lib/customer-action-center.ts`, `src/lib/customer-dashboard.ts`, and `src/lib/customer-notifications.ts` - operational buyer action-workflow, dashboard metric, Recent Updates, quote/order activity, and notification-history derivation from existing RFQ, quote, purchased-order, milestone, supplier update, shipping, tracking, and supplier document records. V1 does not add separate workflow/activity/read-state tables.
- `src/lib/product-roadmap.ts`, `src/lib/roadmap-interest.ts`, `src/components/product-roadmap-board.tsx`, and `src/app/roadmap/` - retained roadmap data, interest persistence, board, and guarded server action, currently withheld from customer access for later reactivation.
- `src/lib/autodesk-platform-services.ts` - APS authentication, OSS upload, Model Derivative translation, and viewer token helpers.
- `src/lib/request-queue.ts` - request filtering/sorting helper retained for repository-level admin quote request listing.
- `src/lib/catalog-data.ts` - materials/capabilities data.
- `src/lib/cnc-material-library.ts` - quote-selectable CNC material library researched from Fictiv, Hubs/Protolabs Network, and Xometry.
- `src/lib/material-grade-properties.ts`, `src/components/material-grade-directory.tsx`, `docs/material-mechanical-property-sources.md`, and `docs/material-machinability-coverage.md` - customer-facing, condition-specific mechanical-property and machinability records, alias resolution, public-source links, coverage, and held-blank research backlogs.
- `src/lib/vendor-materials.ts` - vendor-provided material offering repository with source document traceability for admin/operator use.
- `src/lib/customer-profiles.ts` - demo/customer profile data.
- `src/lib/vendor-source-documents.ts` and `docs/vendor-sources/` - vendor document archive metadata and received source files used to populate materials, equipment, capabilities, and reusable quality evidence.
- `src/lib/waiting-list.ts` - local JSON-backed waiting list request store and duplicate/same-domain detection for early admin review.
- `src/lib/waiting-list-email.ts` - waiting list thank-you and same-domain contact email composition and delivery; uses Resend when configured and a local outbox otherwise.
- `prisma/schema.prisma` - database model.

## Verification

Use the smallest verification set that matches the change risk. For meaningful workflow changes, prefer:

```bash
npm run typecheck
npm run lint
npm test
npm run dead-code
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
