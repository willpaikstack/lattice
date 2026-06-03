# Decisions

Durable project decisions for Lattice OS. Add new entries at the top.

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

Reason: the quote template should remain useful as an editable Excel/PDF-export tool, but customer, file, line-item, pricing, lead-time, and shipping values already live in Lattice. Prefilling them reduces transcription errors and keeps quote artifacts tied to the durable RFQ record.

Implications:

- Keep DOC-001 as a single-tab customer quote reference/source template for one continuous Excel-to-PDF export.
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

Decision: customer-facing quote status vocabulary is limited to `Draft`, `Quote received`, `Ordered`, and `Closed`.

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

- Use the 2026-06-02 four-status taxonomy: `Draft`, `Quote received`, `Ordered`, and `Closed`.
- Keep submitted, needs-info, and supplier-review as internal RFQ workflow states, not quote statuses.
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
- New vendor documents should be copied into `docs/vendor-sources/` and added to the source document registry before derived data is expanded.

## 2026-05-29 - Separate Overseas Vendor Management From Customers

Decision: add `/admin/vendors` as a dedicated overseas vendor database surface instead of burying shop information inside customer profiles, quote submissions, or equipment catalogs.

Reason: Lattice operators need one place to scan overseas partner contacts, capabilities, quality notes, RFQ response history, selected orders, lead times, payment terms, and shipping lanes while routing RFQs and managing supplier follow-up.

Implications:

- Keep the page table-first and property-driven, using Notion Databases as the UX reference for views, filters, scannable rows, and side-panel details.
- Derive current demo metrics from request supplier quotes and selected supplier orders until durable vendor records exist.
- Later supplier/vendor persistence should feed this page rather than replacing it with a competing admin surface.

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
