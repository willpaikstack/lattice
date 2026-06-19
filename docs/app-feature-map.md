# Lattice OS App Feature Map

Last updated: 2026-06-18

This is the living map of what exists inside Lattice OS, how each area works, what data powers it, and what is still prototype or future work. Update this file whenever a feature is added, removed, renamed, moved to a new route, connected to a new data source, or promoted from static/prototype behavior to operational behavior.

## Status Key

- `Operational` - uses real app workflow data and is expected to work in local development when required services are configured.
- `Partial` - visible and useful, but still missing durable persistence, production storage, ownership checks, external service configuration, or other hardening.
- `Prototype` - useful as a design/product reference, but still partly static, local-only, or not the final workflow.
- `Placeholder` - route or module exists, but the feature is intentionally future-facing.

## Product Model

Lattice OS is a manufacturing RFQ, procurement, and supplier-network operating system. The app is organized around four spaces:

- Public and guest quote intake for prospects.
- Customer workspace for RFQs, quotes, orders, resources, and notifications.
- Admin workspace for internal RFQ review, quote issuance, customer/vendor management, orders, and documents.
- Supplier workspace for supplier order visibility and invoice access.

The current source-of-truth workflow is `Request`/`LatticeRequest`: a buyer submits an RFQ, Lattice reviews it, admin issues a quote, the buyer accepts or checks out, and the purchased request becomes an order.

## Public And Guest Features

| Feature | Routes | What It Does | Data Source | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Invite-only public entry | `/` | Public landing page with login and request-access entry points. | Static/public page plus auth links. | Operational | Intentionally minimal, not a marketing-heavy public site. |
| Login | `/login` | Authenticates users through the interim credential gate or Google Workspace SSO when configured. | Signed session cookie, Google OAuth env vars, local fallback auth. | Partial | Multi-user durable auth and role records remain future hardening. |
| Forgot password | `/forgot-password` | Supports password-reset request flow for the interim credential gate. | Password reset support where configured. | Partial | Does not reveal whether an email exists. |
| Waiting list | `/waiting-list` | Captures access requests and blocks exact duplicate emails. | Prisma/Neon when available, local fallback store in development, Resend/local outbox for email. | Operational | Production email sending still depends on Resend/domain setup. |
| Simple quote intake | `/simple-quote` | Account-free CAD-backed RFQ intake for one-off prospects. | Normal `Request` workflow with `requestOrigin: GUEST_SIMPLE_QUOTE`. | Partial | Guest lane exists, but production Stripe/Resend/storage configuration still needs hardening. |
| Simple quote confirmation | `/simple-quote/thanks` | Confirms guest RFQ submission. | Guest RFQ submission result. | Operational | Public confirmation page. |
| Guest quote review | `/simple-quote/[requestId]` | Lets a guest review a specific quote through a tokenized magic link. | Token-scoped request access. | Partial | Guest cannot enter the account workspace. |
| Guest quote PDF | `/simple-quote/[requestId]/quote.pdf` | Renders the customer quote PDF for a token-scoped guest quote. | Quote PDF renderer plus request/quote data. | Operational | Access is token-scoped, not session-role scoped. |
| Guest success | `/simple-quote/[requestId]/success` | Shows payment/order success after guest card payment. | Stripe checkout/payment result and request state. | Partial | Requires Stripe env/webhook configuration for production reliability. |

## Customer Workspace

| Feature | Routes | What It Does | Data Source | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Customer shell | Customer routes under `/dashboard`, `/requests`, `/quotes`, `/orders`, `/roadmap`, `/materials`, `/capabilities`, `/equipment`, `/notifications`, `/account/settings` | Provides the buyer-facing app frame, sidebar, role-aware admin bridge, and customer navigation. | Session role and app-shell components. | Operational | Admin sessions can operate customer routes for development/support simulation. |
| Dashboard command center | `/dashboard` | Shows KPI cards, Inbox, and quote/order activity. | `listBuyerQuotes()`, `listBuyerOrders()`, `buildCustomerDashboardSummary()`, exact-email customer ownership filter. | Operational | No separate dashboard table; values are derived from existing RFQ/order records and filtered to the signed-in customer's exact requester email unless the session is admin. |
| Dashboard Inbox | `/dashboard` | Shows the newest high-signal RFQ, quote, order, supplier update, shipping, and document events, including customer-facing `Request information` and `No quote` outcomes. Lower-level RFQ audit rows such as draft creation stay out of the dashboard Inbox. | `buildCustomerActivityFeed()` in `src/lib/customer-notifications.ts`, filtered by `buildCustomerDashboardSummary()`. | Operational | V1 has no persistent read/unread state; `Needs attention` comes from derived `actionRequired`. `Request information` is action-required; `No quote` is informational. Working spec: `docs/customer-inbox-notification-spec.md`. |
| Notification center | `/notifications` | Shows the full customer activity feed and attention counts, including lower-level RFQ history plus operator notes for request-info and no-quote outcomes. | Same derived feed source as the dashboard Inbox. | Operational | Should stay in sync with dashboard alerts while remaining more complete than the dashboard. Working spec: `docs/customer-inbox-notification-spec.md`. |
| New RFQ request | `/requests/new` | Upload-first RFQ creation with CAD files, multiple line items, material/process configuration, Hubs-aligned surface finish secondary choices, inspection/documentation choices, drawing-required validation, ship-to/requester snapshots, draft recovery, revise, and reorder flows. | Request form, RFQ option metadata, local draft upload storage, request API, Prisma/local fallback, exact-email ownership filter for revise/reorder/draft prefill. | Operational | Surface finishes expose only the relevant cosmetic requirement, color, or RAL/Pantone fields for each selected finish. Production file storage still needs R2/S3 replacement for local `.data/uploads`. |
| Buyer quotes list | `/quotes` | Shows active RFQs and quote-received records, excluding purchased quotes. | Buyer quote repository, lifecycle helper, exact-email ownership filter. | Operational | Purchased records live in Orders. Customer sessions see only matching requester-email records; admins see all for support. |
| Buyer quote detail | `/quotes/[requestId]` | Shows RFQ/quote detail, quote activity, CAD thumbnails when available, quote PDF, supplier quote basis, line pricing, purchase actions, and customer-facing operator notes for missing-info or no-quote outcomes. | Request record, customer quote versions, uploaded files, APS preview URNs, exact-email ownership policy. | Operational | Purchased quote detail redirects to order detail. Unauthorized customer direct URLs return not found. `NEEDS_INFO` reads as a clarification request; `CLOSED` with an operator note reads as `No quote` / unable to quote. |
| Quote revision | `/requests/new?revise=[requestId]` | Lets buyers create a new RFQ draft from an active priced or active non-final RFQ. | Existing request snapshot and draft request form. | Operational | The original request is not mutated. |
| Reorder | `/requests/new?reorder=[requestId]` | Starts a new RFQ draft from a previous purchased order. | Existing order snapshot and draft request form. | Partial | Good buyer convenience flow; lineage views can still improve. |
| Quote checkout | `/quotes/[requestId]/checkout` | Collects delivery/import details, payment or purchase-order information, and converts a quote to a purchased order after valid payment/PO checkout. | Stripe PaymentIntent/CardElement, purchase payment snapshot, customer PO attachment records, exact-email ownership policy. | Partial | Production Stripe env vars/webhook are required for live reliability. Server actions also enforce ownership before recording payment state or saving PO files. |
| Stripe return pages | `/quotes/[requestId]/stripe/success`, `/quotes/[requestId]/stripe/cancel` | Handles card payment return/cancel paths. | Stripe checkout/payment state. | Partial | Inline card checkout is primary; hosted redirect remains fallback. |
| Buyer orders list | `/orders` | Shows purchased orders. | Buyer order repository filtered from purchased requests, exact-email ownership filter. | Operational | Active post-purchase home for accepted quotes. |
| Buyer order detail | `/orders/[requestId]` | Shows purchased order detail, supplier/order status, shipment tracking, invoice actions, and order documentation. | Purchased request/order data, supplier order fields, tracking number helper, invoice renderer, exact-email ownership policy. | Operational | Unauthorized customer direct URLs return not found. Durable issued invoice records remain future accounting hardening. Package tracking links out to the detected carrier or a carrier search in V1. |
| Buyer order help | `/orders/[requestId]/help` | Provides an order-specific help/support route. | Order context. | Partial | Support workflow can be made more operational later. |
| Buyer invoice PDF | `/orders/[requestId]/invoice.pdf` | Renders order-specific customer invoice PDF. | Order-backed invoice renderer. | Operational | Uses repeatable order-derived invoice references; saved invoice issuance is future work. |
| Shipped orders | `/shipped` | Shows shipped-order tracking and tracking-number coverage. | Purchased orders with supplier status `SHIPPED`. | Operational | `Delivered` remains reserved until a durable delivery confirmation exists. |
| Account settings | `/account/settings` | Lets customer account defaults such as company and contact settings be managed. | Server account defaults with local fallback. | Partial | Durable multi-user/company ownership model is future hardening. |
| Product roadmap | `/roadmap` | Shows planned Lattice product and service investments and lets customers flag which items they are interested in. | Static roadmap item repository plus `RoadmapInterest` Prisma records with local `.data/roadmap-interests.json` fallback in development. | Partial | Production needs the new Prisma schema applied. Admin prioritization summaries can be expanded into an internal reporting view later. |
| Materials catalog | `/materials`, `/materials/design-directions` | Customer-facing material catalog grouped by broad marketplace-style families. | `src/lib/catalog-data.ts`, `src/lib/cnc-material-library.ts`, vendor material references. | Operational | Vendor provenance is kept internal rather than exposed to customers. |
| Capabilities catalog | `/capabilities` | Customer-facing manufacturing capability catalog. | Catalog data and app content. | Operational | Should stay manufacturing-specific, not generic marketing copy. |
| Equipment catalog | `/equipment` | Shows supplier-network equipment/capacity context. | Vendor equipment data and public equipment imagery. | Prototype | Useful source-provenance surface; durable supplier database is still future work. |

## Admin Workspace

| Feature | Routes | What It Does | Data Source | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Admin home redirect | `/admin` | Redirects legacy/admin-home traffic to Quote Submissions. | Next.js App Router redirect. | Operational | The standalone admin Overview page is retired; `/admin/quotes` is the active admin home. |
| Admin quote submissions | `/admin/quotes` | Primary RFQ review and quote-issuance command center. Admins inspect RFQs, request more customer information, no-quote unsupported RFQs, attach supplier quote files, select the quoted overseas vendor, enter pricing/lead time, issue customer quotes, and export quote documents. | Request repository, customer quote versions, supplier quote attachments, overseas vendor directory, local upload storage. | Operational | `Request information` sets `NEEDS_INFO`; `No quote` sets `CLOSED`; both require a customer-facing note stored in the existing operator review note field. Issued quotes are read-only by default with explicit edit/reissue mode; legacy `/operator/requests` and `/operator/requests/[requestId]` URLs redirect here. |
| Quote workbook export | `/admin/quotes/[requestId]/quote-template.xlsx` | Generates request-specific customer quote workbook. | RFQ, uploaded files, quote feedback, quote version, shipping fields. | Operational | Dependency-free workbook generator. |
| Admin quote PDF | `/admin/quotes/[requestId]/quote.pdf` | Downloads or previews the latest saved customer quote PDF. | Customer quote PDF renderer and saved quote version. | Operational | DOC-004 Rev 1 is frozen unless a Rev 2 iteration starts. |
| Admin orders list | `/admin/orders` | Shows active placed orders and lets admins archive placed orders. | Purchased request/order data and `Request.isArchived`. | Operational | Archiving does not change `status: PURCHASED`. |
| Admin order detail | `/admin/orders/[requestId]` | Reviews placed-order details in the admin app. | Purchased request/order data, supplier quote/order data, documents. | Operational | Supplier PO readiness depends on structured selected shop quote data. |
| Admin invoice PDF | `/admin/orders/[requestId]/invoice.pdf` | Renders the customer invoice PDF from accepted order data. | Same order-backed invoice renderer as customer route. | Operational | Saved immutable invoice issuance is future work. |
| Supplier purchase order PDF | `/admin/orders/[requestId]/supplier-purchase-order.pdf` | Generates DOC-002 supplier PO for the selected Chinese/overseas shop quote. | Accepted order plus structured selected supplier quote line items. | Operational | Does not generate from customer prices or unstructured supplier attachments. |
| Admin customers | `/admin/customers`, `/admin/customers/[companyId]` | Customer management and waiting list visibility. | Customer/company records, waiting-list data, request summaries. | Partial | Durable customer IDs exist; ownership-aware multi-user records remain future hardening. |
| Admin vendors | `/admin/vendors`, `/admin/vendors/[vendorId]` | Overseas vendor directory and detail records for shop contacts, onboarding, capabilities, quality notes, RFQ history, and order coverage. Seeded vendors include Shenzhen Precision, Dongguan Axis, Tainan Advanced, Jucheng Precision (JC Proto), Best Prototypes, and Zintilon. | Vendor repositories plus local `.data/admin-vendor-overrides.json`. | Prototype | Needs durable supplier/vendor tables for production. |
| Admin resources | `/admin/resources` | Internal resource library for generated and reference documents. | `resources/admin/`, generated document routes, template metadata. | Operational | Current library includes DOC-002, DOC-003, and DOC-004; DOC-001 is retired. |
| Admin resource document routes | `/admin/resources/domestic-invoice-template`, `/admin/resources/quote-template`, `/admin/resources/supplier-purchase-order-template` | Preview/download internal template documents. | Admin document template renderers. | Operational | Routes require admin authorization. |

## Supplier Workspace

| Feature | Routes | What It Does | Data Source | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Supplier orders | `/supplier/orders` | Supplier-facing order list. | Supplier-accessible purchased order records. | Partial | Route family exists; ownership-aware supplier access checks remain future hardening. |
| Supplier order detail | `/supplier/orders/[requestId]` | Supplier-facing order detail. | Supplier order data and purchased request context. | Partial | Supplier workflow is a future phase relative to customer/admin flow. |
| Supplier invoice PDF | `/supplier/orders/[requestId]/invoice.pdf` | Lets supplier route access placed-order invoice PDF where allowed. | Order-backed invoice renderer. | Partial | Requires supplier role authorization; ownership hardening remains future work. |

## Shared Workflow And Data Features

| Feature | Main Files/Routes | What It Does | Data Source | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Request persistence | `src/lib/request-repository.ts`, `src/lib/request-persistence.ts`, `src/app/api/requests/route.ts` | Saves and loads RFQs/orders through Prisma, with local fallback in development. | PostgreSQL/Prisma, `.data/requests.json` fallback. | Operational | Real shared persistence requires Postgres/Neon. |
| Request model and statuses | `src/lib/request-model.ts` | Defines RFQ/order status vocabulary and core request shapes. | TypeScript model plus Prisma schema mapping. | Operational | Buyer lifecycle tags are derived separately for customer-facing language. |
| Buyer lifecycle tags | `src/lib/buyer-lifecycle.ts` | Maps internal request/order states to customer-facing tags: Draft, Quote Requested, Quote Received, In Production, Shipping, Delivered, Archived. | Request and supplier order state. | Operational | `Delivered` is reserved until delivery confirmation exists. |
| Customer activity feed | `src/lib/customer-notifications.ts` | Derives notification rows from RFQ status events, customer quote versions, supplier updates, documents, and shipment state. | Existing request/order records only. | Operational | No activity table or read-state table in V1. Request-info and no-quote rows reuse RFQ status events and display the operator note from `operatorReview.internalNotes`. |
| Customer dashboard summary | `src/lib/customer-dashboard.ts` | Builds dashboard KPIs, Inbox rows, and quote/order activity rows for quote-received and order-placed events. | Buyer quotes and buyer orders. | Operational | Keep dashboard and notifications aligned through shared feed helpers. The old right-side order/contact card has been removed from `/dashboard`. |
| Roadmap interest signals | `src/lib/product-roadmap.ts`, `src/lib/roadmap-interest.ts`, `/roadmap` | Stores customer interest flags for upcoming roadmap items so prioritization can be reviewed. | `RoadmapInterest` Prisma model with local development fallback. | Partial | Current customer view shows aggregate counts; internal prioritization reporting is a future admin surface. |
| Package tracking links | `src/lib/package-tracking.ts`, `src/components/buyer-order-detail.tsx` | Detects common carrier formats from the supplier tracking number and exposes a `Track package` link from order detail. | Existing `supplierOrder.trackingNumber`. | Operational | V1 does not ingest carrier scan events; it links to the carrier or carrier-search page. |
| Local file storage | `src/lib/local-file-storage.ts`, `/api/local-files/[...storageKey]` | Stores and serves local development CAD, drawing, supplier quote, and customer PO files. | Gitignored `.data/uploads` plus `src/lib/request-access-policy.ts`. | Partial | Submitted RFQ files and customer PO files require admin or exact-email customer ownership. Supplier quote attachments are admin-only. Browser draft files under `rfq-drafts/...` remain customer/admin accessible until draft ownership is persisted. Production needs Cloudflare R2 or another S3-compatible bucket. |
| CAD previews | `src/lib/autodesk-platform-services.ts`, `/api/cad-previews/*`, viewer components | Supports Autodesk Platform Services upload, asynchronous translation, thumbnails, viewer tokens, and a focused native Autodesk toolbar for Measure, Explode Model, and Section Analysis. | APS credentials and stored preview URNs. | Partial | Requires APS env vars and ongoing camera/framing tuning. RFQ configuration and submission should not block on translation completion. |
| Supplier quote files | `/api/supplier-quote-files`, `src/components/supplier-quote-files.tsx` | Lets admins upload received Chinese/overseas shop quote files. | Local upload storage and `SupplierQuoteAttachment` records. | Operational | Production storage hardening still pending. |
| Quote PDF | `src/lib/quote-pdf.ts`, quote PDF routes | Generates customer quote PDFs. | Saved RFQ and quote version data. | Operational | DOC-004 Rev 1 is frozen. |
| Invoice PDF | `src/lib/invoice-pdf.ts`, invoice PDF routes | Generates customer/order invoice PDFs. | Purchased order data and payment/PO context. | Operational | Durable annual issued invoice records exist at schema/repository level but order downloads still render from order-derived references. |
| Supplier PO PDF | `src/lib/purchase-order-pdf.ts`, supplier PO route | Generates supplier-facing purchase order PDF from selected structured shop quote. | Accepted order and selected supplier quote line items. | Operational | Prevents customer-price leakage into supplier PO. |
| Stripe payments | `src/lib/stripe.ts`, `src/lib/stripe-checkout.ts`, `/api/stripe/webhook` | Handles card-only quote checkout and webhook reconciliation. | Stripe PaymentIntent/CardElement and env vars. | Partial | Production requires Stripe secrets, publishable key, webhook secret, and app base URL. |
| Email delivery | Waiting-list and guest quote email helpers | Sends or records waitlist and guest quote emails. | Resend when configured, local outbox fallback. | Partial | Production sender domain and Resend configuration are pending. |
| Role and route authorization | `src/lib/session.ts`, `src/lib/route-authorization.ts`, `src/lib/request-access-policy.ts`, `src/proxy.ts` | Separates customer, admin, and supplier app spaces, protects sensitive route handlers/actions, and applies interim customer record ownership by exact requester email. | Signed HTTP-only session cookie, role checks, request requester email. | Partial | Customer record ownership is implemented as an interim exact-email policy; durable company/customer ID membership and supplier awarded-shop ownership remain future hardening. |
| Google Workspace SSO | `/api/auth/google/*`, `src/lib/google-sso.ts` | Supports Google OAuth/OIDC login when configured. | Google SSO env vars. | Partial | Interim local credential gate remains as fallback. |

## Placeholder Or Future Modules

| Feature | Routes | Intended Direction | Status |
| --- | --- | --- | --- |
| Analytics | `/analytics` | Future metrics/reporting area for operations, buyers, or admins. | Placeholder |
| Projects | `/projects` | Future project/program grouping across RFQs and orders. | Placeholder |
| Durable activity/read state | Future schema/table | Persist true read/unread state, notification preferences, and first-class activity records. | Future |
| Durable supplier/vendor database | Future Prisma models | Promote local vendor overrides and source-trace data into production records. | Future |
| Durable ownership-aware access | Future repository helpers and schema links | Replace interim customer exact-email checks with durable customer/company membership and supplier awarded-shop checks. | Future |
| Delivery confirmation | Future order status/event | Promote shipped work into delivered state with durable confirmation. | Future |

## Maintenance Checklist

When a feature changes, update this document in the same work session if any of these changed:

- Route or navigation label.
- User role or workspace ownership.
- Data source or persistence layer.
- Status level, such as `Prototype` becoming `Operational`.
- Important limitation, security assumption, or production dependency.
- A feature is added, retired, renamed, or moved.

Also update `PROJECT_CONTEXT.md`, `DECISIONS.md`, or `TODO.md` when the change affects product direction, architecture, durable decisions, or next steps.
