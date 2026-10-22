# TODO

Public-site release completed (2026-10-22): the call-first redesign is live. Preserve **Lattice Classic — Before Call-First Redesign**, tag `archive/lattice-classic-before-call-first-2026-10-22`; see its archive/restoration guide. Operators arrange requested calls manually from Companies → Waiting list. Keep the labelled QA call request as release evidence. Optional follow-up: operator notifications/calendar integration. Preview Clerk keys are absent and remain a separate environment-configuration follow-up; Production smoke and a staged Production call save pass.

Approved public-site release (2026-10-22): preserve the Lattice Classic archive tag and restoration guide. Verify staged Production, then publish the approved redesign and record the final deployment/domain evidence. Restore only public design files from the archive if Classic is requested later; retain current security patches.

Public-site review (2026-10-22): review the homepage and `/book-a-call`, `/waiting-list`, guest `/how-it-works`, `/login`, `/forgot-password`, `/reset-password` on `codex/public-site-redesign`. Confirm copy/design, then validate a controlled hosted call submission and operator receipt before release. Call requests are in Companies → Waiting list; times are arranged manually by email, with no new notification email. Resolve existing Next.js 16.4.0 critical runtime advisories before publishing; dependency upgrade is separate from this design work. See `docs/public-site-redesign-2026-10-22.md`.

- Customer supplier-data exposure fix deployed (2026-10-21): main `1a3f348` is released as `dpl_EFPNBVb6rMaeu6K1bX2UboC1MQBZ`. Explicit customer allowlists and ID-only submission/retry/archive receipts are in Production; combined 803 tests, 54 access checks and release smoke pass. Remaining: inspect authenticated HTML/RSC/JSON as genuine Customer Admin and Member accounts with populated synthetic supplier pricing, notes and attachments; verify authorized customer/quality downloads and admin supplier detail. This authenticated verification was not performed during deployment.

- Test repair complete locally (2026-10-19): 733 passed, no failures; the explicitly enabled PostgreSQL audit remains skipped. Shared-registry intake compatibility and admin queue filtering are verified. Browser/hosted verification and deployment remain separate follow-up work.
> Local comparison update (October 19): the newer Material/Condition picker is active for comparison with UNS number and composition below each choice and the selected material. Existing RFQ metadata supplies the reference line; unavailable data is labelled rather than invented. Set `useMaterialConditionPicker = false` to restore the previous grouped dropdown. This update follows the pushed handoff and is not yet pushed or deployed. Earlier verification counts describe the preceding implementation.


## Current next steps — October 19, 2026

- Continue from `codex/materials-catalog-handoff` in the existing GitHub repository. Read `docs/cross-device-handoff-2026-10-19.md` before starting on another computer. The local Production-derived history is preserved separately; do not push it over GitHub main or force-push.
- Material catalog/RFQ unification is implemented and automated checks pass: 758 tests, one opt-in PostgreSQL audit skipped, TypeScript and ESLint clean. Browser-check authenticated catalog → exact-material quote → first CAD upload → draft reload, sourcing-only flow and mobile/keyboard controls. Confirm process/finish compatibility on a representative real request before requesting a release.
- Every published grade/condition now has an existing quote selection or sourcing inquiry action. Catalog presence does not certify stock availability. Review ambiguous alias relationships individually; do not merge distinct specifications or infer T6/T651 equivalence. The remaining audit recommendations are in `docs/audits/materials-catalog-rfq-unification-2026-10-19.md`.
- Current main/Production workflow baseline is PR #1 / `cb90b13`. Latest material changes are on the handoff branch only. Merging/releasing that branch is a separate action. Retain the existing purchasing/payment release gates below.
- The earlier Design C synthetic preview remains available for comparison; `LOCAL_PREVIEW.md` documents rollback and its limitations. The October 19 baseline release supersedes older statements that all quote/tour changes are local only. Still review viewing-date calculations versus persisted checkout/order/PDF dates and holiday handling as a separate product decision.

- Account settings usability follow-up (2026-10-15): phone formatting, billing email validation, signed-in recovery identity binding, persistent same-as-shipping and U.S. city/state/ZIP/manual-entry controls implemented. Development/Production additive schema applied and released as dpl_Bz8CdC7v4JduhdfPQZZ7uoRbRmir (source 1d5877c). Hosted Member phone-format/reset-binding/address-suggestion/manual-entry checks pass. Genuine Admin billing-checkbox save/reload/restoration and invalid/valid email controls now pass. All 17 pre-check RFQs and original shared address/contact values remain unchanged. No remaining handoff. No automated tests run for this follow-up.

- Account settings released (2026-10-15) as dpl_G4gNx6XcserXJMyV5rEheNFan6en. Production migration and genuine Apple Customer Admin settings/photo/emoji/new-RFQ snapshot checks pass; original settings restored and 15 existing RFQs preserved. All 677 tests pass (one opt-in DB test skipped; explicit PostgreSQL audit already passed). Genuine Apple Member personal-save/shared-read-only/RFQ snapshot checks now pass. William confirmed reset email receipt/completion; Production token consumption, credential timestamp and completion audit confirm success after Clerk accepted the update. A separate new-password login was not independently exercised. See docs/audits/account-settings-2026-10-15.md.

- Quote configuration repairs released 2026-10-15 as dpl_83fU1hTTyKAg29PuKtavqy6Q4dkq: Enter cannot submit RFQs; explicit Request Quote clicks work; mismatched-use warning reassures draft preservation; targetDeliveryDate is canonical and 28 legacy Production part rows were migrated with values verified unchanged. All 638 tests pass.

- Hybrid local-first RFQ CAD rendering is released as dpl_9ifRDmjCSFqabD7AVpEMDEs1i6rY at a shared 200 MiB cap. Browser/build verification passes (633 tests); test representative large/complex models on lower-memory devices. Local failures preserve originals and do not fall back to Autodesk. Restore APS account capacity for unsupported native types.

## Hosted release blockers — 2026-10-13

The [hosted readiness report](docs/audits/hosted-readiness-2026-10-13.md) supersedes older pending hosted-check notes where it provides fresh proof. Do not enable Live checkout or call the app completed yet.

- Completed P0: admin page authorization now runs before private queries; CAD ownership is server-written and APS tokens are resource-scoped. Hosted cross-company/raw-response/provider checks pass; Production patch db347a6 is released. See docs/audits/p0-remediation-2026-10-13.md.
- Completed P0: private upload intents repair R2 completion; hosted small/large CAD and >5 MB PDF prepare/PUT/completion/submission/download pass without metadata fixtures. October 14 native browser CAD/PDF picker uploads, PDF pages, saved two-part solid CAD rendering, draft restore, RFQ submission and saved original hashes pass. Browser-created models still deny foreign-company access. Use CAD-library exported solids for geometry tests; original hand-written cube is an empty-geometry fixture.
- P1: enforce real stored bytes, part associations and required drawings on submission; validate/version/recover malformed shared drafts.
- P1: patch applicable dependency advisories and move vendor overrides off the application filesystem.
- P1: provide narrowly supported Test webhook ingress and prove genuine Stripe provider delivery; hosted signed replay/payment/refunds passed, direct delivery did not.
- P1/P2: repair >5 MB quality document upload failures, expected-action error messages and invented order progress; define invoice issuance timing (currently first PDF read).
- Finish quality package coverage/replacement/shipment-hold role tests (Customer Admin approval and added-document invalidation passed), commercial edge cases, communications, recovery/device checks, operator backup and business decisions listed in the report. Keep intentional first-cohort exclusions explicit.
- Test credential for private R2 bucket expires October 20, 2026. Synthetic test resources are retained for repeatability; Production was not changed by the audit.

Shared next-actions list for AI agents across computers. Keep this focused on the next useful work, not every possible idea.

## Next Priorities

- RFQ hidden-requirement audit (2026-10-13): resolve trusted buyer company and explicit admin customer context, align backend drawing/document validation, and verify remaining inactive local browser profiles apply the development cleanup on their next app load. The authorized development database/local JSON/active-browser purge is completed. Hidden requester/PO/due-date/part-name state and redundant process readiness are now removed; filename labels are derived. See `docs/audits/rfq-hidden-requirements-2026-10-13.md`; findings only, not implemented.

- Equipment explorer archived locally at William’s request (2026-10-18): navigation/tour entry removed and route redirects to `/equipment`. Implementation/data retained. Resume its source-basis audit only if the page is restored; see `docs/audits/equipment-explorer-implementation-2026-10-12.md`.

- Confirm the APS offering, remaining capacity and renewal/refresh date with the billing administrator for Autodesk team William paik - 3614. The work account owns Lattice CAD Preview but Autodesk Account shows its team role as User, without billing entitlement visibility. Current published Free limits are only 60 simple CAD conversions/month, 20 complex conversions/month and 300,000 basic calls/month. See `docs/audits/autodesk-upload-limits-2026-10-12.md`; hub usage for October 5–12 is not a full monthly balance.

- CAD preview speed stage 1 (released 2026-10-13): Production schema, app deployment and exact-origin private R2 CORS are complete. Exercise a synthetic CAD/PDF larger than 4.5 MB, draft reopen, submission during translation, authorized download, and cross-company denial. Production-origin preflight is verified and unrelated origins are denied; an actual signed PUT and measured preview latency remain unverified. See `docs/autodesk-aps-cad-preview.md`. Translation reuse and completion notifications are future stages.

- Materials first-page redesign (2026-10-10): William selected concept A; the refreshed atlas is implemented locally with the original component preserved for rollback. Review `/materials` and `docs/audits/materials-design-2026-10-10/implementation.md`. Sidebar and family guides remain unchanged. Reference-text contrast, featured/directory consistency, and missing-data labels in the family guides remain follow-up work from the audit; B search and C comparison are unapproved future concepts.

- First-customer launch plan (2026-10-09): use the ranked gates in `docs/first-customer-launch-readiness-2026-10-09.md`. Confirmed target: Tuesday, October 13, 2026; card payment with PO reference, no PO credit terms. Optional PO-reference capture is now wired through the card checkout, Stripe metadata, webhook fulfillment, order data, and invoice snapshot. Focused tests, typecheck, lint, and production build pass; a database-backed Test-mode customer order and invoice remain unverified. Local checks confirm the separate Neon development database is reachable and currently has 1 operator user but no companies, requests, invoices, or email events; the configured Stripe credential authenticates as Nexus Test mode (`livemode=false`). A restricted Resend key is saved in local `.env.local`; Resend accepted one explicitly labeled test-only email to the admin address (HTTP 200), but inbox receipt and the application-generated lifecycle email remain unverified. Production Stripe follow-through (2026-10-09): replaced the Production key, redeployed current main as `dpl_85f4PGEqBd1k1UdmzDmxFRC44d3o`, and confirmed the authenticated `/api/stripe/configuration` diagnostic returns `ready: true`. Checkout remains disabled pending signed webhook delivery and remaining launch checks. First customer/contact and job details remain unknown; use the dated schedule and Monday go/no-go review in the plan.

- Customer experience audit (2026-10-08): use `docs/audits/customer-experience-2026-10-08.md` as the prioritized development/validation checklist. These source changes are implemented locally: company draft/file isolation and shared persistence, support/clarification history, document downloads and approval holds, card-only purchasing and saved expiry, complete Action Center and explicit file association. See `docs/audits/customer-decisions-implementation-2026-10-08.md` and the separate checkout audit. The audit observed a missing `Company.addressOnboardingDeferredAt` column in the configured development database, causing demo fallback; the development schema has now been reconciled using additive SQL; the final schema diff is empty. Full customer-role/production, uploads, mobile, and external-service checks remain outstanding. Initial baseline was 315/329 tests and failed lint. Updated checks: 351/351 pass, typecheck/lint/build pass. The old drawer/PO/invitation expectations were updated for current behavior.

- The onboarding draft was approved and its real customer welcome/tour integration is prepared locally with membership-scoped progress and replay. Production additive schema verified/applied and release deployed to latticeos.co (`dpl_B2YnUGqkNVau3QQBBBgkMj3yjk73`). Verify genuine customer/mobile flows. The visual reference remains at `/admin/resources/customer-onboarding` or build its standalone preview using `design-exports/customer-onboarding/README.md`. It includes the full sequence and four-stop tour over the actual shared customer shell/dashboard with empty sample data; live customer auth and persistence are not connected. The standalone workspace frame requires the local app and an authenticated admin. The real integration is in `customer-onboarding.tsx`; finish genuine customer-role and accessibility verification before production rollout. Complete accessibility and controlled invitation checks before rollout.
- Controlled Production onboarding proof (2026-10-09): Apple / `willclawpaik@gmail.com` completed successful reset/resend, actual Gmail receipt and matching invitation PDF download, personal-password setup (operator), genuine customer login, shipping/billing saves with required-ZIP validation, and synthetic RFQ `cmv1kwix8000006jkor2qk48u` (LQ-CMV1KWIX). RFQ title/notes prohibit supplier outreach, quoting, manufacturing and shipping. Customer CAD and operator drawing downloads match fixture bytes. Anonymous files return 401; a second company's scoped support session cannot view this RFQ or either file. Old temporary password was rejected in an isolated Incognito login after personal-password setup. Uploads survived a subsequent Production deployment with matching bytes. Genuine customer welcome/tour replay, four steps, refresh/resume and completion persistence passed. Remaining: clean-account automatic address gate/first welcome, genuine second-customer isolation, skip behavior and mobile/accessibility. The reused Apple company had a saved address-onboarding deferral, explaining its initial dashboard bypass; completed addresses now persist. Do not reset or delete the proof data casually. Customer quote detail now has per-file drawing download links, and Account Settings reflects the server-side checkout gate. Desktop/mobile browser and customer-owner file access still need a controlled rollout verification. See `docs/audits/customer-onboarding-proof-2026-10-09.md`.
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
- Completed 2026-10-09: after updating the Production `STRIPE_SECRET_KEY` in Vercel and redeploying, the authenticated redacted `/api/stripe/configuration` diagnostic returned `ready: true`; the expected Nexus account matches, payments are enabled, Tax is active, and the account is registered in New York. Stripe Live Workbench shows the active destination `https://latticeos.co/api/stripe/webhook` with the nine expected payment/refund event types, but no delivery attempts yet. Test-mode events use a different endpoint signing secret and cannot validate the Live secret. Verify the first real subscribed Live event at the first controlled customer purchase, or approve a separate controlled live charge/refund test if earlier proof is required. `STRIPE_CHECKOUT_ENABLED` remains false.
- Validate hosted tax, shipping, payment/decline/3DS, cancel/retry/concurrent requests, duplicate/late/webhook-only fulfillment, quote revisions and refund/receipt reconciliation. Then explicitly set `STRIPE_CHECKOUT_ENABLED=true` and deploy. Inline checkout and company card vault are deferred.

### Stripe payment audit follow-through — 2026-10-09

- Completed local credential, merchant/NY readiness and signed webhook setup; actual NY checkout, decline, failed/successful 3DS and full Stripe test refund passed. 365 automated tests pass.
- Completed full/partial refund reconciliation and visible payment status, including pending/failed refund handling. Define and implement credit notes separately from the immutable original sale invoice.
- Before live enablement, verify Production merchant readiness/signed delivery, Link bank funding is now disabled in live and Test mode; finish customer-role/mobile, invoice, webhook-only/duplicate/late, cancel/retry/concurrency/revised-quote tests. Recheck hosted UI with Test mode Link now off.

- Completed synthetic invoice PDF totals/address checks and saved import/duties wording. Initial checkout requires finalized DDP terms on the server; existing commercial terms are preserved.
- Actual PA cancel/retry/payment and $50 partial + $60 remaining refund callbacks/UI passed. Complete asynchronous refund browser tests and live webhook now subscribes to all four refund event types.

### Current Production Stripe status — 2026-10-09

- Resolved: Production Stripe key and merchant/Tax readiness now pass the authenticated diagnostic after Vercel redeploy `dpl_85f4PGEqBd1k1UdmzDmxFRC44d3o` became Ready on `latticeos.co`. Keep checkout disabled until remaining payment, webhook, accounting, customer-role/mobile, and operational go/no-go checks are complete.
- Investigate unavailable attachments on the two legacy Impeller RFQs and verify fresh Production upload/download; do not assume missing bytes are recoverable from file names.

### Local audit follow-through — 2026-10-10

- Verify a genuine customer submits an expired-quote renewal, refreshes to see waiting status, and the operator finds the matching RFQ in `/admin/support`. Reissue a valid quote and confirm customer review/acceptance replaces renewal. Local mock browser coverage and automated checks do not certify the database-backed customer flow.
- Verify the same sidebar/How it works transitions on a Vercel Preview and genuine mobile customer session after deployment; cold local development compilation can still add server latency, but should preserve the existing page and shell.

- Request Quote follow-up (2026-10-10): Shared-draft warning diagnosed/fixed: demo draft IDs are excluded from database sync (17 targeted tests pass). Validate actual representative part files/version/dependencies through APS. Nine allowed formats were confirmed by the live formats API; local Continue/Back worked after navigation changes.


## RFQ configuration follow-up — 2026-10-11

- Competitor audit (2026-10-12): review `docs/audits/quote-configuration-competitors-2026-10-12.md` before selecting the next intake changes. Proposed priorities are a pre-upload export/restricted-data gate, explicit prototype/commercial/mixed end use, visible per-part process and requested delivery, then part/revision identity, inserts, CoC/traceability and compatibility. These are recommendations, not approved implementation. The existing three-step flow and exclusions for source inspection/build-and-hold remain in place.
- Per-part process is implemented locally (2026-10-12) with Milling/Turning/Sheet Metal and Milling default. Requested-delivery date remains hidden metadata; approve a visible date control separately.
- Material/process/finish compatibility filtering is implemented locally (2026-10-12), backed by a conservative researched matrix and server enforcement. Supplier-specific availability remains a follow-up. Shared material alias resolution is implemented; review any reported family-scoped alias conflicts before adding further merges.
- Before deployment, apply `scripts/rfq-manufacturing-schema-2026-10-12.sql` to the deployment database and regenerate Prisma. Production was not changed. Review the policy and finish scope in `docs/rfq-intake-requirements-2026-10-12.md`; customer declarations do not replace operator eligibility review.

- CAD popup latency (live local check, 2026-10-12): A10201.SLDPRT translation starts during step 1, but two sampled APS jobs finished around 40–42 seconds, followed by browser model loading after Continue. See `docs/cad-popup-timing-verification-2026-10-12.md`. Converted-model preload/reuse is now implemented locally and verified with a stable viewer/canvas handoff. Company-scoped identical-content translation reuse remains proposed. Verify this handoff on deployed browsers and representative larger models; the local warm-model sample was visible about 0.3 seconds after Continue.

- 2026-10-13: removed the remaining hidden buyer-company intake/submission requirement. Customer ownership remains session-scoped; admin RFQs may be unassigned. End-to-end submission verification remains pending.

- 2026-10-13: admin Quote Submissions reliability pass is local. Verify genuine database-backed issuance/reissue, customer visibility/PDF and supplier evidence uploads using a controlled test RFQ. Resolve existing optional-process/legacy-intake type errors and targetShipDate persistence-test expectation before a release build.

- 2026-10-13: database-only admin RFQ queue/detail, indexed part files, saved CAD/PDF review and strict submission/admin persistence are local. Select Part review, All-part dossier or Tabbed workbench as the next design direction. Resolve stale request-form test fixture types before a release build; perform controlled genuine-customer/database issuance/reissue and remote-storage/CORS checks before deployment. See `docs/audits/admin-rfq-detail-2026-10-13.md`. No deployment or customer communication was performed.

## P1 release — 2026-10-14

All six confirmed P1 repairs are released and verified. See docs/audits/p1-remediation-2026-10-14.md and its sanitized evidence. Keep Live checkout disabled. Continue the original P2 and operational/commercial gates; monitor the upstream development-only braces advisory. Extend supplier quote/revised-drawing uploads beyond their current 3 MB form limit if needed. Previously lost ephemeral vendor edits need a recoverable archive; none was present locally.

## Urgent customer payload isolation — 2026-10-14

Remove internal supplier quotes/costs/nested notes and quote attachment metadata from all customer browser/API payloads using an explicit approved field contract. Customer Quotes currently receives full records; customerSafeRequest used for Orders retains internal fields. Add serialization regression tests and authenticated hosted Customer Admin/Member payload checks. See `docs/audits/admin-customer-separation-2026-10-14.md`; passing role/company tests alone does not certify separation.

## Operator audit reset follow-through — 2026-10-14

Local and Production workflow databases are cleared; accounts/company setup preserved. Production R2 cleanup and removal of known APS previews/sources are complete and verified. Other browser profiles/devices must clear workflow draft caches before visiting Quotes/Request Quote to prevent stale draft synchronization. See `docs/audits/workflow-reset-2026-10-14.md`.

## Production invitation delivery restored — 2026-10-14

Resolved: updated the existing Resend secret and redeployed the same current Production source as dpl_AgLKLPVpd66MFuzmRMLux8yBJhYE. Apple Customer Member paik.e.william@gmail.com remains Clerk-linked; replacement invite is SENT and Resend confirms delivered. First sign-in/password setup remains the user’s normal onboarding action; temporary setup expires October 17. Historical provider-rejected attempt remains recorded, not duplicated.

## Production RFQ account audit completed with findings — 2026-10-14

Twelve genuine-customer Production RFQs across four accounts are submitted and admin-reviewed: 24 parts, 39 byte-identical original downloads, 840 matching requirement/metadata comparisons. Exact durable record: `docs/audits/rfq-account-submissions-2026-10-14.json`; findings/report: `docs/audits/rfq-account-audit-2026-10-14.md`. Customer process display, hosted PDF preview and negated-note validation are now repaired/released; see `docs/audits/rfq-audit-repairs-2026-10-14.md`. Autodesk returns `ProductAccessRequiresCapacity`; William confirmed the refill was Codex credits. William must restore Autodesk APS/Flex capacity for the app/team. Admin saved-original retry is implemented and its capacity message is verified. After capacity is restored, verify the six AH previews and add/verify persisted original-file URN plus derived-dimension backfill. Preserve all twelve QA records and the three earlier user RFQs. The audit was read-only apart from its authorized submissions; the subsequent repair release is documented separately.


## 2026-10-16 — Address lookup activation

- Completed 2026-10-16: Lattice Geoapify Free-plan project created with owner approval; server-only key connected as a Vercel Secret for Production/Preview and deployment promoted. Genuine Admin shipping/billing suggestions, keyboard/mouse autofill, manual entry and native state dropdown verified. Original address values preserved. See docs/address-autocomplete-setup.md and the completed-work log.


## 2026-10-19 — Material composition and condition follow-up

- Resolve the 26 specification-dependent composition entries listed in `docs/audits/material-composition-completion-2026-10-19.md` using exact supplier/product standards. No approximate UNS/chemistry or invented temper should be assigned.
- Current dropdown uses one material control for all grade/condition choices; retain separate structured grade/condition metadata internally. Keep unnamed conditions unspecified until documented, and keep sourcing eligibility independent of reference-data coverage.
- Pending: authenticated browser review of the updated single selector and reference lines. Application tests were not run for this follow-up. Local changes need review/commit/push/deployment separately.

- October 19 selector follow-up: visible browse/search count is now 293 after hiding seven unspecified choices with specific condition alternatives. Legacy saved keys remain valid. Browser review remains pending.

- October 19 material curation follow-up: the selector now has 287 choices, including Other with required per-part Manufacturing notes. 18-8 Stainless Steel, generic Invar, ZN, Beryllium Copper, Magnesium, Zinc and Cast Iron are omitted from quote selection; 18-8, generic Invar and ZN are also omitted from the Materials page, while the remaining four stay catalogued. Browser follow-through should cover choosing Other, saved-draft restore, blank-note blocking, submission and admin notes display. No new tests run.
