# TODO

Shared next-actions list for AI agents across computers. Keep this focused on the next useful work, not every possible idea.

## Next Priorities

- Customer experience audit (2026-10-08): use `docs/audits/customer-experience-2026-10-08.md` as the prioritized development/validation checklist. These source changes are implemented locally: company draft/file isolation and shared persistence, support/clarification history, document downloads and approval holds, card-only purchasing and saved expiry, complete Action Center and explicit file association. See `docs/audits/customer-decisions-implementation-2026-10-08.md` and the separate checkout audit. The audit observed a missing `Company.addressOnboardingDeferredAt` column in the configured development database, causing demo fallback; the development schema has now been reconciled using additive SQL; the final schema diff is empty. Full customer-role/production, uploads, mobile, and external-service checks remain outstanding. Initial baseline was 315/329 tests and failed lint. Updated checks: 351/351 pass, typecheck/lint/build pass. The old drawer/PO/invitation expectations were updated for current behavior.

- The onboarding draft was approved and its real customer welcome/tour integration is prepared locally with membership-scoped progress and replay. Production additive schema verified/applied and release deployed to latticeos.co (`dpl_B2YnUGqkNVau3QQBBBgkMj3yjk73`). Verify genuine customer/mobile flows. The visual reference remains at `/admin/resources/customer-onboarding` or build its standalone preview using `design-exports/customer-onboarding/README.md`. It includes the full sequence and four-stop tour over the actual shared customer shell/dashboard with empty sample data; live customer auth and persistence are not connected. The standalone workspace frame requires the local app and an authenticated admin. The real integration is in `customer-onboarding.tsx`; finish genuine customer-role and accessibility verification before production rollout. Complete accessibility and controlled invitation checks before rollout.
- After the GitHub push and resulting Production deployment complete, rerun the controlled invitation test with `willclawpaik@gmail.com`: confirm provisioning and Resend delivery including the “Lattice - How It Works.pdf” attachment, forced personal-password setup without ending the Clerk session, shipping/billing confirmation, reset-and-resend, and old-password rejection. The invitation schema is already applied in Development and Production. End-to-end invitation and attachment receipt have not yet been verified. Later, replace the temporary-password email with an expiring single-use activation link and recipient-chosen password; add a configurable onboarding scheduling link (for example, Calendly).
- Controlled Production rehearsal (2026-10-09): Reset & resend for Apple / `willclawpaik@gmail.com` failed after saving the rotated credential because the helper returned the pre-update user record to invitation delivery. The source now returns the updated row with its new 72-hour expiry; no schema change is needed. Regression coverage verifies first reset, repeated resend expiry, existing-sign-in preservation, and no plaintext password in the result. After release, issue a fresh invitation to reconcile the controlled test account, verify receipt/attachment in its mailbox, and complete personal-password setup, addresses, harmless RFQ/file, isolation, and reset/old-password rejection. The mailbox was not among the signed-in Chrome Google accounts; customer password entry requires the operator. No RFQ, address, payment, or order was created in the failed attempt.
- Completed: create the one-page “How Lattice works” PDF and wire it into customer invitation delivery. Source/output locations are documented in `README.md` and `docs/app-feature-map.md`.

- Complete Guided Address Onboarding and Autocomplete: the focused shipping-then-billing first-login modal and durable Customer Admin-only deferral exist. The billing step now preserves saved billing values and fills blank fields from shipping for the customer to review. Next add review/confirmation of Lattice-prefilled information and a production address-suggestion/validation provider; keep the existing Customer Admin-only server authorization boundary.

- Initial purchasing is now credit card through Stripe (customer decision 2026-10-08). Vercel access/deployment is complete. Identify/connect the correct Stripe account (Nexus Manufacturing Technologies, Inc. is active in the user-confirmed Chrome profile; Stripe Tax is not configured), verify existing Production keys and signed webhook, finalize shipping and tax, verify payment/reconciliation and controlled refund/void, then release the prepared checkout. PO payment and unapproved exemption remain disabled.

- Revisit customer self-service email changes only after the initial release. For now, customers request changes through Lattice support and the Lattice Admin performs the existing verified email-change workflow.

- Build company-wide account management and integrations. Give Customer Admins a governed company workspace for company profile/defaults, teammates and roles, invitations, shared purchasing settings, and approved third-party integrations with auditable data access. Shipping, billing address, and billing-contact defaults are already shared and database-backed on `Company`; customer team management remains disabled, and company membership is administered only by Lattice Admins for the initial release. Customer Admin self-service invitations and role management are roadmap work.
  - Add the company-owned Stripe card vault after the user-to-company Stripe migration, followed by per-card view/use/manage permissions, named-user assignment, and access audit history.

- Run the one-time Vercel-gated Clerk migration (`LATTICE_RUN_CLERK_USER_MIGRATION=true`) to apply the `User.clerkUserId` schema and create/link Clerk accounts for existing Lattice users; remove the flag after the successful deployment, then smoke-test a Lattice Admin plus a customer account before relying on Clerk in production.
- Complete the Clerk migration by replacing the legacy custom email-change/password-recovery delivery surfaces with Clerk-native account-management flows and retire the unused Google OAuth callback routes after production cutover.

- Continue enforcing the intended public-versus-authenticated access policy for `/capabilities`, `/materials`, `/quality-documentation`, and related customer-facing surfaces before restoring any account-free landing-page actions.

- Apply the order-progress schema changes (`SupplierOrderStatus.DELIVERED`, `Request.orderNextMilestone`, `Request.orderNextMilestoneDate`, `Request.orderResponsibleParty`, and `SupplierUpdate.actor`) to local and production PostgreSQL with `npm run db:push`, then smoke test a manual admin update through `/admin/orders/[requestId]`.
- Apply the new `MaterialInquiry` model and `MaterialInquiryStatus` enum to local and production PostgreSQL with `npm run db:push` before rolling out the unlisted-material inquiry workflow; development currently falls back to `.data/material-inquiries.json` when Prisma is unavailable.
- Decide the correction/override policy for an incorrectly recorded order milestone before broader operator rollout; v1 intentionally prevents backward status changes.

- Append to `docs/completed-work-log.md` at the end of substantial sessions so completed tasks, features, fixes, and docs changes stay visible by date across computers.
- Keep `docs/app-feature-map.md` current whenever feature behavior changes, especially when a route moves, a page switches from prototype/static data to live repositories, or a limitation is resolved.
- Run the QC/manual test matrix in `docs/qc-testing-plan.md` before external customer/supplier testing, especially the ownership/privacy probes for cross-company RFQ, order, invoice, and supplier access.
- Run `npm run test:auth-workflows` before each customer-access release. It covers company-scoped RFQ submission, checkout/order mutation guards, document access, and the deliberately-disabled supplier portal mutation path.
- Continue hardening from the 2026-06-18 manual QC privacy findings:
  - apply the current `User` schema (including customer password credentials) to production PostgreSQL with `npm run db:push`, then re-run the company-privacy probes in `docs/qc-testing-plan.md`
  - defer supplier portal/award ownership work until supplier users are deliberately onboarded; suppliers are currently managed internally from email and other operator channels
- Production launch hardening after the 2026-06-02 Vercel/Neon setup:
  - deploy the `@vercel/analytics` instrumentation change, visit `https://latticeos.co`, then confirm Vercel Analytics leaves the Get Started state and starts showing page views
  - choose the durable production identity platform and organization model, then configure Google Workspace/SAML/OIDC credentials in local, preview, and production and decide when to disable the interim local password fallback
  - continue replacing the interim single-account credential gate with durable multi-user authentication, organization-owned login policy, MFA/passkeys, session/device controls, and enterprise identity controls
  - create the durable Lattice Admin user record for the sole operator before enabling Google SSO as the primary login path
  - add enterprise identity hardening: MFA/passkeys, session/device controls, and expanded identity audit events
  - later replace the first-cohort temporary-password invitation with a single-use, expiring activation link, recipient-chosen password, verified-email activation, and resend/revoke controls; add Customer Admin teammate invitations only after company membership policy is designed
  - replace temporary local `.data/uploads` RFQ file storage with Cloudflare R2 or another S3-compatible production bucket for uploaded CAD/drawing files
- before enabling Preview deployments to send email, replace the current shared Resend configuration with a separate restricted Preview key/sender (or leave Preview email disabled); the automated first-cohort invitation sends from `support@latticeos.co`, but still needs controlled end-to-end validation before customer rollout
  - configure Stripe test/live environment variables (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_BASE_URL`) and register `/api/stripe/webhook` in Stripe for production payment finalization
  - move saved payment methods from the current user-specific Stripe Customer to a company-owned Stripe Customer before launch; follow later with card-level use/manage permissions, named-user or role assignment, and audit history
  - keep purchase-order payment disabled for the initial release; design the later Lattice Admin approval, credit-review/limit, PO-validation, accounts-payable, and audit workflow before enabling it
  - keep tax-exempt status unavailable by default; define the later Lattice Admin document-review and entitlement workflow before exposing it to customer companies
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
  - follow up on the new admin quote queue/workbench with explicit file-to-part association and optional saved quote drafts if operators need them; retain the current shared RFQ file package until a reliable association exists
  - keep refining the explicit edit/reissue flow for correcting an already-issued customer quote without making the default issued quote detail view editable
  - buyer and operator views stay in sync
- Apply the latest schema changes, including `CLOSED`, quote shipping/date fields, account defaults, `AccountDefaults.companyName`, RFQ contact/ship-to snapshot fields, and `UploadedFile.cadPreviewUrn`, to local and production databases with Prisma after pulling this change.
- Apply the new supplier quote attachment schema (`SupplierQuoteAttachment`) to local and production databases with Prisma after Postgres is reachable; local development can store received Chinese shop quote files in `.data/uploads/supplier-quotes` through the fallback store until then.
- Apply the new structured supplier quote schema field (`SupplierQuote.lineItems`) to production databases with Prisma so admin-issued quotes can generate order-specific DOC-002 supplier purchase order PDFs after purchase.
- Apply the new checkout payment schema fields and `CustomerPurchaseOrderAttachment` model to local and production databases with Prisma after Postgres is reachable; local development can store customer PO uploads in `.data/uploads/customer-purchase-orders` through the fallback store until then.
- Apply the new Stripe checkout schema fields (`AccountDefaults.stripeCustomerId`, Stripe checkout/payment intent/amount/currency/paid timestamp fields, and expanded payment statuses) to production databases with Prisma before enabling live card checkout.
- When the customer roadmap is reintroduced, apply the `RoadmapInterest` schema to local and production databases with Prisma so interest flags persist durably outside the local development fallback.
- Apply the new admin order archive schema field (`Request.isArchived`) to local and production databases with Prisma after Postgres is reachable; local development can use the `.data/requests.json` fallback until then.
- Define and persist a durable `Delivered` trigger for the buyer lifecycle tag, such as a supplier/order status beyond `SHIPPED` or a delivery confirmation event.
- Add ownership-aware repository helpers such as `getCustomerRequestById`, `listCustomerRequests`, and `getSupplierOrderById` so role isolation also filters records by customer company or awarded supplier instead of only by route family.
- If admins need to submit RFQs on behalf of customers, build a dedicated admin-native flow under `/admin/customers/[companyId]` rather than sending operators to the customer `/requests/new` experience.
- If buyers need post-purchase quote history, expose the saved quote/PDF from `/orders/[requestId]` instead of putting purchased records back into `/quotes`.
- Add durable activity/workflow state once the derived v1 Action Center and notification feed are validated: persistent read/unread state, explicit checklist completion, customer clarification replies, notification preferences, and email delivery. Current `/dashboard` and `/notifications` derive workflows and activity from existing RFQ, quote, order, milestone, supplier update, shipping, tracking, and supplier document records without a schema migration.
- Configure Autodesk Platform Services for live CAD previews:
  - rotate any APS Client Secret that was pasted into chat/logs before using it
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
- Collect supplier-facility photographs for the customer-visible CNC, QC, and sheet-metal equipment, then upgrade their classifications from `same-model` to `actual` only after operator verification.
- Collect and verify model-specific photos for the 24 newly separated Best Prototypes CNC cards; their current visual reference remains representative until supplier/facility evidence is available.
- Collect verified model-specific specification pages or PDFs for Equipment cards that intentionally have no customer-facing specification link; do not restore generic manufacturer home-page fallbacks.
- Before adding any new customer route or API payload that includes request/order data, use `customerSafeRequest` so proprietary manufacturing-partner details remain internal.
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

## Stripe next steps — 2026-10-09

- Completed: Nexus shared Test mode is connected, with NY registration and tangible-goods defaults configured. NY/PA synthetic tax calculations passed. Separate Test mode runtime keys and a signed local webhook are configured; never use live credentials for tests.
- Production admin check returned 503 on 2026-10-09. Diagnose runtime Stripe authentication/permissions using the redacted `/api/stripe/configuration` diagnostics: expected Nexus account, active Tax/NY registration, and credentials present. Verify actual signed webhook delivery separately.
- Validate hosted tax, shipping, payment/decline/3DS, cancel/retry/concurrent requests, duplicate/late/webhook-only fulfillment, quote revisions and refund/receipt reconciliation. Then explicitly set `STRIPE_CHECKOUT_ENABLED=true` and deploy. Inline checkout and company card vault are deferred.

### Stripe payment audit follow-through — 2026-10-09

- Completed local credential, merchant/NY readiness and signed webhook setup; actual NY checkout, decline, failed/successful 3DS and full Stripe test refund passed. 365 automated tests pass.
- Completed full/partial refund reconciliation and visible payment status, including pending/failed refund handling. Define and implement credit notes separately from the immutable original sale invoice.
- Before live enablement, verify Production merchant readiness/signed delivery, Link bank funding is now disabled in live and Test mode; finish customer-role/mobile, invoice, webhook-only/duplicate/late, cancel/retry/concurrency/revised-quote tests. Recheck hosted UI with Test mode Link now off.

- Completed synthetic invoice PDF totals/address checks and saved import/duties wording. Initial checkout requires finalized DDP terms on the server; existing commercial terms are preserved.
- Actual PA cancel/retry/payment and $50 partial + $60 remaining refund callbacks/UI passed. Complete asynchronous refund browser tests and live webhook now subscribes to all four refund event types.

### Current Production blocker — 2026-10-09

- Authenticated admin diagnostic confirms STRIPE_AUTHENTICATION_FAILED: Production STRIPE_SECRET_KEY is present but rejected. William must replace it securely in Vercel with a valid live Nexus key. Then redeploy, recheck merchant/Tax readiness and signed delivery before enabling live checkout. Local test credentials work.
- Investigate unavailable attachments on the two legacy Impeller RFQs and verify fresh Production upload/download; do not assume missing bytes are recoverable from file names.
