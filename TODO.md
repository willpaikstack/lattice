# TODO

Shared next-actions list for AI agents across computers. Keep this focused on the next useful work, not every possible idea.

## Next Priorities

- Apply the order-progress schema changes (`SupplierOrderStatus.DELIVERED`, `Request.orderNextMilestone`, `Request.orderNextMilestoneDate`, `Request.orderResponsibleParty`, and `SupplierUpdate.actor`) to local and production PostgreSQL with `npm run db:push`, then smoke test a manual admin update through `/admin/orders/[requestId]`.
- Apply the new `MaterialInquiry` model and `MaterialInquiryStatus` enum to local and production PostgreSQL with `npm run db:push` before rolling out the unlisted-material inquiry workflow; development currently falls back to `.data/material-inquiries.json` when Prisma is unavailable.
- Decide the correction/override policy for an incorrectly recorded order milestone before broader operator rollout; v1 intentionally prevents backward status changes.

- Append to `docs/completed-work-log.md` at the end of substantial sessions so completed tasks, features, fixes, and docs changes stay visible by date across computers.
- Keep `docs/app-feature-map.md` current whenever feature behavior changes, especially when a route moves, a page switches from prototype/static data to live repositories, or a limitation is resolved.
- Run the QC/manual test matrix in `docs/qc-testing-plan.md` before external customer/supplier testing, especially the ownership/privacy probes for cross-company RFQ, order, invoice, and supplier access.
- Continue hardening from the 2026-06-18 manual QC privacy findings:
  - replace the interim customer exact-requester-email ownership policy with durable one-primary-company membership when customer account records are ready
  - add supplier-award/shop ownership checks for supplier order pages, invoice PDFs, supplier documents, and status update actions
  - rerun the live fixture QC IDs recorded in `docs/qc-testing-plan.md` after the fixes
- Production launch hardening after the 2026-06-02 Vercel/Neon setup:
  - deploy the `@vercel/analytics` instrumentation change, visit `https://latticeos.co`, then confirm Vercel Analytics leaves the Get Started state and starts showing page views
  - choose the durable production identity platform and organization model, then configure Google Workspace/SAML/OIDC credentials in local, preview, and production and decide when to disable the interim local password fallback
  - continue replacing the interim single-account credential gate with durable multi-user authentication, organization-owned login policy, role/route authorization, production password recovery, MFA/passkeys, session/device controls, and identity audit events
  - move role assignment from the current signed-session email allowlists (`LATTICE_ADMIN_EMAILS` / `LATTICE_SUPPLIER_EMAILS`) into durable user/workspace records with company and supplier ownership checks
  - add ownership-aware access checks below the current route/action role guards so authenticated customers and suppliers cannot access records outside their company or awarded shop
  - replace temporary local `.data/uploads` RFQ file storage with Cloudflare R2 or another S3-compatible production bucket for uploaded CAD/drawing files
  - configure Resend and a verified sending domain for waiting-list emails
  - configure Stripe test/live environment variables (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_BASE_URL`) and register `/api/stripe/webhook` in Stripe for production payment finalization
  - smoke test the public `/simple-quote` lane in production after Stripe and Resend are configured, including guest RFQ submission, admin quote issuance email, tokenized quote review, PDF download, and card payment
  - decide whether to keep local email outbox files for development only or add durable email-event records in Postgres
  - add Vercel preview env vars if preview deployments become part of the workflow
  - decide whether to remove the first unaliased Vercel deployment created before `.vercelignore` was added
- Tomorrow handoff after pulling latest:
  - run `npm install` if dependencies changed
  - start local services with `docker compose up -d postgres minio`
  - run `npm run prisma:generate` and `npm run db:push`
  - run `npm run typecheck`, `npm run lint`, `npm test`, `npm run dead-code`, and preferably `npm run build`
  - open local `/`, `/login`, `/requests/new`, `/quotes`, `/orders`, and `/admin/quotes`
  - smoke test production `https://latticeos.co/` and `/admin/quotes`
  - visually check the public Figma AI pages, request-form dropdowns, quote table/detail, quote checkout, and order detail/help/reorder flows
- Verify the current app end-to-end after pulling on any new computer:
  - install dependencies if needed
  - start local Postgres/MinIO with Docker Compose
  - run Prisma generation and database push
  - run typecheck, lint, tests, dead-code audit, and build
  - open the key routes in a browser
- Install Docker Desktop or point `DATABASE_URL` at a reachable Postgres/Neon database on this machine; RFQ submissions currently work through the development `.data/requests.json` fallback when localhost Postgres is unavailable, but real shared persistence still requires Postgres.
- Keep improving the RFQ lifecycle:
  - buyer submits RFQ
  - operator reviews RFQ
  - operator marks missing info or ready for supplier RFQ
  - operator saves a durable customer quote version with per-part unit pricing
  - keep refining the explicit edit/reissue flow for correcting an already-issued customer quote without making the default issued quote detail view editable
  - buyer and operator views stay in sync
- Apply the latest schema changes, including `CLOSED`, quote shipping/date fields, account defaults, `AccountDefaults.companyName`, RFQ contact/ship-to snapshot fields, and `UploadedFile.cadPreviewUrn`, to local and production databases with Prisma after pulling this change.
- Apply the new supplier quote attachment schema (`SupplierQuoteAttachment`) to local and production databases with Prisma after Postgres is reachable; local development can store received Chinese shop quote files in `.data/uploads/supplier-quotes` through the fallback store until then.
- Apply the new structured supplier quote schema field (`SupplierQuote.lineItems`) to production databases with Prisma so admin-issued quotes can generate order-specific DOC-002 supplier purchase order PDFs after purchase.
- Apply the new checkout payment schema fields and `CustomerPurchaseOrderAttachment` model to local and production databases with Prisma after Postgres is reachable; local development can store customer PO uploads in `.data/uploads/customer-purchase-orders` through the fallback store until then.
- Apply the new Stripe checkout schema fields (`AccountDefaults.stripeCustomerId`, Stripe checkout/payment intent/amount/currency/paid timestamp fields, and expanded payment statuses) to production databases with Prisma before enabling live card checkout.
- Apply the new guest simple quote schema fields (`Request.requestOrigin`, `Request.guestAccessTokenHash`, and `Request.guestAccessTokenExpiresAt`) to local and production databases with Prisma before promoting `/simple-quote`.
- Apply the new roadmap interest schema (`RoadmapInterest`) to local and production databases with Prisma so `/roadmap` interest flags persist durably outside the local development fallback.
- Apply the new admin order archive schema field (`Request.isArchived`) to local and production databases with Prisma after Postgres is reachable; local development can use the `.data/requests.json` fallback until then.
- Define and persist a durable `Delivered` trigger for the buyer lifecycle tag, such as a supplier/order status beyond `SHIPPED` or a delivery confirmation event.
- Add ownership-aware repository helpers such as `getCustomerRequestById`, `listCustomerRequests`, and `getSupplierOrderById` so role isolation also filters records by customer company or awarded supplier instead of only by route family.
- If admins need to submit RFQs on behalf of customers, build a dedicated admin-native flow under `/admin/customers/[companyId]` rather than sending operators to the customer `/requests/new` experience.
- If buyers need post-purchase quote history, expose the saved quote/PDF from `/orders/[requestId]` instead of putting purchased records back into `/quotes`.
- Add durable activity/workflow state once the derived v1 Action Center and notification feed are validated: persistent read/unread state, explicit checklist completion, customer clarification replies, notification preferences, and email delivery. Current `/dashboard` and `/notifications` derive workflows and activity from existing RFQ, quote, order, milestone, supplier update, shipping, tracking, and supplier document records without a schema migration.
- Configure Autodesk Platform Services for live CAD previews:
  - create APS app credentials
  - rotate any APS Client Secret that was pasted into chat/logs before using it
  - set `APS_CLIENT_ID`, regenerated `APS_CLIENT_SECRET`, and globally unique `APS_BUCKET_KEY`
  - smoke test upload translation and Autodesk Viewer rendering from `/requests/new`
  - keep tuning the initial viewer camera/framing across native CAD files
  - decide whether to also persist original Autodesk object IDs for admin troubleshooting and derivative lifecycle management
- Smoke test APS-derived customer quote thumbnails on `/quotes/[requestId]` after APS credentials and database schema are applied in the target environment.
- Continue clarifying buyer `/quotes` and admin `/admin/quotes` role separation now that quote issuance is database-backed and admin-owned.
- Keep `/admin/quotes` as the active admin home and continue deepening its durable quote-version and supplier-quote record coverage.
- Continue refining internal templates in `/admin/resources`; customer quote, supplier purchase order, and domestic invoice PDF templates now live there with in-app previews, with supplier outreach, order, and inspection document formats still future candidates.
- Harden supplier PO issuance beyond on-demand generation by adding an issued supplier PO/audit record once Lattice needs immutable supplier release tracking.
- Apply the new customer/invoice issuance schema (`CustomerSequence`, `Company.customerId`, `InvoiceSequence`, `Invoice.quoteNumber`, and `Invoice.shippingTerms`) to local/production databases with Prisma once Postgres is reachable; this machine currently lacks Docker/local Postgres, so `npm run db:push` cannot complete here.
- Promote order invoice downloads from stable order-derived invoice references to saved `Invoice` records, including annual invoice IDs, customer PO from checkout, customer IDs, amount paid/status, billing contact, tax treatment, and immutable issued invoice snapshots.
- Decide whether request-specific quote workbook exports should continue using the retired DOC-001 workbook as source material or move fully to generated PDF/workbook renderers.
- Add RFQ intake controls for requester email/phone and explicit ship-to overrides if buyers need to change them per RFQ; current submissions snapshot the saved account defaults onto the RFQ.
- Continue aligning customer quote template fields with real order data, especially ship-by date, DFM warnings, and customs/end-use notes.
- Decide whether saved quote PDFs should later be stored durably and attached to buyer-facing quote/order records, emailed, or kept as manual downloads only.
- Promote `/admin/vendors` from the current `.data/admin-vendor-overrides.json` local edit bridge to durable supplier/vendor records, including contacts, capability documents, quality history, payment terms, and quote/order performance.
- Continue turning demo/static quote, order, supplier, and customer surfaces into durable database-backed workflows as needed.
- Keep the RFQ material selector aligned with researched marketplace and supplier-network material coverage; the current CNC selector is sourced from `src/lib/cnc-material-library.ts` and browsed through Hubs-style customer-facing material families.
- Build admin/operator source-trace views for material and equipment repositories so each standardized customer-facing claim can be audited back to vendor, document, and extraction notes.
- Continue deduplicating vendor-provided material/equipment entries across Zintilon, Saky Steel, ZYTC, Best Prototypes, and future vendor documents.
- Add the original source files for previously entered Zintilon processing and sheet metal capability data into `docs/vendor-sources/` when available; the registry currently records placeholders for those older sources.
- Add or update tests whenever request status, persistence, queue filtering, or role-specific views change.
- Keep artificial RFQ fixture seeding disabled during real workflow commissioning; move live upload sharing to R2/S3 when production-style storage is needed.

## Cross-Computer Handoff Checklist

Before ending a substantial session:

- Append completed work to `docs/completed-work-log.md` with today's date.
- Update `docs/app-feature-map.md` if app features, routes, data sources, maturity status, or limitations changed.
- Update `PROJECT_CONTEXT.md` if routes, architecture, or product state changed.
- Add an entry to `DECISIONS.md` for durable product or technical decisions.
- Update this `TODO.md` with the next concrete step.
- Run the relevant verification commands and record failures/blockers in the final handoff.
- Commit and push changes so the other computer can pull the same context.

## Useful Local Commands

```bash
npm install
docker compose up -d postgres minio
npm run prisma:generate
npm run db:push
npm run dev
npm run typecheck
npm run lint
npm test
npm run dead-code
npm run build
```

## Important Routes To Smoke Test

- `/`
- `/login`
- `/waiting-list`
- `/requests/new`
- `/quotes`
- `/orders`
- `/orders/[requestId]`
- `/supplier/orders`
- `/admin/quotes`
- `/admin/customers`
- `/admin/vendors`
- `/materials`
- `/capabilities`
