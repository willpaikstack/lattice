# Decisions

Durable project decisions for Lattice OS. Add new entries at the top.

## 2026-08-11 - Route Unlisted Materials Through A Dedicated Inquiry Workflow

Decision: remove search from the family-level Materials atlas and route `Request an unlisted material` to a dedicated customer inquiry form. Persist each inquiry through PostgreSQL with a development-only local fallback, and expose an admin queue with `New`, `Reviewing`, and `Resolved` states plus internal sourcing notes.

Reason: the atlas is intended to help buyers browse established material families, while an unlisted material needs structured qualification before it can be treated as an RFQ-ready network offering. Sending that request directly into the CAD-first quote form loses the designation, stock-form, quantity, application, and sourcing context needed for responsible follow-up.

Implications:

- `/materials/inquiry` collects the material name, optional specification, company, stock form, quantity, application requirements, and additional notes from an authenticated customer/admin session.
- `/admin/material-inquiries` is the operator queue for supplier validation, internal notes, and workflow status.
- `MaterialInquiry` records belong in PostgreSQL for production and fall back to `.data/material-inquiries.json` only when Prisma is unavailable in development.
- Repeatable validated offerings can later be promoted into the customer catalog; an inquiry does not itself claim availability.

## 2026-08-10 - Present Plastics Through Functional Selection Traits

Decision: the customer-facing Plastics / polymers family guide does not display mechanical-property tables. Its curated common grades instead show a compact functional-selection rail: heat tolerance, moisture response, chemical resistance, and wear / friction. The long-tail directory likewise omits mechanical-property tables and directs the buyer to confirm the exact resin data sheet during RFQ review.

Reason: polymer performance varies materially with resin formulation, filler, grade, processing history, geometry, and service environment. A compact trait comparison is more useful during early material selection and avoids implying that a single typical property set is a design or procurement commitment.

Implications:

- Forms, machinability, applications, and selection guidance remain visible for plastics.
- Internal source-backed mechanical-property research is retained for audit and operator use, but it is not a customer-facing comparison surface for plastics.
- RFQ review remains the point at which the exact resin grade and data sheet are confirmed.

## 2026-08-09 - Show Canonical Material Grades, Not Supplier Label Variants

Decision: the customer-facing Materials catalog consolidates equivalent supplier and marketplace labels into one canonical material grade. For Aluminum, related temper variants are exposed within a single alloy offering rather than as peer rows; the selected condition governs any displayed reference properties. Other material families retain separate condition-specific rows until their offering relationships are curated.

Decision: when an Aluminum offering does not carry a supplier-listed temper but a trustworthy public reference is available for a specific condition and form, show that data only as a labelled **reference condition**. It is never presented as the network's supplied condition; the RFQ, drawing, and mill certificate remain authoritative.

Reason: duplicate naming makes the catalog look less credible, inflates availability counts, and creates avoidable research backlogs. Customers need an understandable set of available grades, while operators still need raw source labels for provenance.

Implications:

- The raw vendor and marketplace datasets remain unchanged and retain their original labels.
- `customer-material-catalog.ts` owns explicit, auditable alias mappings used only by the customer catalog.
- Customer-facing counts, search, and family headers derive from the normalized directory—not source-record totals or display-only common-grade lists.
- An Aluminum offering can show its supplier-supported conditions, but condition-specific properties must remain tied to the selected condition.
- Equivalence mappings must be explicit. Do not collapse a different temper, a dual-certified designation, or a near-equivalent grade without a documented technical basis.

## 2026-08-08 - Keep Equipment Provenance Internal And Qualify Precision Claims

Decision: the customer Equipment catalog presents part-fit signals, qualified precision claims, technical specifications, best-fit guidance, known limitations, technical data sheets, and an RFQ evaluation action. Supplier identity, source documents, review dates, and generic documentation-status badges remain internal admin metadata.

Reason: buyers need to decide whether a machine is a plausible fit and understand what a precision value means. Recordkeeping metadata does not answer those questions and can imply independent validation when Lattice has only received or reviewed supplier information.

Implications:

- Customer-facing tolerance and accuracy values must state their claim basis, such as `Supplier-reported capability`, and must not guarantee final-part results.
- Final manufacturability and achievable part tolerance are confirmed from the drawing, material, setup, fixturing, and inspection requirements during RFQ review.
- Equipment images must distinguish representative, same-model, and actual-machine imagery when that classification is known.
- Vendor documents, review metadata, and field-level provenance remain in internal repositories so operators can audit and improve the customer claims.
- Equipment specifications should be rendered from known values only; missing fields must not be replaced with invented placeholders or inferred capabilities.

## 2026-08-07 - Treat Standard Inspection As An Included RFQ Baseline

Decision: every customer RFQ includes Standard Inspection and the buyer cannot remove it. Optional inspection/documentation choices are limited to dimensional, formal dimensional, CMM, FAIR AS9102, custom inspection, and MTR; custom inspection scope is defined in Manufacturing notes and the selector links to a plain-language documentation guide.

Reason: a baseline inspection expectation should travel with every RFQ, while advanced requirements need explicit customer intent and enough context for Lattice to validate the supplier scope before quoting.

Implications:

- The customer selector must preserve `standard_inspection` when loading drafts and when changing optional choices.
- Drawing-dependent options continue to require a technical drawing.
- The app documentation must explain that CMM is a measurement method and a dimensional report is the resulting evidence.
- For larger production lots, critical dimensions are 100% inspected; non-critical dimensional checks use an RFQ-confirmed ISO 2859-1 / ANSI-ASQ Z1.4 sampling plan.
- Source Inspection and Build and Hold First Article Inspection are not customer-facing selector options for this workflow.

## 2026-08-06 - Separate Mock Data From Customer-Safe Workspace Data

Decision: runtime RFQ/order fallback data is selected by `LATTICE_DATA_MODE`, with `customer` and `mock` as the only supported modes. Customer mode hides artificial `demo_` and `fixture_` records and uses `.data/requests.json`; mock mode allows demo records and uses `.data/mock/requests.json`. Local development defaults to mock mode, while production refuses to run with mock mode enabled.

Reason: Lattice needs fast product/UI iteration against rich mock scenarios without contaminating the customer workspace with demo labels, placeholder names, persistence-test notes, or ambiguous fake states.

Implications:

- Customer-visible deployments must set or default to `LATTICE_DATA_MODE=customer`.
- Developers can run `npm run dev:customer` locally to inspect the pristine customer workspace on the same localhost URL.
- Mock data should be selected at the repository/fallback-store boundary, not filtered out inside presentation components.
- Future fixture or demo seeding should target `.data/mock/requests.json` or another explicitly mock-only data source.

## 2026-08-01 - Separate Customer Action Workflows From Notifications

Decision: the customer dashboard uses a workflow-based Action Center for unresolved work, while `/notifications` remains the chronological record of customer-facing events. An event can appear in notification history and also create one grouped action workflow, but reading a notification does not resolve the workflow.

Reason: customers need both a dependable operational history and a focused answer to “what needs my attention next?” A single mixed Inbox makes routine updates compete with clarification requests, quote decisions, expiring quotes, delayed milestones, and document requirements.

Implications:

- Action workflows are derived from current RFQ, quote, order, milestone, and document state in v1 and include priority, owner, due context, progress, and a short checklist.
- Related quote-review and quote-expiration conditions collapse into one workflow so customers do not receive duplicate tasks for the same decision.
- The dashboard shows a compact Recent Updates preview, while the global notification bell opens the complete notification history.
- Durable read/unread state, explicit checklist completion, user notification preferences, and email delivery remain future persistence work.

## 2026-08-01 - Start Order Progress With Manual Lattice Updates

Decision: Lattice operators are the initial authority for purchased-order progress. Operators update the shared order status, Lattice owner, next milestone, expected date, responsible party, tracking number, and customer-facing note from `/admin/orders/[requestId]`.

Reason: this establishes a dependable customer experience before supplier and carrier integrations are mature enough to be authoritative across the network.

Implications:

- The dashboard, customer order list, customer order detail, notification feed, and admin order detail read the same persisted order-progress fields.
- Order status advances through one ordered lifecycle: supplier acknowledgment, production, quality review, document readiness, shipment readiness, shipping, and delivered.
- A customer-facing note is required for manual Lattice updates, and past expected milestones are surfaced as customer alerts.
- Supplier/carrier integrations can later write through the same lifecycle after Lattice defines validation and override policy.

## 2026-08-01 - Use Direct Credential Entry With Optional SSO

Decision: `/login` should present work email and password together on a single screen. Google Workspace SSO remains an optional alternative when configured, while the interim password fallback remains available until Lattice selects and commissions its durable production identity platform.

Reason: users expect a direct credential form when they sign in with a password. Requiring an email-only intermediate step adds friction without providing enough value for Lattice's current authentication model.

Implications:

- Login errors preserve the entered email and intended protected destination instead of clearing the form or dropping deep-link context.
- Configured Google SSO receives the entered work email as a login hint and preserves it through recoverable OAuth failures.
- Password and recovery forms expose explicit pending states, accessible error/status messages, password visibility, and support paths.
- This experience improvement does not make the interim hard-coded password account a production identity system; durable users, organization membership, enforced SSO, MFA/passkeys, provisioning, session controls, and audit events remain required before enterprise rollout.

## 2026-06-20 - Defer Buyer Quote Request Modification

Decision: remove buyer-facing quote request modification for now. Customer quote detail should not expose `Modify quote request`, `/quotes/[requestId]/modify`, or legacy `/requests/new?revise=[requestId]` flows.

Reason: the modification workflow adds product and operational complexity before it is worth supporting. Lattice can revisit it later with a clearer end-to-end design for customer changes, admin notification, quote invalidation, and supplier-network rework.

Implications:

- Existing quote detail pages focus on review, status, quote PDF, purchase actions, and activity rather than modification.
- `/requests/new` remains for new RFQs, draft recovery, and reorder prefill from purchased orders.
- Admin quote submissions no longer surface `Modification requested` badges or summaries from revision metadata.
- The 2026-06-04 decision to expose edit/resubmit for active non-final quotes is superseded.

## 2026-06-18 - Use Exact Requester Email As Interim Customer Access Control

Decision: until durable company membership is implemented, customer-facing RFQ, quote, order, checkout, invoice, and submitted-file access is scoped by the signed-in user's email. Only exact requester email matches are allowed for customer users. Admins retain support access to all customer records.

Reason: manual QC confirmed that role-only customer access allowed cross-company quote URLs and storage-key downloads. Exact requester email ownership closes the immediate privacy gap without a schema migration and matches the v1 product decision that a customer user belongs to one company/account context.

Implications:

- `buyer@acme.com` can access RFQs submitted by `buyer@acme.com`; `teammate@acme.com`, `other@gmail.com`, and all other customer emails cannot access those RFQs until durable company membership is implemented.
- Customer and supplier users receive not-found behavior for records or local files they are not allowed to access, reducing record-existence disclosure.
- Supplier quote attachments are admin-only in the local file route unless a future workflow intentionally releases them.
- Draft upload files under `rfq-drafts/...` remain available to customer/admin sessions because they are browser-draft artifacts that do not yet have a persisted RFQ owner.
- This is an interim policy. The durable target remains one-primary-company customer membership and supplier awarded-shop ownership checks.

## 2026-06-18 - Reuse RFQ Statuses For Request Info And No Quote

Decision: admin RFQ response outcomes use the existing `NEEDS_INFO` and `CLOSED` request statuses for `Request information` and `No quote`, with the customer-facing operator note stored in `operatorReview.internalNotes`.

Reason: the app already has a durable request status model and quote activity feed. Reusing it gives customers immediate in-app visibility on quote detail, dashboard Inbox, and notifications without adding a notification table or schema migration before the workflow is validated.

Implications:

- `Request information` remains action-required for the buyer and should read as a clarification request.
- `No quote` is informational/status-only and should read as `No quote` or `Unable to quote`, not generic archive language.
- Future work can introduce first-class customer reply, email delivery, no-quote reason fields, and durable notification/read-state tables if needed.

## 2026-06-17 - Capture Customer Roadmap Interest Server-Side

Decision: customer roadmap interest flags are saved as server-side `RoadmapInterest` records, with a local `.data/roadmap-interests.json` development fallback, rather than only storing the selection in the browser.

Reason: the roadmap page exists to inform Lattice prioritization. Browser-only interest state would make the UI feel responsive but would not give operators a durable demand signal to review.

Implications:

- `/roadmap` is a customer workspace route protected like other customer routes.
- Roadmap items live in `src/lib/product-roadmap.ts`; customer selections are written through `src/lib/roadmap-interest.ts`.
- Production databases need the new Prisma model applied before live customer interest signals are durable.
- A future admin/reporting surface can aggregate `RoadmapInterest` records for prioritization review.

## 2026-06-17 - Keep A Daily Completed-Work Log

Decision: `docs/completed-work-log.md` is the running daily record of meaningful tasks, features, fixes, and documentation updates completed for Lattice OS.

Reason: William works on Lattice OS across multiple computers, and local chat history is not reliable project memory. A concise date-keyed completion log preserves what changed each day without mixing completed work into `TODO.md`.

Implications:

- Future substantial sessions should append a dated entry to `docs/completed-work-log.md` before handoff.
- The log should capture completed work only; open tasks, blockers, and next actions stay in `TODO.md`.
- When feature behavior changes, agents should update both the completed-work log and `docs/app-feature-map.md` in the same session.

## 2026-06-17 - Maintain An Operator-Facing App Feature Map

Decision: `docs/app-feature-map.md` is the running operator-facing feature map for Lattice OS. It lists app areas, routes, feature behavior, data sources, maturity status, limitations, and future hardening work.

Reason: `PROJECT_CONTEXT.md` is optimized for agent/developer memory, while William also needs a clear product manual for what the app does and how each feature works.

Implications:

- Future feature changes should update `docs/app-feature-map.md` in the same work session when routes, behavior, data sources, status, or limitations change.
- `AGENTS.md`, `README.md`, `PROJECT_CONTEXT.md`, and `TODO.md` now point agents back to the feature map so it does not drift.
- Durable architecture/product decisions still belong in this file; detailed next work still belongs in `TODO.md`.

## 2026-06-16 - Derive Buyer Dashboard Activity From Existing Request Records

Decision: `/dashboard` and `/notifications` use `src/lib/customer-dashboard.ts` and `src/lib/customer-notifications.ts` to derive buyer metrics, inbox rows, quote/order activity, and alerts from existing RFQ, customer quote, purchased-order, supplier update, shipment, tracking, and supplier document records.

Reason: the buyer home page should be operational instead of showing contact/mock rows, but the current product can prove the feed shape without adding a new activity table or durable read-state schema.

Implications:

- The dashboard selected table is `Transactions`, populated from latest quoted and purchased records.
- The dashboard right-side card is `Recent activity`, not an order-contact panel.
- Quote-ready and needs-info RFQs are unread derived alerts linking to `/quotes/[requestId]`.
- Purchased order, supplier update, document, tracking, and shipped events link to `/orders/[requestId]`.
- Durable read/unread state and first-class activity records remain future work once the derived feed behavior is validated.

## 2026-06-15 - Require Server-Side Guards On Sensitive Routes And Actions

Decision: sensitive document route handlers, internal resource downloads, Autodesk CAD preview APIs, and role-specific mutation server actions must enforce session roles at the handler/action boundary instead of relying only on the Next.js proxy redirect layer.

Reason: the proxy is an optimistic navigation guard and can intentionally skip API routes and dotted document URLs such as quote PDFs, invoice PDFs, supplier PO PDFs, and quote workbooks. Sensitive RFQ, quote, invoice, supplier, CAD-preview, and admin mutation paths need direct server-side authorization so unauthenticated users cannot retrieve artifacts or invoke mutations by URL.

Implications:

- `src/lib/route-authorization.ts` is the shared route/action authorization helper.
- Account/customer document routes allow customer or admin roles; admin document/resource routes require admin; supplier document routes require supplier.
- Public simple-quote quote access remains token-protected rather than account-protected.
- The next hardening layer remains ownership-aware access checks so authenticated customers and suppliers only see records assigned to their company or shop.

## 2026-06-15 - Add Account-Free Simple Quote Lane

Decision: keep the main Lattice app invite-only while adding a public `/simple-quote` lane for one-off CAD-backed RFQs. Guest requests persist as normal `Request` records with `requestOrigin: GUEST_SIMPLE_QUOTE`, receive quote-ready magic links by email, and can pay only by credit card through Stripe.

Reason: Lattice needs a lower-friction path for prospects who need a simple manufacturing quote but should not get workspace access, saved cards, purchase-order checkout, or account quote/order history.

Implications:

- Guest RFQs appear in the existing admin quote submissions workflow instead of a separate lead inbox.
- Guest quote access is scoped to one request by a random token stored only as a hash with an expiry.
- Admin quote issuance generates a fresh guest quote link and sends it through the Resend/local-outbox email path.
- Guest checkout uses Stripe card PaymentIntents without requiring an account Stripe customer.
- Protected portal routes remain account-only; public guest routes live under `/simple-quote`.

## 2026-06-15 - Use Stripe Card Element For Operational Card Payments

Decision: replace the fake saved-card quote checkout path with Stripe's inline card-only Element backed by a card-only PaymentIntent. Card orders collect card details on the Lattice checkout page through Stripe-managed fields and only convert from `QUOTED` to `PURCHASED` after Stripe confirms a successful card payment. Account payment-method setup uses Stripe Checkout setup mode, and local Lattice records keep only non-sensitive Stripe customer/payment metadata.

Reason: Lattice needs operational card payment without storing raw card data, while the buyer checkout should stay in one dense B2B order form instead of adding a separate redirect step. The dynamic Stripe Payment Element exposed Bank and Klarna options that are not appropriate for the current quoted RFQ checkout, so quote checkout uses a card-only Element instead. PO checkout remains available for approved buyers.

Implications:

- Required runtime env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, and `APP_BASE_URL`.
- Configure the Stripe webhook endpoint at `/api/stripe/webhook` for production and preview environments.
- Quote checkout creates a Stripe PaymentIntent with `payment_method_types: ["card"]` and renders Stripe's `CardElement` inline, so Bank, Klarna, and other dynamic payment methods do not appear.
- The older hosted Checkout redirect flow remains only as a server-side fallback path and should not be the primary buyer card UX.
- Card checkout charges the full accepted quote total immediately; partial capture, authorization-only flows, and manual payment review are future decisions.
- Webhook and success-route finalization must stay idempotent so Stripe retries cannot double-convert an order.
- Lattice should continue storing only card brand/last4/holder/expiry snapshots plus Stripe IDs needed for reconciliation.

## 2026-06-15 - Generate Supplier POs Only From Structured Selected Shop Quotes

Decision: order-specific supplier purchase order PDFs should render from the accepted order plus the selected Chinese shop quote's structured line items, not from customer quote prices or an unstructured supplier quote attachment.

Reason: supplier POs are release documents issued to the machine shop. They must use supplier-side unit costs, lead times, drawing/revision labels, inspection scope, and shop notes so Lattice does not accidentally expose customer markup or issue a misleading manufacturing instruction.

Implications:

- `SupplierQuote.lineItems` stores the selected shop quote line-item snapshot used for supplier PO generation.
- The generic DOC-002 resource remains a sample/template preview at `/admin/resources/supplier-purchase-order-template`.
- Purchased orders can render `/admin/orders/[requestId]/supplier-purchase-order.pdf` only when a selected supplier quote has structured line items.
- Existing supplier quote PDF attachments remain backup/source evidence; they do not by themselves make the supplier PO ready.
- Admin order detail shows a pending supplier PO message when structured supplier quote data is missing.

## 2026-06-15 - Persist Checkout Payment Choice On Purchased Orders

Decision: buyer quote checkout should let approved accounts place an order with either a saved credit card reference or a purchase order. The selected payment path is persisted on the purchased request/order, and purchase order checkout requires a PO number, AP email, and uploaded PO document.

Reason: order, invoice, and admin review flows need the buyer's actual acceptance/payment context instead of treating checkout as a status-only conversion.

Implications:

- Card checkout stores only non-sensitive saved-card metadata such as card ID, brand, last four, holder, and expiry; no raw card details are collected.
- Purchase order checkout stores the customer PO number, AP email, buyer notes, and a `CustomerPurchaseOrderAttachment` file metadata record.
- Order invoice PDFs prefer the captured customer PO number when present.
- Local development stores uploaded customer PO files under `.data/uploads/customer-purchase-orders`; production still needs the broader R2/S3 storage hardening.

## 2026-06-12 - Show Issued Admin Quotes As Read-Only

Decision: once a customer quote has been issued, the admin quote drawer should display the saved quote data as read-only by default instead of immediately rendering editable pricing, shipping, validity, and customer-note inputs. Operators can explicitly click `Edit quote` to enter a correction/reissue mode.

Reason: issued quotes are customer-facing commercial records. Operators need to inspect exactly what was issued without the UI implying that the current detail drawer is an active edit form.

Implications:

- `QUOTED` RFQs with a saved customer quote version show static unit prices, lead times, shipping fields, quote validity, and customer notes in the admin drawer until an operator chooses to edit.
- Supplier quote upload/removal controls are hidden in the default issued-quote view; existing supplier quote attachments remain visible and downloadable.
- The explicit edit mode restores editable controls and should save a new customer quote version when submitted.

## 2026-06-10 - Tag Every Quote With The Expanded Buyer Lifecycle

Decision: buyer-facing quote lifecycle tags are `Draft`, `Quote Requested`, `Quote Received`, `In Production`, `Shipping`, `Delivered`, and `Archived`.

Reason: quote surfaces need a visible customer-facing status on every row, including RFQs that have been submitted but not yet priced. The previous four-status vocabulary left submitted/internal-review rows visually untagged and did not cover the post-purchase lifecycle language buyers expect.

Implications:

- `Draft` means the customer has not clicked Request Quote yet.
- `Quote Requested` covers submitted RFQs, needs-info RFQs, and RFQs ready for supplier quoting while Lattice is still working toward a customer quote.
- `Quote Received` means price and lead time have been issued and the customer decision is pending.
- `In Production` applies to purchased work before shipment, including supplier acknowledgment, production, QC, document upload, and ready-to-ship states.
- `Shipping` applies when the supplier order is marked shipped.
- `Delivered` is reserved until Lattice stores a durable delivery-confirmation event or supplier/order status.
- `Archived` applies to archived or closed quote/order records.

## 2026-06-09 - Make Customer RFQ Intake Batch-Part Friendly

Decision: `/requests/new` should treat each uploaded CAD file as a separate configurable RFQ line item, including when buyers drag/drop or select multiple CAD files at once, and the buyer material picker should use broad Hubs/Protolabs Network-style material families instead of nested metallurgy subgroups.

Reason: customers need a clean quote-configuration experience where every part file becomes a visible configuration card and common material families are easy to scan. Hubs-style grouping keeps Aluminum 2014, Aluminum 2017A, and similar grades under a familiar Aluminum family without forcing buyers through series-level taxonomy.

Implications:

- The CAD upload box accepts drag/drop and multi-file selection for supported CAD extensions.
- The first CAD file fills the current quote line item and additional CAD files create additional line-item configuration cards.
- Draft RFQ storage starts as soon as CAD files are selected and stores each line item's uploaded file reference when local draft upload storage is available.
- The material selector remains searchable, but its browse groups are broad customer-facing families such as Aluminum, Alloy steel, Mild steel, Stainless steel, Tool steel, Brass, Copper, Titanium, Bronze, Inconel, Other Metals, and plastics families.
- Submitted RFQs continue flowing through `/api/requests` so the admin quote-submissions app receives the same customer-configured line items and uploaded file records.

## 2026-06-08 - Isolate Customer, Admin, And Supplier App Spaces

Decision: customer, admin, and supplier experiences should be treated as isolated app spaces, with data shared through server-side workflow and repositories rather than accidental cross-app navigation. During active development, admin sessions may also operate the customer app so operators/developers can test buyer workflows without switching accounts.

Reason: Lattice should behave more like Xometry, where customers manage their own RFQs/orders in a customer portal while employees/account managers use a separate internal console to manage orders, vendors, supplier quotes, and customer relationships.

Implications:

- Signed sessions now carry a role: `admin`, `customer`, or `supplier`.
- Route protection redirects customer and supplier users to their role home when they attempt to enter another app family.
- Admin users land on `/admin`, customers on `/dashboard`, and suppliers on `/supplier/orders`.
- Admin users can also access customer routes such as `/dashboard`, `/requests/new`, `/quotes`, and `/orders` for development and customer-support simulation; they cannot access supplier routes unless separately modeled.
- The admin shell exposes a deliberate `Customer workspace` bridge for development. When an admin session is operating customer routes, the customer shell exposes an `Admin workspace` bridge back to `/admin`; customer-role sessions do not see this shortcut.
- Admin pages should link only to admin-native destinations such as `/admin/quotes`, `/admin/orders`, `/admin/customers`, and `/admin/vendors`.
- Customer RFQ submission and draft-upload APIs accept customer or admin roles; internal request listing, supplier quote upload, and admin vendor edits require an admin role.
- The next hardening step is durable multi-user role assignment and ownership-aware data access for customer/company and supplier/vendor records.

## 2026-06-08 - Allow Admins To Issue Updated Customer Quote Versions

Decision: admins can edit a customer quote after it has already been submitted to the customer, and submitting the edited commercial terms creates the next customer quote version for that RFQ.

Reason: operators need a direct correction path when pricing, lead time, shipping, or notes change after the first customer quote is sent. Requiring a new RFQ revision for operator-side quote corrections is too heavy for commercial quote maintenance.

Implications:

- Submitted `QUOTED` RFQs keep editable quote line item and quote feedback controls in the admin quote drawer.
- Saving edited terms appends a new `CustomerQuoteVersion` while updating the buyer-facing quote summary fields on the request.
- Purchased and closed requests remain blocked from new customer quote issuance.
- The quote PDF link continues to point at the latest saved customer quote.

## 2026-06-06 - Promote Draft Uploads Into Submitted RFQ Storage

Decision: when a submitted RFQ references CAD or drawing files saved under `rfq-drafts/...`, `/api/requests` copies those files into the permanent `rfq/...` upload namespace before persisting the request.

Reason: incomplete draft storage is useful for reopening a browser draft, but submitted quote packages must not depend on a draft-only file location. CAD files and technical drawings should follow the submitted RFQ record as durable uploaded files.

Implications:

- New draft uploads still save immediately under `.data/uploads/rfq-drafts/<date>/...` for local draft recovery.
- Submission promotes any draft-backed CAD/PDF metadata into `.data/uploads/rfq/<date>/...` and persists the promoted `storageKey`.
- Older filename-only drafts still cannot recover missing file bytes and require a replacement upload.
- Production still needs Cloudflare R2 or another S3-compatible storage backend to replace the current local upload bridge.

## 2026-06-06 - Archive Admin Orders Without Changing Purchase Status

Decision: archive placed orders with `Request.isArchived` instead of changing `status` away from `PURCHASED`.

Reason: archiving is an internal admin list-management action, while purchased status still drives invoice rendering, buyer/supplier order semantics, and order history.

Implications:

- `/admin/orders` lists purchased orders where `isArchived` is false.
- The archive action hides an order from the active admin order table without deleting it.
- Buyer and supplier order lifecycle status remains intact.
- Local and production databases need `npm run db:push` after Postgres is reachable to apply `Request.isArchived`.

## 2026-06-05 - Attach Received Supplier Quote Files To RFQs And Orders

Decision: store the quote file received from a Chinese/overseas machine shop as an internal supplier quote attachment on the request/order record.

Reason: operators need traceability between the customer quote/order and the underlying overseas supplier quote used for pricing, lead time, and supplier selection.

Implications:

- `LatticeRequest.supplierQuoteFiles` tracks attached received supplier quote files.
- Prisma now has `SupplierQuoteAttachment`, related to `Request`, with file metadata and optional local storage key.
- Supplier quote uploads post through the multipart route handler at `/api/supplier-quote-files` so the uploaded bytes and request metadata persist across reloads.
- Development uploads save bytes under `.data/uploads/supplier-quotes` and continue to use the existing `/api/local-files/[...storageKey]` download route.
- The upload/list surface appears in the admin quote drawer and quote/order detail pages so the attachment follows the RFQ into the order lifecycle.
- Local and production databases need `npm run db:push` after Postgres is reachable.

## 2026-06-05 - Make Buyer Company An Editable Account Default

Decision: store the default RFQ buyer company in account settings as `companyName` instead of hardcoding `Amogy Manufacturing` in the RFQ form.

Reason: users need to control the company name that appears on future RFQs, quotes, and order records without editing code or patching submitted request data.

Implications:

- `/account/settings` exposes a Buyer company edit row in Account Settings.
- New `/requests/new` RFQs default the Company Name field from saved account settings.
- Revisions, reorders, and reopened drafts preserve the source request's company for audit continuity.
- `AccountDefaults.companyName` must be applied to local/production databases with Prisma where Postgres is available.

## 2026-06-05 - Render Invoices Only For Purchased Orders

Decision: customer invoice PDFs can be rendered and downloaded for `PURCHASED` orders from buyer, admin, and supplier order invoice routes, using the accepted quote/order snapshot as the source.

Reason: operators and order participants need invoice artifacts once a quote has been placed as an order, but repeated preview/download requests should not accidentally issue new accounting records.

Implications:

- `/orders/[requestId]/invoice.pdf`, `/admin/orders/[requestId]/invoice.pdf`, and `/supplier/orders/[requestId]/invoice.pdf` return PDFs only when the request status is `PURCHASED`.
- `?preview=1` serves the same PDF inline; the default response downloads it as an attachment.
- The current order-backed invoice renderer uses stable order-derived invoice references for repeatable rendering.
- Future accounting work should connect these order invoice routes to durable issued `Invoice` records and annual `INV-YYYY-000001` invoice numbers without creating duplicate invoices on repeated downloads.

## 2026-06-05 - Retire DOC-001 From Admin Resources

Decision: remove DOC-001, the standalone customer quote Excel template, from `/admin/resources` and delete `/admin/resources/customer-quote-template`.

Reason: the active customer quote reference is now DOC-004 Rev 1, and keeping DOC-001 in the resource library creates a redundant quote-template choice.

Implications:

- `/admin/resources` now lists DOC-002, DOC-003, and DOC-004 only.
- The historical workbook file can remain as source material for `/admin/quotes/[requestId]/quote-template.xlsx` until that export path is replaced or explicitly retired.
- Future quote-template work should treat DOC-004 as the active resource-library quote template unless William revives an editable workbook resource.

## 2026-06-05 - Add Google Workspace SSO To The Existing Session Gate

Decision: add Google Workspace SSO using Google OAuth 2.0 / OpenID Connect route handlers while retaining the interim local password login as a fallback.

Reason: Lattice needs to move away from the single-account credential gate toward durable multi-user authentication. Google Workspace SSO gives a practical first production auth path for controlled company access without introducing a large auth dependency yet.

Implications:

- `/login` now offers "Continue with Google Workspace" and preserves safe `next` redirects for both SSO and password login.
- `/api/auth/google` starts the OAuth flow with signed state and nonce cookies.
- `/api/auth/google/callback` exchanges the authorization code, verifies the Google ID token signature and claims, checks verified email, and enforces configured Workspace domains through the `hd` claim.
- `GOOGLE_SSO_CLIENT_ID`, `GOOGLE_SSO_CLIENT_SECRET`, `GOOGLE_SSO_ALLOWED_DOMAINS`, and `GOOGLE_SSO_REDIRECT_URI` configure the integration.
- The signed session cookie can now represent Google-backed users as well as the original password user.

## 2026-06-05 - Use Database-Backed Customer IDs

Decision: customer-facing customer IDs should use a durable global sequence in the format `CUST-000001`, stored on `Company.customerId`.

Reason: Prisma `Company.id` is an internal implementation identifier. Customer IDs appear on invoices and customer-facing documents, so they need to be stable, short, human-readable, unique, and decoupled from database internals.

Implications:

- `CustomerSequence` stores the next global customer number.
- `Company.customerId` stores the customer-facing ID once assigned.
- `ensureCustomerIdForCompany` returns an existing customer ID or assigns the next one transactionally.
- Customer IDs do not reset yearly; they remain continuous across the lifetime of the customer base.

## 2026-06-05 - Use Database-Backed Annual Invoice IDs

Decision: issued customer invoices should receive a durable sequential invoice ID in the format `INV-YYYY-000001`, allocated inside a database transaction.

Reason: invoice IDs are accounting records, not visual-template placeholders. They need to be unique, human-readable, stable across PDF re-downloads, and safe against two invoices being issued at the same time.

Implications:

- `InvoiceSequence` stores the next number for each calendar year.
- `Invoice` stores the issued invoice record, customer/order snapshot, totals, status, and generated invoice ID.
- `issueInvoiceForRequest` allocates the next annual sequence and creates the invoice record in one transaction.
- The DOC-003 template preview keeps placeholder `INV-[######]` and must not allocate a real invoice ID.

## 2026-06-05 - Make DOC-002 A PDF-First Supplier PO Template

Decision: DOC-002 should operate as a generated supplier-facing purchase order PDF, visible in the `/admin/resources` PDF viewer, instead of the supplier PO workbook being the primary release artifact.

Reason: supplier POs should behave like quote and invoice PDFs: app-owned accepted-order, supplier, file-release, inspection, pricing, and logistics data should produce a controlled release document. Excel can remain as an internal scaffold/reference, but the supplier-facing output should be PDF-first for layout consistency, version control, and release reliability.

Implications:

- `/admin/resources/supplier-purchase-order-template` now returns `nexus-supplier-purchase-order-template.pdf`, with `?preview=1` serving the same PDF inline.
- DOC-002 has a supplier purchase order face and a supplier PO terms/release-checklist page in the generated PDF.
- Future supplier PO generation should connect accepted order and awarded supplier data into the PDF renderer rather than asking operators to edit an Excel file as the source of truth.
- The previous two-sheet supplier PO workbook remains available in code as a reference scaffold if useful, but is no longer the operational DOC-002 output.

## 2026-06-05 - Make DOC-003 A PDF-First Invoice Template

Decision: DOC-003 should operate as a generated customer-facing invoice PDF, visible in the `/admin/resources` PDF viewer, instead of the invoice workbook being the primary operational artifact.

Reason: invoices should behave like quote PDFs: app-owned order, PO, tax, payment, and remittance data should produce a controlled customer document. Excel remains useful as an internal scaffold/reference, but the customer-facing output should be PDF-first for layout consistency, version control, and billing reliability.

Implications:

- `/admin/resources/domestic-invoice-template` now returns `nexus-domestic-invoice-template.pdf`, with `?preview=1` serving the same PDF inline.
- DOC-003 has an invoice face and remittance-instructions page in the generated PDF.
- Future invoice generation should connect accepted order data into the PDF renderer rather than asking operators to edit an Excel file as the source of truth.
- The 2026-06-04 three-sheet invoice workbook decision is superseded for operational DOC-003 output; the workbook structure can remain as a reference scaffold if useful.

## 2026-06-04 - Use A Three-Sheet Domestic Invoice Packet

Decision: DOC-003 should be a three-sheet workbook: customer-facing invoice, remittance instructions, and invoice terms.

Reason: the Protolabs and Fictiv invoice references separate operational invoice fields from payment/remittance details while still keeping invoice number, date, PO, sales order, terms, bill-to/ship-to, line items, sales tax, and amount due visible on the main invoice face.

Implications:

- The `Invoice` sheet is the primary customer-facing page for invoice identifiers, PO/order references, bill-to/ship-to, line items, subtotal, shipping/freight, sales tax, amount paid, and amount due.
- The `Remittance` sheet carries ACH/wire/check placeholders, lockbox/courier details, payment references, and AP notes.
- The `Invoice Terms` sheet carries standard payment, scope, tax/freight, dispute, late payment, and confidentiality language.
- Future generated invoice PDFs should preserve this separation unless William explicitly chooses a one-page invoice format.

## 2026-06-04 - Let Buyers Revise Active Non-Final Quotes

Superseded by `2026-06-20 - Defer Buyer Quote Request Modification`.

Decision: active buyer quotes/RFQs in `SUBMITTED`, `NEEDS_INFO`, `READY_FOR_SUPPLIER_RFQ`, or `QUOTED` status should expose an edit/resubmit action that opens `/requests/new?revise=[requestId]` as a prefilled new RFQ request.

Reason: customers may need to change quantity, material, finish, timing, notes, or uploaded files before Lattice finishes quoting, or after seeing price and lead time, without mutating the original submitted/auditable record.

Implications:

- The original quote/RFQ remains an auditable record; revision starts as a new RFQ submission.
- Revision drafts copy the existing part, saved CAD/drawing file storage references, configuration, quantity, due-date basis, and notes, but buyers still review and resubmit through the normal RFQ intake.
- Buyers do not need to reupload saved files when revising; reupload is required only for intentional replacements or older records that only contain filenames without storage keys.
- Future durable revision lineage can link the new RFQ back to the original quoted request when quote-history/version reporting needs it.

## 2026-06-04 - Freeze Customer Quote PDF Template Rev 1

Decision: freeze the current generated customer quote PDF as **DOC-004 Rev 1**.

Reason: William approved the current Hubs-inspired quote PDF direction, including embedded Arial/Arial Bold typography, dark slate text, blue email links, underlined section headings, compact quote/production detail blocks, the line-item table, notes, manufacturing assumptions, and the General Terms closing address block.

Implications:

- `/admin/resources/quote-template` is the Rev 1 reference template and downloads as `lattice-os-customer-quote-template-rev-1.pdf`.
- `/admin/quotes/[requestId]/quote.pdf` should continue using this Rev 1 renderer for customer quote outputs until William explicitly starts Rev 2 changes.
- Future quote PDF design changes should be tracked as Rev 2 or later, not silently folded into the Rev 1 baseline.

## 2026-06-04 - Snapshot Account Defaults Onto Submitted RFQs

Decision: store manufacturing account defaults server-side and snapshot requester contact plus ship-to details onto each RFQ at submission time.

Reason: customer quote PDFs are generated on the server, so browser-only account settings cannot reliably populate quote contact blocks. RFQ quote documents also need historical accuracy; later account setting edits should not silently rewrite old quote contact/address data unless an operator deliberately updates that RFQ.

Implications:

- Account settings keep the browser localStorage bridge for continuity but also persist through a server action into Prisma when available, with `.data/account-settings.json` as the local fallback.
- Submitted RFQs now persist requester email, requester phone, ship-to name, company, address, and phone fields.
- Quote PDF and Excel generation read contact and ship-to details from the RFQ snapshot.
- Existing local fallback RFQs may need one-time backfills when they were submitted before these fields existed.

## 2026-06-04 - Use DOC-001 Excel As Quote Source Of Truth

Decision: use `resources/admin/lattice-os-zintilon-quote-template.xlsx` as the source of truth for customer quote workbooks and Excel-derived PDFs instead of recreating the quote layout in code.

Status: superseded for the admin resource library by the 2026-06-05 DOC-001 retirement decision. The workbook may still serve request-specific quote workbook generation until that path is replaced.

Reason: the hand-built PDF approximation missed too much of the written content in the template, especially manufacturing assumptions and the full general terms. The app should fill the live quote values into DOC-001 while preserving the template's styling, merged cells, formulas, assumptions, and terms text.

Implications:

- `/admin/quotes/[requestId]/quote-template.xlsx` clones and patches the DOC-001 workbook with quote number, dates, customer fields, line items, unit prices, lead time, shipping, notes, and totals.
- Quote PDF routes should first attempt to convert that filled workbook to PDF; PDFKit remains only a fallback when no spreadsheet converter is installed.
- Exact template-matching PDF output requires LibreOffice/soffice or an equivalent spreadsheet-to-PDF converter in local and production environments.
- Future quote template edits should happen in the Excel source file and then be validated through the generated workbook/PDF routes.

## 2026-06-03 - Generate Manual Customer Quote PDFs

Decision: generate customer quote PDFs from the latest saved RFQ quote data through a manual admin download route, `/admin/quotes/[requestId]/quote.pdf`, while keeping the editable Excel quote template and generated workbook available for formatting/reference.

Reason: operators need a customer-sendable quote document after entering unit prices, lead time, shipping, quote dates, and notes in `/admin/quotes`. William wants the format to emulate Fictiv most closely, branded as Lattice OS, with the current banner, address, `mfg@latticeos.co`, `Latticeos.co`, and 100% payment in advance.

Implications:

- Quote PDFs are generated on demand for manual download; the app does not email, externally send, or durably store PDF files yet.
- The editable/reference quote assets live under `resources/admin/`, including the Fictiv reference PDF and Lattice OS banner image.
- Customer quote artifacts should consistently use Lattice OS as the prepared-by identity and explicitly exclude tax, tariffs, import duties, customs brokerage, and special inspection documents unless listed.

## 2026-06-03 - Use Airbnb-Inspired Admin Colors

Decision: change the admin visual identity from the earlier peach palette to an Airbnb-inspired scheme using Rausch coral `#FF5A5F`, pale Rausch tints, Babu teal `#00A699`-based success states, Arches orange `#FC642D` for warning accents, and neutral grays `#484848` and `#767676`.

Reason: the admin app should keep its distinct internal identity while using a more polished, recognizable color system with stronger primary actions and cleaner neutral contrast.

Implications:

- Admin shell, navigation, quote operations, vendor, customer, order, resource, and quote-builder surfaces should use the Rausch/tint/neutral palette.
- Customer-facing app surfaces remain on the existing light operations palette unless deliberately changed.
- The previous `#FFD3AC` peach direction is superseded for admin UI styling.

## 2026-06-03 - Commission Quotes With Real Submitted Data

Decision: remove artificial seeded/demo RFQ records from the active quote workflow and keep only real submitted quote records, starting with the aluminum plate RFQ submitted by William.

Reason: the quote workflow is moving from UI/demo validation into real commissioning. Artificial records in the database, local fallback store, or runtime fallbacks make it harder to tell what needs real operator action.

Implications:

- Runtime request fallbacks should use `.data/requests.json` only, without merging hardcoded demo quote records.
- Request and customer listing code should ignore retired `demo_` and `fixture_` RFQ IDs if they still exist in an old local database.
- RFQ fixture seeding should stay disabled unless deliberately reintroduced for isolated test/demo environments.

## 2026-06-03 - Preview Admin Document Templates In App

Decision: make `/admin/resources` show in-app viewers for each document template, including workbook-style sheet previews for Excel templates and an inline preview mode for the quote PDF reference.

Reason: operators should be able to inspect template structure, sections, and input fields before downloading files. The admin app should remain the primary interface for understanding and using quote, supplier PO, and invoice templates.

Implications:

- Workbook previews should reuse the same sheet data and input-cell logic used by generated Excel files.
- Yellow highlighting in previews marks operator-editable cells, matching the internal workbook convention.
- PDF resources can use an inline preview route while preserving attachment download behavior for download buttons.

## 2026-06-03 - Add Supplier PO And Domestic Invoice Templates

Decision: extend `/admin/resources` with generated editable Excel templates for supplier purchase orders sent to Chinese machine shops and domestic invoices sent to domestic machine shops or customers.

Reason: the quote template establishes the customer-facing commercial offer, but Lattice also needs consistent downstream documents for releasing accepted work to overseas suppliers and billing domestic customers against accepted POs or order milestones.

Implications:

- Supplier PO templates should keep supplier-facing manufacturing release details, supplier pricing, logistics, inspection documents, payment terms, and release checks together.
- Domestic invoice templates should align invoice line items with the accepted quote, customer PO, Lattice order record, tax/freight/tariff treatment, and AP follow-up notes.
- Generated workbook templates live in `src/lib/admin-document-templates.ts` and download through protected admin resource routes.
- `docs/admin-document-templates.md` records when operators should use each template and what to verify before sending.

## 2026-06-03 - Generate Quote Workbooks From Live RFQ Data

Decision: connect the customer quote Excel template to `/admin/quotes` by generating a request-specific workbook from the selected RFQ, rather than asking operators to manually copy values from the app into the static template.

Status: DOC-001 was later changed on 2026-06-03 to use the Zintilon/Hubs-inspired single-tab customer quote template for manual PDF export. The request-specific `/admin/quotes/[requestId]/quote-template.xlsx` route still generates a data-connected workbook from live RFQ data.

Current status: the standalone DOC-001 resource was retired on 2026-06-05 and removed from `/admin/resources`.

Reason: the quote template should remain useful as an editable Excel/PDF-export tool, but customer, file, line-item, pricing, lead-time, and shipping values already live in Lattice. Prefilling them reduces transcription errors and keeps quote artifacts tied to the durable RFQ record.

Implications:

- Do not show DOC-001 as an active `/admin/resources` template unless William explicitly revives it.
- Use `/admin/quotes/[requestId]/quote-template.xlsx` for data-connected quote workbooks.
- Keep generated workbooks dependency-light and server-side so the route works in the existing Next.js app without browser spreadsheet tooling.
- Treat the admin app as the primary data-entry surface; generated workbooks are exports/reference artifacts.
- Highlight internal workbook input/source cells yellow while keeping customer-facing sheets and PDFs clean.

## 2026-06-03 - Track Safe Demo RFQ Fixtures In Git

Decision: add a Git-tracked `fixtures/` area and `npm run seed:fixtures` command for safe demo/test part files and stable local RFQs.

Status: superseded later on 2026-06-03 by the real-data commissioning decision above; RFQ fixture seeding is now disabled.

Reason: while Lattice OS is still in development, William needs a small set of sample RFQ uploads to travel with the repo across computers. The app's real local upload folder remains gitignored, so curated fixtures give repeatable test data without committing every scratch upload.

Implications:

- Only non-sensitive, small demo CAD/drawing files belong in `fixtures/`.
- The seed command copies fixture files into `.data/uploads/fixtures` and writes stable RFQs into `.data/requests.json`.
- When local Postgres is reachable, the seed command also attempts to seed the same RFQs into the database so fixtures appear whether the app is using Prisma or the local fallback store.
- Real customer/vendor CAD files should continue to stay out of Git; use R2/S3 or another object store for production-style shared uploads.

## 2026-06-03 - Keep Admin Templates In A Resources Library

Decision: add `/admin/resources` as an internal resource library for operator-facing templates and reference files, starting with a copied quote PDF template served through a protected admin route.

Reason: quote-format references should live near the admin quoting workflow instead of being scattered across downloads or chat history. Operators need a stable place to download templates while shaping and reviewing customer quote output.

Implications:

- Store internal resource assets under `resources/admin/` rather than exposing them as raw public files.
- Serve downloadable resources through admin routes such as `/admin/resources/quote-template`.
- Add future quote, RFQ, supplier, and order templates to this page when they become part of the operating workflow.

## 2026-06-02 - Keep The First Admin RFQ Review Drawer Minimal

Decision: simplify the `/admin/quotes` RFQ drawer around the operator's immediate quoting task: download uploaded files, review configured part details, and enter one unit price per configured part, lead time, shipping cost, shipping method, shipping terms, estimated delivery date, quote created date, quote valid-until date, and quote notes.

Reason: the previous drawer exposed too much packet, readiness, supplier, and quote-builder detail before the basic quote-feedback loop was ergonomic. The first admin workflow should make it fast to inspect the submitted RFQ package and capture the critical commercial response.

Implications:

- The drawer should avoid broad worksheet/status/history panels until those fields are truly needed in the workflow.
- Uploaded CAD/drawing files with local storage keys should show direct download actions.
- Quote feedback saves create a durable customer quote version, mark the request as `QUOTED`, and persist per-part unit prices, aggregate part-production total, lead time, shipping cost, shipping method, shipping terms, quote dates, delivery date, and notes.
- The fuller customer quote packet/version builder can be reintroduced deliberately later instead of being the default first review experience.

## 2026-06-02 - Use Gitignored Local RFQ File Storage As A Temporary Bridge

Decision: store submitted CAD and technical drawing file bytes in `.data/uploads/rfq/<date>/...` for the local app and persist the resulting `UploadedFile.storageKey` with each RFQ file record.

Reason: operators need actual uploaded files during local RFQ testing before production object storage is configured. The app already had an optional `storageKey` column, so a local filesystem bridge gives immediate usefulness without committing to the final storage provider.

Implications:

- Local submitted RFQs now use multipart form data so CAD and drawing files can be saved with the request.
- `.data/` remains gitignored and should not be treated as shared cross-computer or production storage.
- `/api/local-files/[...storageKey]` can serve stored local files back for download during development.
- Production still needs Cloudflare R2 or another S3-compatible object store for durable uploaded CAD/drawing files.
- Autodesk APS preview uploads remain separate from RFQ file storage; APS stores preview-translated CAD assets, while local storage keeps the submitted RFQ package bytes.

## 2026-06-02 - Use A Dedicated CNC Material Library For RFQ Selection

Decision: drive the buyer RFQ material dropdown from a researched CNC material library covering Fictiv, Hubs/Protolabs Network, and Xometry offerings, while preserving legacy option values for saved drafts and reorders.

Reason: buyers need to select the same breadth of CNC materials they expect from modern manufacturing networks, and the previous Bubble-era dropdown was too narrow for real RFQ intake.

Implications:

- `src/lib/cnc-material-library.ts` is the source for customer-selectable CNC material options.
- `rfqMaterialOptions` derives from the CNC library and keeps source metadata for future auditing and filtering.
- The `/requests/new` material control should remain searchable because the option set is now large.
- Internal vendor-source material repositories remain separate from marketplace research so supplier traceability is not confused with public competitor catalog coverage.

## 2026-06-02 - Add Local Single-Account Credential Gate

Decision: protect Lattice OS workspace routes with a local credential login using a signed HTTP-only session cookie and Next.js `proxy.ts` route checks.

Reason: the previous login form accepted any input and routed directly to `/dashboard`. The app needs a real access screen even before a full multi-user identity provider is selected.

Implications:

- `/login` validates the configured local account before creating a session.
- Unauthenticated access to workspace, admin, operator, supplier, quote, order, materials, equipment, and account routes redirects to `/login`.
- The current account is `will@latticeos.co`; the password hash is stored in local auth code rather than the plaintext password.
- This is an interim gate, not the final production identity model. Future work should move users, password changes, roles, audit trails, and recovery/MFA into durable auth infrastructure.

## 2026-06-02 - Purchased Quotes Move To Orders

Decision: keep purchased work out of the buyer `/quotes` list and route purchased quote detail URLs to the corresponding `/orders/[requestId]` page.

Reason: once a quote is accepted, the buyer's primary job is order tracking rather than quote review. Mixing purchased orders into the quote list makes the customer and admin quote views look inconsistent and blurs the lifecycle boundary.

Implications:

- The buyer Quotes page should separate active quote work into in-progress requests and quoted requests.
- `PURCHASED` records should appear in Orders, not in the buyer quote tracker.
- Admin quote submissions can continue focusing on active RFQ/quote work and exclude purchased orders.
- Quote history may remain accessible from order detail in the future, but the primary navigation home for purchased work is Orders.

## 2026-06-02 - Customer Quote Statuses Are Draft, Quote Received, Ordered, Closed

Decision: customer-facing quote status vocabulary was limited to `Draft`, `Quote received`, `Ordered`, and `Closed`. Superseded by the 2026-06-10 expanded buyer lifecycle.

Reason: buyers need a simple commercial quote lifecycle, while admins still need more granular internal RFQ workflow states such as submitted, needs-info, and supplier-ready.

Implications:

- `Draft` means the customer has not clicked Request Quote yet.
- `Quote received` means price and lead time have been issued and the customer decision is pending.
- `Ordered` means the quote converted into an order and production/order tracking owns the workflow.
- `Closed` means the quote was rejected, declined, or closed by the customer/admin because of cost, lead time, or capability fit.
- Internal RFQ states may still drive admin queues, but should not be shown as quote statuses on customer quote surfaces.

## 2026-06-02 - Launch On Vercel And Neon First

Decision: use Vercel for the first public production deployment and Neon Postgres for the production database, while keeping storage/email/auth provider work separate and incremental.

Reason: this gets the Next.js app publicly reachable with low operational overhead and low early cost. AWS remains a later option if Lattice needs deeper infrastructure control, enterprise cloud consolidation, or heavier file-storage workflows.

Implications:

- Keep the Vercel project connected to GitHub so pushes can trigger deployments.
- Keep production database state in Neon and use Prisma to manage the schema.
- Use `.vercelignore` so local `.env` files are not uploaded by CLI deployments.
- Add Cloudflare R2/S3-compatible storage, Resend, custom domain, and real auth as the next launch-hardening steps.
- Revisit AWS only if scale, compliance, procurement, or infrastructure-control needs justify the added operational complexity.

## 2026-06-01 - Public Entry Uses The Figma AI Technical Visual System

Decision: keep `/` and `/login` on the Figma AI-designed dark technical public-entry visual system, while the authenticated product remains a light B2B operations console.

Reason: the public entry pages should feel private, polished, and manufacturing-specific before the user enters the operational workspace. This gives the first impression more craft without turning the internal RFQ, quote, and order screens into marketing pages.

Implications:

- `/` and `/login` may use the dark grid/technical drawing background, centered public header, and invite-only access language.
- The primary public choices remain constrained to logging in or requesting access.
- Authenticated workspace pages should continue using the light operational app shell and dense, scannable UI patterns.

## 2026-05-31 - Collapse Buyer Quote Statuses To Customer-Simple Labels

Decision: buyer-facing quote surfaces should use simplified customer labels rather than exposing the full internal RFQ lifecycle.

Reason: customers need a simple quote-state model even though the internal RFQ workflow has more granular operational states such as submitted, needs information, supplier review, quoted, and purchased.

Implications:

- Use the 2026-06-10 buyer lifecycle taxonomy: `Draft`, `Quote Requested`, `Quote Received`, `In Production`, `Shipping`, `Delivered`, and `Archived`.
- Keep submitted, needs-info, and supplier-review as internal RFQ workflow states, but expose them to buyers through the grouped `Quote Requested` lifecycle tag.
- Per the 2026-06-02 purchased-quotes decision, purchased records leave buyer quote surfaces and live in Orders.
- Keep granular internal statuses available for admin/operator workflows, notifications, and routing logic, but avoid exposing them as customer quote statuses on quote pages.

## 2026-05-30 - Position Lattice As A Machine-Shop Supplier Network

Decision: position Lattice OS as a machine-shop-focused supplier-network platform, similar in spirit to Xometry, Fictiv, Hubs, or Protolabs, backed by William's China machine-shop contacts.

Reason: the core value is helping domestic companies and machine shops accept work they might otherwise no-quote because they are at capacity, lack specific machines, lack available materials, lack labor, or want to advertise capabilities fulfilled through the Lattice supplier network without taking on additional CAPEX.

Implications:

- Customer-facing catalog pages such as `/equipment`, `/materials`, and `/capabilities` should prove real network capacity and limits, not just market broad capability labels.
- Equipment and material data sourced from supplier contacts should keep provenance and documentation available for operator/admin trust.
- RFQ workflows should increasingly help users decide whether the Lattice network can support a job that would otherwise be turned away.
- UI language should make the supplier-network and overflow/no-quote recovery use case clear without turning operational app pages into marketing landing pages.

## 2026-05-29 - Centralize RFQ Review And Quote Issuance In Quote Submissions

Decision: make `/admin/quotes` the primary admin command center for RFQ review, status updates, supplier quote context, and customer quote issuance.

Reason: admins need one place to understand an RFQ, update its internal state, compare supplier quote basis, and issue or revise the buyer-facing quote. Sending users between quote submissions, operator request details, and a separate builder creates unnecessary workflow fragmentation.

Implications:

- Quote submission rows should open an admin-owned RFQ command drawer rather than linking admins out to the operator detail route.
- The drawer should keep review controls, buyer intake, line items, uploaded files, status history, supplier quote basis, and customer quote builder together.
- Saving review decisions or customer quote versions should return admins to `/admin/quotes` and revalidate buyer quote/detail surfaces.
- `/operator/requests/[requestId]` can remain as a focused legacy review route until it is no longer useful.

## 2026-05-29 - Persist Customer Quote Versions On RFQs

Decision: save customer-facing quotes as durable `CustomerQuoteVersion` records linked to the original RFQ request.

Reason: quote issuance needs to be auditable and reusable across buyer quote detail, admin follow-up, purchase conversion, and future PDF/email delivery. A generated Markdown file alone is not enough source of truth.

Implications:

- Each saved quote records its quote number, version number, validity dates, customer fields, line-item pricing snapshot, Markdown output, total value, and issued timestamp.
- Saving a quote moves the RFQ to `QUOTED`, stores the current quote summary/price/lead time on the request, and appends the normal status event when the status changes.
- Buyer quote detail pages should prefer the latest saved customer quote version when showing the quote reference, total, notes, line-item pricing, and customer-ready Markdown.
- The quote assembly UI should ultimately live inside the quote submissions workflow per the standalone-builder retirement decision.

## 2026-05-29 - Retire The Separate RFQ Queue Page

Decision: remove RFQ Queue as a separate admin navigation/page surface and redirect `/operator/requests` to `/admin/quotes`.

Reason: Quote Submissions already serves as the admin RFQ intake and supplier quote management queue. Keeping a separate RFQ Queue creates duplicate operational surfaces for the same work.

Implications:

- Admin navigation should point operators to Quote Submissions for RFQ intake and quote work.
- Existing operator request detail routes may continue to support focused review screens until quote submission detail pages absorb that workflow.
- Future queue/filter work should land in `/admin/quotes` rather than reviving a separate `/operator/requests` list page.

## 2026-05-29 - Retire The Standalone Quote Builder Page

Decision: remove the dedicated `/admin/quotes/builder` admin page and keep quote assembly anchored in the quote submissions workflow.

Reason: customer quotes should be put together from the quote submission context where RFQ details, supplier quote status, pricing, and buyer follow-up already live. A separate builder page creates an unnecessary second place to manage the same quote lifecycle.

Implications:

- `/admin/quotes` should become the single admin surface for quote submission management and future customer quote issuance.
- Operator request detail pages should route admins back to quote submissions for quote work instead of linking to a standalone builder.
- Quote generation helpers may remain as implementation utilities, but the user-facing workflow should not expose a separate Quote Builder nav item or page.

## 2026-05-29 - Preserve Vendor Source Traceability For Catalog Data

Decision: keep received vendor documents in `docs/vendor-sources/`, register them in `src/lib/vendor-source-documents.ts`, and link material/equipment records back to stable source document IDs for admin/operator traceability.

Reason: customer-facing material and equipment output should be standardized, but internal users need to audit which vendor supplied each claim and which document it came from.

Implications:

- Customer-facing views should avoid exposing noisy vendor provenance unless it helps the workflow.
- Admin/operator views and repositories should preserve vendor, document title/date, received date, local source path, and extraction notes.
- When missing values are filled from external lookup rather than a vendor document, the repository record should note that external-source dependency.
- New reusable vendor documents should be copied into a vendor-specific folder at `docs/vendor-sources/<vendor-slug>/` and added to the source document registry before derived data is expanded. The archive instructions live in `docs/vendor-sources/README.md`; RFQ- and order-specific files remain in workflow storage.

## 2026-05-29 - Separate Overseas Vendor Management From Customers

Decision: add `/admin/vendors` as a dedicated overseas vendor database surface instead of burying shop information inside customer profiles, quote submissions, or equipment catalogs.

Reason: Lattice operators need one place to scan overseas partner contacts, capabilities, quality notes, RFQ response history, selected orders, lead times, payment terms, and shipping lanes while routing RFQs and managing supplier follow-up.

Implications:

- Keep the page table-first and property-driven, using Notion Databases as the UX reference for views, filters, scannable rows, and side-panel details.
- Derive current demo metrics from request supplier quotes and selected supplier orders until durable vendor records exist.
- Later supplier/vendor persistence should feed this page rather than replacing it with a competing admin surface.

## 2026-06-05 - Persist Vendor Detail Edits Locally Until Supplier Tables Exist

Decision: save editable `/admin/vendors/[vendorId]` fields and purchase-history rows to a gitignored local override file at `.data/admin-vendor-overrides.json`.

Reason: operators need vendor detail edits to survive page reloads now, but the durable supplier/vendor database model is still a future schema step.

Implications:

- Keep RFQ/order performance metrics derived from real request data, then overlay only manually edited vendor-directory fields.
- Treat the local override file as a development bridge, not the final supplier system of record.
- When supplier/vendor tables are added, migrate these override fields into Prisma-backed records and retire the JSON bridge.

## 2026-05-27 - Keep Buyer RFQ Intake Upload-First

Decision: keep `/requests/new` as an upload-first RFQ flow where the detailed quote configuration stays locked until a CAD file is attached.

Reason: the Bubble prototype's request quote page reveals additional configuration after file upload, which makes the first step obvious and keeps buyers from facing a long form before anchoring the request to a part file.

Implications:

- Customer details, material, tolerance, finish, quantity, and documentation fields should appear after file selection/drop.
- Empty-state copy should guide buyers to upload a CAD/drawing file first.
- Post-upload UI should show a part mockup, pre-configured manufacturability parameters, and an optional technical drawing upload.
- Multi-file support should preserve this progressive disclosure pattern by adding another configurable CAD-backed line item after each additional part upload.

## 2026-05-27 - Treat Customer Dashboard Inbox As Notification Center

Decision: make the buyer `/dashboard` inbox a customer-facing notification center for order changes, RFQ status updates, uploaded quality documents, and buyer action items.

Reason: the inbox should help end customers understand what changed and what needs attention, rather than remaining an empty Bubble placeholder or generic activity feed.

Implications:

- Keep inbox language buyer-facing and manufacturing-specific.
- Route notification rows to the relevant quote or order area until durable notification detail pages exist.
- Later work should connect these notifications to persisted RFQ/order/document events instead of static dashboard data.

## 2026-05-27 - Give Admin A Peach Visual Identity

Decision: make the admin experience visually distinct from the customer app by using `#FFD3AC` as the primary peach palette for admin shell, navigation, and dashboard surfaces.

Status: superseded on 2026-06-03 by the Airbnb-inspired admin color decision above.

Reason: admin workflows should feel like a separate internal control space while staying inside the same Lattice OS product.

Implications:

- Keep customer-facing app surfaces on the neutral/light operations palette.
- Apply peach admin styling at the shared shell level so `/admin` and operator/admin routes inherit the internal identity.
- Use darker warm neutrals for admin text and controls to preserve readability against the peach palette.

## 2026-05-27 - Keep Admin Overview Focused On Quote Request Control

Decision: make `/admin` a concise dashboard for the most critical active quote-request signals instead of a broad cross-admin activity summary.

Reason: the first admin overview should help operators quickly see which quote requests need assignment, missing-info recovery, supplier outreach, overdue attention, or buyer decision follow-up.

Implications:

- Keep `/admin` centered on active quote requests: submitted, needs info, supplier-ready, and quoted.
- Use `/admin/quotes`, `/admin/customers`, and `/admin/orders` for deeper management surfaces instead of crowding the overview.
- Prioritize operational risk, due dates, owner assignment, supplier quote progress, and open quoted value in the overview metrics.

## 2026-05-27 - Make Buyer Quote Rows Open A Standard Detail Template

Decision: make each row in `/quotes` navigate directly to `/quotes/[requestId]`, and use that route as the standard buyer-facing quote detail template.

Reason: buyers should be able to click a specific quote and land on a consistent page with the extra detail needed to review pricing, manufacturing requirements, files, supplier basis, activity, and purchase conversion.

Implications:

- Keep row navigation link-based so quote detail pages are shareable and browser-native.
- Keep granular customer-facing quote detail formatting centralized in `src/components/buyer-quote-detail.tsx`.
- Later durable quote-version work should feed the same template rather than introducing a competing buyer quote layout.

## 2026-05-26 - Start Customer Quote Issuance With A Local Markdown Builder

Decision: add an internal admin quote builder at `/admin/quotes/builder` that captures quote header fields, line-item pricing, files reviewed, lead time, assumptions, and open questions, then downloads a customer-ready Markdown quote file.

Reason: Lattice needs a usable quote issuance workflow before the full database-backed quote lifecycle is built. Markdown keeps the generated artifact simple to inspect, copy, email, or convert to PDF.

Implications:

- Keep quote file formatting in `src/lib/quote-file.ts` so it can later feed PDF generation or persisted quote records.
- Treat the builder as an operator/admin tool, not a buyer-facing quote acceptance surface.
- Later work should connect quote generation to saved RFQs, supplier quotes, and durable quote versions.

## 2026-05-26 - Use Autodesk Platform Services For Native CAD Preview

Decision: use Autodesk Platform Services Model Derivative plus Viewer SDK for browser-based previews of uploaded manufacturing CAD files.

Reason: supported RFQ formats such as STEP, IGES, SLDPRT, SAT, Parasolid, and Inventor parts are not reliably renderable directly in the browser without translation. APS can translate CAD files into SVF/SVF2 for web viewing and metadata extraction.

Implications:

- Keep Autodesk credentials server-side in `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, and `APS_BUCKET_KEY`.
- Upload preview files through a backend route before loading them in the browser viewer.
- Buyer upload UX should show translation progress and a configuration-needed state when APS is not configured locally.
- Later persistence work should store original file object references and translated model URNs with uploaded files.

## 2026-05-26 - Public Entry Is Invite-Only

Decision: make `/` the public Lattice landing page and keep it invite-only with only two visible entry points: Log in and Request access.

Reason: the platform should feel private and controlled while the product is early, rather than presenting a broad marketing site or open signup path.

Implications:

- The internal command center lives at `/dashboard`.
- The app shell should not wrap the public landing page.
- Customer workspace navigation should treat `/dashboard` as home.

## 2026-05-26 - Repo Files Are The Shared Agent Memory

Decision: use versioned repo files as the shared memory layer across William's work and home computers.

Reason: local AI chat history does not reliably sync across machines or tools. GitHub does sync project files.

Implications:

- `PROJECT_CONTEXT.md`, `DECISIONS.md`, and `TODO.md` should be kept current.
- Agents should read these files before making meaningful changes.
- Important decisions from chat should be summarized here before the work is considered fully handed off.

## 2026-05-26 - Keep Next.js Docs Check In Agent Instructions

Decision: agents must read relevant Next.js docs from `node_modules/next/dist/docs/` before writing Next.js code.

Reason: this repo uses Next.js 16.2.6, and the project instructions warn that APIs, conventions, and file structure may differ from older assumptions.

Implications:

- Do not rely only on model memory for Next.js behavior.
- Check local docs before changing routing, layouts, server actions, metadata, caching, or other Next.js APIs.

## 2026-05-24 - Bubble Is A Product Reference, Not The Implementation

Decision: use the Bubble prototype to preserve product intent and information architecture, but rebuild cleanly in owned code.

Reason: the Bubble prototype captures useful UX direction but includes placeholders, debug text, and unfinished pages.

Implications:

- Keep useful structures like sidebar navigation, RFQ upload-first flow, materials catalog, capabilities page, dashboard cards, and quote/order modules.
- Improve labels, data quality, role separation, and operational clarity.
- Do not copy Bubble implementation constraints.

## 2026-05-24 - Product UI Direction Is Light B2B Operations Console

Decision: Lattice OS should feel like a light, professional B2B operations app.

Reason: manufacturing RFQ/procurement work benefits from clarity, dense information, and repeatable workflows.

Implications:

- Prefer light backgrounds, neutral borders, readable lists/tables, and restrained accents.
- Avoid decorative startup/marketing styling on app surfaces.
- Make status, ownership, due dates, process, material, quantity, files, and next actions easy to scan.

## 2026-05-24 - PostgreSQL Is The Source Of Truth For Requests

Decision: submitted requests should persist through the API and Prisma/PostgreSQL, not browser-only storage.

Reason: RFQs are durable business records and must survive browser/session changes.

Implications:

- The active request handoff path should not depend on `localStorage`.
- Request persistence belongs in `src/lib/request-repository.ts`, `src/lib/request-persistence.ts`, and `prisma/schema.prisma`.
- Workflow tests should cover validation, persistence mapping, and queue behavior.
## 2026-08-11 - Public Entry Leads With Manufacturing Proof And Account-Free Quoting

Decision: replace the invite-only public entry screen with a manufacturing-specific landing page that makes the account-free simple quote the primary conversion path.

Reason: prospects need to understand Lattice's overflow-capacity value, quality controls, and managed workflow before being asked to create an account or request access. A relatable CNC close-up and concrete inspection evidence make the network model more credible to manufacturing buyers.

Implications:

- `/` leads with `Start your quote` into `/simple-quote`; account access remains available but secondary.
- Public navigation exposes capabilities, materials, quality documentation, and the on-page workflow explanation.
- The dark technical visual system remains appropriate for the public site, while authenticated workspace surfaces remain a light B2B operations console.
- The 2026-05-26 invite-only public-entry decision and the invite-only implications of the 2026-06-01 visual-system decision are superseded for `/`.
