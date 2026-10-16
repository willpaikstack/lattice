# Project Context

Account settings usability follow-up (2026-10-15): formatted/validated phone entry, shared billing-email syntax validation, server-bound signed-in password recovery, and a persisted same-as-shipping billing preference are implemented. Linked billing follows subsequent shared shipping edits under serialized writes; prior RFQ/invoice snapshots remain unchanged. Shipping/billing share U.S. city/state/ZIP suggestions with manual entry and browser street autofill. No external street-search provider. Development/Production additive preference schema is applied; source 1d5877c released as dpl_Bz8CdC7v4JduhdfPQZZ7uoRbRmir. Hosted Member phone/reset-binding/address-suggestion/manual-entry checks pass without saving audit edits. Genuine Admin checks also pass: invalid/valid billing email controls, persistent same-as-shipping save/reload and restoration. All 17 pre-check RFQs and original address/contact values are verified unchanged. No automated tests run for this follow-up; see settings audit.

Account settings operational repair (2026-10-15, released): Customer Admins and Lattice Admins can edit shared shipping/billing/AP defaults; personal saves update only the edited group and refresh the shared layout. Photo uploads open their save dialog, and photos/emoji persist in Clerk and render in the sidebar. Password editing is replaced by recovery, whose completion now updates Clerk plus local credentials. New submissions resolve fresh shipping and billing snapshots; quote checkout and invoice generation preserve request-owned data. Added Request.billingSnapshot JSONB and an explicit idempotent migration; local and Production databases are migrated; all 15 existing Production request billing snapshots are frozen with other request fields verified unchanged. All 677 tests pass. Released at latticeos.co as dpl_G4gNx6XcserXJMyV5rEheNFan6en (source 6f05bfd, deployment packaging 2cdac4f). Genuine Apple Customer Admin browser/Production-database checks confirm personal/shared saves, durable photo/emoji reloads, and new RFQ snapshots retained after original defaults were restored. All 15 pre-existing RFQs remain unchanged apart from the additive billing backfill. Genuine Apple Member checks pass: shared defaults read-only, personal phone save/reload/restoration, and shared RFQ snapshots visible. William confirmed recovery email receipt and completed reset; Production confirms consumed token, passwordChangedAt and PASSWORD_RESET_COMPLETED after the successful Clerk update. A separate new-password sign-in was not independently exercised. See docs/audits/account-settings-2026-10-15.md.

Quote preparation controls (2026-10-15): Estimated delivery date and Quote valid until use the shared customer calendar; Shipping speed/Shipping terms use shared custom selects. Expiration retains its 15-business-day default but supports a validated operator override through issuance and persisted quote versions.

CAD viewer presentation restoration (2026-10-15): local CAD rendering keeps the prior compact 320px rounded viewport, top-right orientation cube/Home and floating bottom inspection toolbar. Local replacements provide surface point-to-point Measure (mm/in or explicit model units), multi-mesh Explode and X/Y/Z section clipping. Demo text-button rows and the duplicated visible dimension footer are removed; intake keeps the separate envelope metadata. Screenshot capture remains an unmodified isometric view and excludes tool overlays. Local tools operate on tessellated surfaces; sections do not generate solid caps or CAD edge/face snapping.

Local CAD screenshots (2026-10-15): supported local viewer formats now capture a 384px isometric PNG. Screenshots use private storage sidecars keyed by the original file, with original-file authorization on every read/write. Intake, reopened saved models, quote list/detail and draft continuation share the images; legacy missing thumbnails generate serially in the browser on demand. Draft promotion copies available screenshots. No database schema change or APS conversion is required.

Quote configuration repair (2026-10-15): Enter/implicit form submits cannot create RFQs; the Request Quote click handler is the sole submission path. Separate intended-use quote prompts reassure users that progress stays saved in the current draft. Per-part customer date preference is now `manufacturingDetails.targetDeliveryDate`, labeled Target delivery date in customer and admin views; legacy ship-date values remain readable and are backfilled without changing date values. Release evidence is in the completed-work log.

Hybrid RFQ CAD previews (2026-10-15, released): STEP/STP, IGES/IGS, STL, OBJ and embedded glTF/self-contained GLB use the shared OpenCascade/Three.js browser viewer in intake, reopened drafts, customer View 3D and admin RFQ review. Other accepted native formats continue on APS. Local failures retain originals with an error and never automatically invoke Autodesk, per William’s explicit choice. The admin demo and RFQ files share a 200 MiB per-file cap (labeled 200 MB). Worker parsing is cancellable/serialized and transfers compact geometry buffers. Authorized saved CAD reads stream via read=1 on the app origin; customer/company file authorization remains unchanged. Local STL/OBJ bounds remain unitless; STEP/IGES units are explicitly reported as unknown after normalization to mm. Deployment status and verification evidence are in the completed-work log.

P1 repairs released (2026-10-14): six confirmed findings F4–F7/R1–R2 are verified and deployed as `dpl_LKRxRX56KSzo6DE1vZmomPPFqezZ` (application commits `a96a704`/`e3d8d39`). RFQ validation rejects incomplete packages; malformed drafts recover or remain quarantined; quality uploads use private direct storage up to 25 MB; vendor edits persist in Postgres; Stripe Test provider delivery works without browser return. All 576 tests, 48 customer-access checks, typecheck, lint and local/hosted builds pass; runtime audit has zero advisories. Five unpatched development-only glob advisory entries remain documented. Live checkout stays disabled; P2 and operational rollout gates remain open. See [P1 repair and verification](docs/audits/p1-remediation-2026-10-14.md).

P0 patch released (2026-10-13): application commit `db347a6` fixes normal upload completion, administrative data exposure and CAD model isolation. All 557 tests pass; hosted Preview retests verified normal large/small CAD/PDF uploads, original hashes, role/company boundaries and real APS resource-scoped tokens. Production build `dpl_EmQHJHnZtE1ohen8tAMbuyagnTek` was promoted to latticeos.co and anonymous smoke checks pass. October 14 native browser retests also pass: large/small CAD and PDF uploads, saved two-part solid CAD rendering, draft reload/restore, normal RFQ submission and byte-identical original downloads; foreign-company model access remains denied. Live checkout stays disabled; the later P1 release above supersedes its P1 gates. P2 and operational gates remain open. See [P0 remediation and retest](docs/audits/p0-remediation-2026-10-13.md) and the [original readiness inventory](docs/audits/hosted-readiness-2026-10-13.md).

Prior Production release (2026-10-13, superseded by the P0 patch above): application commit `71b21df` is deployed as `dpl_31kujdnkXEq4S3nwWfkmQ4CaX8ZT` to `https://latticeos.co`. Both manufacturing JSONB columns are verified in Production. The private R2 bucket allows PUT/GET/HEAD from the three exact Production app origins; unrelated-origin preflight is denied. All 529 tests, typecheck, lint and local/remote builds pass. Large-file browser/APS and authenticated customer transaction checks remain follow-up work.

This file is durable project memory for AI agents working on Lattice OS from multiple computers. Keep it concise and current.

## Product

Lattice OS is an owned-code manufacturing RFQ, procurement, and supplier-network workflow platform.

The product is intended to operate similarly to Xometry, Fictiv, Hubs, or Protolabs, but specifically for machine shops. Lattice is backed by William's network of machine shops in China that offer lower-cost custom machining and fabrication services. Domestic companies and machine shops can use Lattice to outsource work to this network so they can access additional machines, labor, materials, and process capabilities without taking on additional CAPEX.

The core use case is helping domestic shops accept jobs they might otherwise no-quote because they are at capacity, lack the right machines, lack available materials, lack labor, or want to advertise capabilities that can be fulfilled through the Lattice supplier network even when those capabilities are not in-house.

Lattice OS is implemented as an owned-code Next.js application.

Core users:

- Buyers submit RFQs with CAD files, materials, quantities, due dates, and notes.
- Lattice operators review incoming RFQs, identify missing information, and prepare supplier outreach.
- Domestic machine shops use Lattice to route overflow or out-of-capability jobs to the supplier network instead of no-quoting.
- Suppliers and downstream order workflows are future phases.
- Admin/customer management surfaces support internal operations.

## Current App State

- Admin RFQ database/detail follow-through (2026-10-13, local): `/admin/quotes` lists only non-demo submission-database records; `/admin/quotes/[requestId]` opens saved parts with exact file-index associations, interactive CAD, PDF/image drawing preview/downloads, full manufacturing requirements/notes, declarations and quality settings. Strict database persistence applies to submission/idempotency, issuance/decisions and supplier-evidence metadata; failure no longer implies a local administrative save. Read-only pages refresh on focus/30-second visible intervals. Existing quotation workbench remains. Both saved CAD models, PDF rendering, direct navigation and 390px fit were verified; no live record mutation/email/deployment. PDF.js worker is locally served and included in standalone tracing. See `docs/audits/admin-rfq-detail-2026-10-13.md`; three synthetic design alternatives remain unselected.

- Admin Quote Submissions reliability (2026-10-13, local): issuance and customer decisions return safe inline errors, retain entered values, prevent concurrent saves, and refresh the same RFQ on success. Explicit per-part prices and validated commercial values are enforced on the server; inactive/archived RFQs cannot be issued and show read-only details. Current single supplier-backed price model and quote-version persistence remain. Focused workflow tests and changed-file lint pass; broader checks have pre-existing RFQ intake type errors and a targetShipDate persistence-test mismatch. Live database/customer issuance and deployment remain unverified.

- Legacy intake removal (2026-10-13): removed hidden requester/PO/due-date/part-name form state and redundant project-process readiness; no invented date or hardcoded requester. Optional backend fields support old records, filenames provide part labels, and per-part processes generate the summary. Authorized development/local-store purge completed for the inspected database, JSON store and active browser origin; other profiles clean on next app load; RFQ submission no longer requires a hidden buyer-company field: customer ownership comes from the authenticated company ID, while admin-created RFQs may remain unassigned.

- Material picker (2026-10-13): user reverted concept A to the original grouped picker. `useSearchFirstMaterialPicker = false` in `request-form.tsx`; the search-first component remains available for a future explicit switch. Catalog, search aliases, existing selections and compatibility rules are retained.

- Target timing (2026-10-12): each configured part now has an optional Target ship date below Manufacturing notes, saved in manufacturing metadata/drafts and displayed for admin review. It is a customer preference, not a confirmed arrival or shipment promise.

- Configuration simplification (2026-10-12): customer part number and CAD/drawing revision controls removed by request; historical metadata remains. Updated competitor comparison: `docs/audits/quote-configuration-update-2026-10-12.md`.

- Quote intake controls (2026-10-12): Configure now uses compact Intended use and Export restrictions dropdowns. Intended use stays at the former card location; restrictions sits below the quote name. Only Prototype/Commercial are offered; legacy Mixed-other drafts require a fresh choice; restricted declarations remain blocked. The CAD-selection popup now asks intended use on a second page after the unrestricted answer; CAD upload/translation/polling/preload continue across both pages.

- CAD preview speed stage 1 (2026-10-12): viewer assets preload as soon as valid CAD selection opens the restrictions popup (before upload), and fitted geometry is revealed before optional toolbar tools finish loading. Remote RFQ files use a company-scoped signed PUT and verified completion; the browser uploads each file once, and the saved CAD object streams to Autodesk through the authorized reference API. Submission waits/retries file persistence and sends references only. Remote downloads use authorized five-minute signed redirects; CAD/drawings share the 200 MiB cap. Local file mode remains available. Before rollout, configure exact-origin bucket CORS using `scripts/configure-rfq-storage-cors.mjs` and perform a live large-file/browser/APS check. This computer has no R2 credentials, so provider CORS and production latency are unverified. No deployment or schema migration. Translation reuse and completion notifications remain future stages.

- RFQ manufacturing intake (2026-10-12, local): per-part Milling/Turning/Sheet Metal (Milling default), material/process-aware finish filtering enforced on submit, customer part number and CAD/drawing revisions with prior-file references, translated CAD dimensions/unit display, and required eligibility/intended-use declarations. Restricted/uncertain declarations remain blocked, but valid CAD selection now uses explicit advance_cad_preview intent to upload/translate before the declaration is answered; drawing uploads and RFQ submission still require unrestricted eligibility; declared restricted work is refused in the China-network workflow. Admin inspector/workbench displays declarations and per-part details. Two additive JSON columns were applied to the configured local DB and Prisma regenerated; production needs `scripts/rfq-manufacturing-schema-2026-10-12.sql` before code release. See `docs/rfq-intake-requirements-2026-10-12.md` for policy/research, validation and the remaining proposed controls.

- RFQ configuration improvements (2026-10-11): new parts have blank material, the progress bar has Upload/Configure/Submit, mobile form controls fit and wrap, modal focus is contained/restored, and a linked per-part readiness checklist explains disabled submission. Pending submission blocks repeat clicks; stable user/company-scoped identities deduplicate retries and database creation races. Existing draft materials are retained. Per-part process is now implemented (October 12); a requested-delivery control remains proposed.

- Materials first-page refresh (2026-10-10): William approved concept A from the Materials design audit. `/materials` now mounts `MaterialFamilyAtlas` with left swatches, compact family descriptions/current counts, plain grade examples, Explore family links, an unlisted-material link, and availability/reference notes. Sidebar and family guides are unchanged. The original `MaterialFamilyCatalog` is preserved; switch the page import/JSX back to revert. See `docs/audits/materials-design-2026-10-10/implementation.md`. Search/comparison concepts remain unapproved.

- Customer onboarding initial draft (2026-10-08): `/admin/resources/customer-onboarding` previews the complete screen sequence and four-stop tour using synthetic data and local React state. Admin Resources links to it. Welcome/Tour/Workspace now reuse the actual customer shell and shared dashboard presentation inside an admin-only isolated frame with empty synthetic data. Tour targets track the real desktop/mobile controls; preview actions are intercepted. Slower content fades now preserve setup chrome and the workspace: 180/380ms setup exit/reveal, 500ms arrival, 150/300ms tour bubble exit/reveal, and 350ms finish. Reduced motion uses immediate transitions. The first workspace/welcome reveal now waits for the embedded document and fonts, then shares one 500ms fade; the welcome card clips header artwork to its own rounded outline. A standalone build of the same component is available through `design-exports/customer-onboarding/README.md` and requires the running local app plus an authenticated admin for its workspace frame. Live auth, address persistence, and durable tour progress are not connected to this draft.

- Customer onboarding design direction (2026-10-08, proposed): a premium welcome followed by an optional four-stop contextual tour, ending on completion or skip before the first RFQ. `docs/customer-onboarding-research-and-design.md` contains research, exact screen/tour copy, motion guidance, accessibility behavior, and feature tradeoffs. Help/replay and durable personal tour progress are proposed additions; no onboarding implementation changed in this research session.

- Admin quotes now use the approved review queue plus quotation workbench: Active/Drafts/Archive views, stage/owner filters, contextual RFQ package/supplier/customer quote inspector, and inline quote preparation with a live commercial summary. Existing server actions, issuance/version persistence, supplier uploads, and official branding remain; RFQ files are shown as a shared package without positional part ownership claims. Customer routes are unchanged.

- Admin customer management now implements the chosen directory/profile option 1: Companies and Waiting list tabs, dialog-based provisioning, and Overview/Users/RFQs & orders profile tabs. Business fields are read-only until Edit company; user access actions live in per-user menus and focused dialogs. Inline saves revalidate existing admin routes without a profile redirect and retain entered values on failure. The current Company/User schema and admin authorization remain the data/access contract.

- As of 2026-10-07, `/admin` uses the approved option 1 visual theme: graphite sidebar, ivory canvas, cobalt actions, and the existing official Lattice logo. `src/components/admin-workspace.module.css` is mounted only on admin routes. Quote home includes live status counts and a separate Drafts view; customer workspace styling remains independent.
- Customer invitations now attach the approved one-page “How Lattice works” PDF from `public/email/lattice-invitation-overview.pdf` through the Resend Base64 attachment field. The editable PDF is `output/pdf/lattice-invitation-overview.pdf`; rebuild it with `scripts/build-lattice-invitation-one-pager.py`. This source change still needs a controlled end-to-end delivery and attachment-receipt check after deployment.

Production launch baseline as of 2026-06-02:

- Vercel project: `willpaikstacks-projects/lattice`.
- Latest Production deployment (2026-10-07): `dpl_BvgER6v3j9A3nrti7P2e3FNXP4op`, Ready and aliased to `https://latticeos.co`. It was deployed from the local `main` worktree; no schema migration ran. The follow-up work described in this handoff was pushed to `origin/main` on 2026-10-08 as commit `2c0ed03`. This does not itself confirm a new Production deployment.
- Production custom domain: `https://latticeos.co`.
- Vercel fallback alias: `https://lattice-phi-plum.vercel.app`.
- GitHub repo connected for automatic Vercel deployments: `willpaikstack/lattice`.
- Vercel Web Analytics instrumentation is installed via `@vercel/analytics` and mounted in the root App Router layout; deploy and visit production before expecting data in Vercel Analytics.
- Neon project/database created for production Postgres: project `lattice`, database `neondb`, production branch in AWS US East 1.
- Prisma schema has been pushed to the Neon production database.
- A separate Neon project, `lattice-development`, is available for local development. Its non-committed connection URL belongs in `.env.local`; its current schema was initialized from `prisma/schema.prisma` on 2026-08-19. Keep it separate from staging and production customer data.
- Vercel Production environment includes `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `WAITLIST_EMAIL_FROM`, `WAITLIST_EMAIL_APP_NAME`, `APP_BASE_URL`, and the private R2/S3 values `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. The Resend key is also currently present in Preview; use a separate restricted Preview key before preview deployments are permitted to send customer email.
- `.vercelignore` excludes local env files from CLI deployment uploads.
- Public waiting-list requests persist to Neon via Prisma; email outbox fallback is non-fatal when Resend is not configured.
- Local development RFQ submissions use PostgreSQL when available and fall back to `.data/requests.json` only when Prisma/Postgres is unreachable, matching the local waiting-list fallback style so sample submissions can still be tested on machines without Docker. Production database errors now fail closed rather than returning local fallback data or implying a durable save.
- Runtime request data is selected by `LATTICE_DATA_MODE`: local development defaults to `mock`, customer-safe mode uses `.data/requests.json` and hides artificial `demo_`/`fixture_` records, and mock mode uses `.data/mock/requests.json` with demo RFQ/order fixtures for UI/product iteration. Production refuses `LATTICE_DATA_MODE=mock`.
- Manufacturing account settings persist personal phone to user-scoped AccountDefaults, name to Clerk and the linked User, and shared shipping/billing/AP defaults to Company. Customer Admins and Lattice Admins may manage established shared defaults; only Lattice Admin may rename companies. Updates are scoped to the edited column group, preventing stale forms from overwriting unrelated data; successful actions refresh the shared layout and failed saves surface errors. Legacy populated per-user company defaults are adopted once into an empty company and cleared from the user record. New RFQ submissions resolve fresh defaults on the server and persist requester/ship-to fields plus billingSnapshot (address/AP email/routing notes). Existing RFQs/quotes/orders retain their snapshots, including checkout; an explicitly edited in-review RFQ shipping address remains request-specific. Missing old shipping no longer silently borrows live defaults. The first-login shipping/billing modal and Customer Admin deferral remain. Profile images and emoji use Clerk and appear in the shared sidebar; support sessions cannot edit the operator identity under a customer name. Settings exposes password recovery, which updates linked Clerk credentials and local audit state with atomic one-time token claiming. The additive billing-snapshot migration must precede hosted release; historical billing that was never saved cannot be reconstructed. Provider address suggestions remain planned.
- Local development RFQ file uploads store actual CAD/drawing bytes under gitignored `.data/uploads/rfq/<date>/...` and persist `UploadedFile.storageKey` with the RFQ. In Production, the same file APIs use the configured private R2/S3 bucket and fail closed if its configuration is absent; live ownership/privacy validation remains required before customer onboarding. Submitted CAD files can also persist `UploadedFile.cadPreviewUrn` from Autodesk Platform Services so customer quote detail pages can show APS thumbnail previews. APS credentials are configured in Vercel Development, Preview, and Production as of 2026-08-18.
- Local development incomplete RFQ drafts now store selected CAD/drawing bytes under gitignored `.data/uploads/rfq-drafts/<date>/...` as soon as the buyer selects them, then persist those `storageKey` references in the browser draft so reopening `/requests/new?draft=local_draft_*` can submit without requiring CAD/PDF reupload. When a draft-backed RFQ is submitted, the API copies any `rfq-drafts/...` CAD/drawing files into permanent `.data/uploads/rfq/<date>/...` storage before persisting the submitted request. Drafts created before draft file storage may still be filename-only and require one replacement upload.
- Artificial seeded RFQs have been removed from the customer runtime quote workflow as of 2026-06-03. As of 2026-08-06, they are permitted only behind `LATTICE_DATA_MODE=mock`, which stores mock fallback records separately under `.data/mock/requests.json`.
- DOC-004, the generated customer quote PDF template, is frozen as Rev 1 as of 2026-06-04. Rev 1 uses the current Hubs-inspired PDF renderer and should not be changed without starting a Rev 2 iteration.
- Customer records now have schema and repository support for durable customer-facing IDs in the format `CUST-000001`. `CustomerSequence` allocates the next global sequence, and `Company.customerId` stores the public customer identifier.
- Customer invoice issuance now has schema and repository support for durable annual invoice IDs in the format `INV-YYYY-000001`. `InvoiceSequence` allocates the next annual sequence, and `Invoice` stores issued invoice snapshots, including optional quote number and shipping terms traceability fields. The DOC-003 resource preview remains a non-issuing template and should not consume invoice IDs.
- Purchased orders render order-specific customer invoice PDFs from accepted quote/order data at buyer, admin, and supplier order invoice routes. The primary buyer order invoice is issued once into the durable `Invoice` table with a unique order key and retains the card payment, tax, shipping, and customer PO snapshot; later refunds do not rewrite the original invoice.
- Account settings include an editable buyer company name and shared company shipping/billing defaults. The latter are persisted on `Company` rather than browser-local or user-scoped fallback storage. New RFQs use the buyer company name as the default Company Name, while revisions/reorders preserve the copied request's original company.
- Stripe card checkout now renders inline on `/quotes/[requestId]/checkout` using a card-only Stripe PaymentIntent and `@stripe/react-stripe-js` `CardElement`. Stripe-managed card fields collect card details in the existing checkout form, Bank/Klarna/dynamic payment methods are intentionally not shown, and the quote is converted to a purchased order only after Stripe confirms the card payment.
- Admins can attach the quote file received from the Chinese/overseas machine shop to an RFQ/order. Supplier quote attachments upload through the multipart route handler at `/api/supplier-quote-files`, are stored as local uploads under `.data/uploads/supplier-quotes` in development, tracked on `LatticeRequest.supplierQuoteFiles`, persisted in Postgres through `SupplierQuoteAttachment`, and surfaced in the admin quote drawer plus quote/order detail pages. PDF supplier quote attachments can be opened in an inline viewer popup from the admin RFQ response drawer while retaining a separate download action.
- Initial quote acceptance remains credit-card-only. Card checkout accepts an optional customer PO reference (payment is still due by card), validates it, saves it before payment, and carries it through Stripe metadata/webhook fulfillment to the order and immutable invoice snapshot. PO-credit payment, AP email, and PO-file attachment are not enabled for this initial release. Focused tests, typecheck, lint, and the optimized build pass; a database-backed Test-mode customer checkout remains outstanding.
- The public site leads with a manufacturing-proof landing page for domestic machine shops managing overflow and cyclical demand. The hero describes Lattice as qualified global CNC machining and fabrication capacity that protects scheduled commitments, lead times, and customer responsiveness; its quality section explains that requested inspection reports and material documentation are uploaded to Lattice for customer review before shipment. A partner-network experience section communicates source-backed industry coverage without customer logos, downstream company names, or implied endorsement. The header keeps `/how-it-works` as its sole public informational route beside Log in and the primary `Request an account` action. The invite-only waiting-list flow explains qualified capacity, managed execution, and pre-shipment quality evidence before collecting company and work details. The former account-free `/simple-quote` workflow has been retired; approved customers submit RFQs through `/requests/new`. Legacy `GUEST_SIMPLE_QUOTE` request-origin fields remain in the data model only for compatibility with existing records.
- Admin quote issuance can now capture a structured selected Chinese shop quote alongside the received supplier quote attachment: shop details plus pricing and lead-time line items entered once in the quote pricing section. Supplier quote total and overall lead time are calculated from those line items plus shipping inputs. Purchased orders with a selected structured supplier quote can render an order-specific DOC-002 supplier purchase order PDF at `/admin/orders/[requestId]/supplier-purchase-order.pdf`; old orders or selected supplier quotes without structured line items show a pending supplier PO state instead of generating a PO from customer prices or an unstructured attachment.
- Admins can archive placed orders from `/admin/orders`. Archived orders keep `status: PURCHASED` and are hidden from the active admin placed-order list through `Request.isArchived`, preserving buyer/supplier lifecycle semantics and invoice eligibility.
- Purchased orders now use a shared manual Lattice progress record: status, assigned Lattice owner, next milestone/date, responsible party, tracking number, and customer-facing update. Admins publish updates from `/admin/orders/[requestId]`; customer dashboard, notifications, order list, and order detail read the same data and flag past milestones as overdue. Supplier/carrier integrations remain future enhancements to this same lifecycle.
- The customer dashboard now separates work from event history: `src/lib/customer-action-center.ts` derives prioritized multi-step workflows for supplier clarification, quote review/expiration, overdue milestones, and customer document review; `/dashboard` shows those workflows in Needs Attention plus a separate Recent Updates preview, while `/notifications` retains the complete chronological feed and is reachable from a global bell. V1 does not persist read state or manual checklist completion.
- Customer, admin, and supplier app spaces are role-aware at the session/proxy layer. Signed sessions carry an `admin`, `customer`, or `supplier` role; customers are redirected to `/dashboard`, admins to `/admin/quotes`, and suppliers to `/supplier/orders` when they attempt to enter another app family. Admin users can also operate customer routes such as `/dashboard`, `/requests/new`, `/quotes`, and `/orders` for development and customer-support simulation. The admin shell exposes a deliberate `Customer workspace` bridge, and admin sessions operating customer routes see an `Admin workspace` bridge back to `/admin/quotes`; customer-role sessions do not see the admin shortcut.
- Customer-facing RFQ, quote, order, checkout, invoice, and submitted-file access is scoped below the role guards by durable customer-company membership. `User` records carry a `WorkspaceRole` (`LATTICE_ADMIN`, `CUSTOMER_ADMIN`, or `CUSTOMER_MEMBER`), optional `companyId`, salted password credentials, verified-email-change state, and temporary-password state; every provisioned user at a customer company can access that company's work, while the Lattice Admin retains global support access. `/admin/customers` is the company-grouped user-management hub: the Lattice Admin can create a customer company and its first Customer Admin in one Clerk-synchronized operation, then add, remove, reset, assign Customer Admin/Member roles, request a verified email change, and open a clearly labelled support session as a provisioned customer user. That support session is company-scoped, is backed by the signed session cookie, and can exit back to the original Lattice Admin; it does not create separate per-tab browser authentication. The existing email remains active until the new inbox confirms its 24-hour single-use link. Passwords are never readable after issuance. Generated temporary passwords expire after 72 hours and force `/account/set-password` before normal workspace access; user-chosen reset-link and custom passwords clear that requirement. Password and Google sign-in both require a provisioned membership (apart from the local Lattice Admin bootstrap), and deleting a membership, changing a password, or confirming a new email invalidates the previous session. New customer RFQs are connected to the signed-in company. Suppliers remain operator-managed without platform access in this phase.
- Sensitive route handlers and server actions now enforce role checks directly through `src/lib/route-authorization.ts`, covering quote PDFs, invoice PDFs, supplier PO PDFs, admin quote workbooks/templates, CAD preview APIs, and role-specific mutations. Public simple-quote review and quote PDFs remain intentionally token-scoped instead of account-scoped.
- The product/services roadmap implementation is retained in source for future use, but `/roadmap` is currently hidden from customer navigation and customer-role access. Admins retain access for future internal review; interest data remains available through `RoadmapInterest` in Prisma or the local development fallback.
- `support@latticeos.co` is configured as a Google Workspace alias for receiving customer support requests, including customer sign-in-email-change requests, and is verified for Resend outbound delivery. A local delivery smoke test succeeded on 2026-08-20. The deployed Production database contains the durable `CustomerInvitation` sent/failed/revoked audit model, and the 2026-08-21 Production redeploy includes automated first-cohort invitation delivery from the Lattice Admin customer workflow with password-free admin responses. A controlled live onboarding test remains required before customer use. Workspace routes are protected by a signed HTTP-only session cookie; the login page presents work email and password together, with Google Workspace SSO through Google OAuth/OIDC available when configured. Durable Lattice/customer role and company membership records now hydrate server sessions and the Google callback; password recovery uses hashed single-use tokens and durable audit events. MFA/passkeys, SSO enforcement, session/device controls, and later activation-link hardening remain future work.

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
- `/equipment-explorer` - additional customer equipment directory below How Lattice works; 150 customer-visible records with process/specification search, milling filters, directory/card layouts, documented capacity and precision, and expandable source evidence. Preserves `/equipment`; source identities remain internal. See `docs/audits/equipment-explorer-implementation-2026-10-12.md`.
- `/equipment` - customer equipment catalog sourced from China machine-shop contacts. The current customer catalog is intentionally limited to CNC Milling, CNC Lathe, QC & Inspection, and Sheet Metal while the remaining process sections are withheld for photo/data cleanup. Every available image remains visible for visual reference; unverified or representative imagery carries a light-yellow `Photo pending verification` label, while confirmed same-model/actual-machine images carry their stronger classification. Compact qualification cards expose known capacity, supplier-reported precision, machine limits, best-fit guidance, technical data sheets, and an RFQ evaluation action; supplier identity, review dates, and source provenance stay in internal repositories.
- `/roadmap` - retained roadmap implementation, temporarily unavailable to customer accounts; admin access remains available for future review/reactivation.
- `/analytics` and `/projects` - placeholder/future modules.

Important folders:

- `src/app/` - Next.js App Router pages, nested routes, and API routes.
- `src/components/` - reusable UI components.
- `src/lib/` - business logic, typed data, persistence, and repository code.
- `prisma/` - database schema.
- `docs/` - product research, implementation plans, and operational references.
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

Product structures established during early research:

- app shell/sidebar information architecture
- `Request Quote` as a primary action
- dashboard metrics, customer notification inbox, and activity lists
- upload-first RFQ flow
- materials and fabrication capabilities as resource catalogs

Current product priorities:

- remove placeholder/debug text
- replace generic users/transactions with manufacturing RFQ/order data
- separate buyer, operator, supplier, and admin workflows more clearly
- make statuses and next actions explicit

## Key Files To Know

- `src/components/app-shell.tsx` - shared shell/navigation.
- `src/components/public-entry.tsx` - shared public greeting-page header and dark technical background used by `/`, `/login`, `/forgot-password`, and the waiting-list confirmation page.
- `src/lib/session.ts`, `src/lib/workspace-user.ts`, `src/lib/route-authorization.ts`, `src/proxy.ts`, and `src/app/login/` - Clerk-managed authentication combined with Lattice's provisioned Prisma `User`/`Company` authorization. A verified Clerk identity is linked to a matching Lattice user on first sign-in; it does not create app access by itself.
- `src/lib/account-settings.ts` and `src/lib/account-settings-shared.ts` - server-visible manufacturing account defaults, browser-safe defaults/types, editable buyer company default, Stripe customer/payment-method lookup, and RFQ quote-contact snapshot helpers. Saved-card ownership is being migrated from the current user-scoped setup to the customer Company; future card-level user/role permissions are roadmap work.
- `src/lib/stripe.ts`, `src/lib/stripe-checkout.ts`, `src/components/stripe-elements-payment.tsx`, `src/app/api/stripe/webhook/route.ts`, `src/app/quotes/[requestId]/stripe/success`, and `src/app/quotes/[requestId]/stripe/cancel` - Stripe integration for hosted card quote payments with automatic tax, signed payment/refund reconciliation and buyer return/cancel handling; inline payments and company saved-card controls remain gated/deferred.
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


## Customer audit implementation, 2026-10-08

See `docs/audits/customer-decisions-implementation-2026-10-08.md` and `docs/audits/customer-checkout-2026-10-08.md`. Customer purchasing is now intended to be credit-card acceptance through Stripe; fifteen-weekday quote validity and optional RFQ quality approval are durable decisions. The local schema includes onboarding progress, company-scoped shared RFQ drafts, support/clarification tickets, quality approval/document keys, checkout/compliance snapshots, one primary annual invoice per order, and lifecycle email events. The configured Development database is reconciled; Production was independently reconciled with additive SQL and the final schema diff is empty. Release `dpl_B2YnUGqkNVau3QQBBBgkMj3yjk73` is deployed/promoted to latticeos.co. Live checkout still requires merchant keys/webhook plus shipping/tax finalization and a controlled payment/refund test. Team management/integration self-service remains deferred.

Stripe follow-through (2026-10-09): plugin connected to Nexus live `acct_1TcAE25pzNAaqmdk`; NY registration and tangible-goods/tax-exclusive settings are active. Initial hosted checkout now calculates automatic tax and reconciles it into paid orders/invoices. Admin-only `/api/stripe/configuration` checks deployed key ownership and readiness; `STRIPE_MERCHANT_ACCOUNT_ID` is required. Live payment creation stays off pending sandbox credentials/testing and signed webhook delivery verification. Earlier unconnected-plugin findings are superseded; genuine customer/payment certification remains outstanding.

Stripe Test mode update (2026-10-09): the existing Nexus shared Test mode is now connected through the plugin. NY test registration and tangible-goods/tax-exclusive defaults are configured; NY and PA synthetic tax calculations passed. Local app test keys and webhook secret are still missing; the user has been asked to configure keys securely in `.env.local`. No actual payment/refund or app end-to-end verification is claimed.

### Stripe runtime checkpoint — 2026-10-09

Nexus Test mode app credentials now authenticate locally. Signed CLI-forwarded webhooks, NY hosted totals, declined card, failed/successful 3DS and a full Stripe test refund were exercised. Local mock checkout/finalization and expired-session retries were repaired; order shipment now displays its saved delivery snapshot. Production checkout is still disabled. Refund status/accounting synchronization remains missing; see the latest checkout audit and work log for evidence and remaining validation. Local secrets remain only in gitignored .env.local.

### Checkout refund/delivery follow-through — 2026-10-09

Refund reconciliation refreshes current paginated Stripe refunds for the order-owned payment/session, tracks successful/pending/failed amounts in checkout JSON and updates customer payment display; original capture/order/invoice stay intact. Initial card purchasing requires finalized DDP delivery terms; saved non-DDP orders display their actual terms. PA browser checkout/cancel/retry/payment and partial/full refund callbacks/UI passed with $0 tax. Link is disabled in live and Test mode default payment configurations; cards remain enabled. Production purchasing remains gated off. See the separate checkout audit for tested coverage and remaining launch/accounting checks.

Production Stripe credential blocker resolved on 2026-10-09: after the Production secret was updated in Vercel and redeployed, authenticated `/api/stripe/configuration` reports `ready: true`, matching the expected Nexus account and confirming payments enabled, active Tax, NY registration, and configured webhook secret. Stripe Live Workbench shows the active `https://latticeos.co/api/stripe/webhook` destination with nine payment/refund event types but no delivery attempts yet. The first actual signed Live delivery remains unverified; test-mode events use a separate signing secret. Live checkout remains disabled pending remaining launch checks.

### First-customer target — 2026-10-09

Target onboarding date is Tuesday, October 13, 2026. William confirmed card payment with a customer PO reference, retaining the card-only initial-release policy. Card checkout needs PO-number capture and order/invoice persistence. First customer/job details remain unknown. See docs/first-customer-launch-readiness-2026-10-09.md for ranked gates, suggested daily schedule and separate onboarding/purchasing go/no-go criteria. No application change or checkout enablement is implied by this planning update.

Production Stripe follow-through (2026-10-09): William updated the Vercel Production `STRIPE_SECRET_KEY`; the current main deployment `dpl_85f4PGEqBd1k1UdmzDmxFRC44d3o` reached Ready and the authenticated diagnostic now reports `ready: true`, with expected account ID match, payments enabled, active Tax, NY registration, and webhook secret configured. Stripe Live Workbench confirms the active endpoint and nine payment/refund event subscriptions, but lists no deliveries yet. Checkout remains disabled. Verify the first real signed Live event during the controlled initial purchase, or explicitly approve a separate real live payment/refund if earlier end-to-end proof is required; complete remaining launch go/no-go checks before enabling checkout.

## Local customer audit fixes — 2026-10-10

- Dashboard greets the customer by first name. Action Center rows show next-step instructions and a named action; clarification, expired-quote renewal, overdue activity and quality-review links target the relevant section.
- Expired quotes hide acceptance and offer an in-app renewal request. Real requests persist as `QUOTE_RENEWAL` support records, visible in `/admin/support`; the dashboard switches to waiting on Lattice until a valid quote is issued. No automatic renewal or outbound email is performed. Local admin demo requests use only `.data/mock/quote-renewals.json`, never the customer database.
- `/how-it-works` now lives under `src/app/(workspace)/how-it-works` to share the existing workspace layout. Guest visitors retain the public explainer. Sidebar navigation starts immediately, keeps current content visible while loading, and uses a 1-second fade-in as soon as the next page is ready, with reduced-motion support and no visible loading bar. Draft synchronization gates only draft-dependent pages; the shell stays mounted.
- Changes are local and not deployed. Genuine database-backed renewal/reissue and deployed navigation verification remain follow-up checks.

Quotes/Orders loading update (2026-10-10, local): route loading boundaries show three muted gray skeleton rows with subtle shimmer; Quotes uses the same fallback while shared drafts synchronize. Headings and sidebar remain visible. Loaded list content uses the shared 1-second fade, with static placeholders and no fade under reduced motion.

Request Quote loading update (2026-10-10, local): `/requests/new` now uses a form skeleton for route loading and draft synchronization, replacing visible “Loading saved drafts”. Heading/intro remain visible; loaded form content fades once over 1 second. Draft synchronization and reduced-motion protections remain.

Shared draft warning resolution (2026-10-10, local): continuing demo/fixture drafts placed synthetic IDs in browser storage; synchronization sent them to an API that accepts only local_draft_* IDs, causing whole-batch rejection and an inaccurate availability warning. Preview drafts now remain local on save/delete, genuine drafts retain server validation, and successful GET clears stale warnings. Development database/table access passed; local Continue/Back no longer shows the warning.

RFQ export intake UX update (2026-10-12, local): CAD selection now opens a Xometry-style declaration dialog with staged file rows and Back/Continue controls. Selected bytes stay on-device until explicit unrestricted confirmation; Yes/Unsure stop the batch. Existing configuration exposes a declaration summary/change action; required intended use remains there. Backend eligibility guards and persisted declaration schema remain the same.

Export declaration copy follow-up (2026-10-12, local): customer dialog now requires an explicit Yes/No decision and has no Unsure selection. Choices use regulatory categories rather than country-centered wording. Legacy unsure declarations remain blocked and must be answered again.

CAD status follow-up (2026-10-12): speculative translation was starting in step 1, but its cached start response could show stale queued status on Configure. Pending jobs now poll during the restrictions popup every two seconds, refresh immediately when Configure opens, and continue polling without overlapping requests. Manifest/status responses use no-store. Temporary status failures retain the job; no translation is restarted during the transition.

Prepared CAD model handoff (2026-10-12, local): the first successfully translated staged CAD now loads/renders in an invisible, inert parking region behind the export popup. A stable portal moves the same viewer/canvas into Configure and resizes/refits it, preserving downloaded model data and metadata. Only the first unconfirmed model per batch is warmed. Cancel/removal/replacement/form exit releases unused viewers; APS translation timing/cancellation is unchanged. A real sample reused the same viewer ID/canvas count across Continue; local visibility was observed around 0.3 seconds once preparation had completed.

## 2026-10-13 — Quote attachment history disabled

Quotes retain only current CAD/drawing attachments in new intake. Previous files is removed from configuration and admin review; draft restoration/reorders and new submissions clear legacy history references. Replacements no longer wait for old uploads to save. Existing submitted records and stored objects are not bulk-purged.

- 2026-10-13: Autodesk viewer runtime initialization/authentication is shared across part viewers. Per-part concurrent Initializer calls could race global SDK token-refresh state and strand later previews before canvas creation; viewer/model instances remain independent.

## Operator audit reset — 2026-10-14

Local and Production workflow records, local/Production original uploads and known saved APS previews have been cleared at the user’s request; accounts/company setup/vendors/catalogs/configuration remain. Current Chrome LATTICE profile shows empty Quotes/Orders; other profiles/devices must clear stale workflow drafts before use to prevent resync. See `docs/audits/workflow-reset-2026-10-14.md`. This is a data reset, not remediation of the customer payload isolation finding.

## Production email configuration repair — 2026-10-14

Existing Resend credential updated; exact live source redeployed from dpl_BXe3TNJrxeQuwkrdRatoBL3JbedJ to dpl_AgLKLPVpd66MFuzmRMLux8yBJhYE, Ready on latticeos.co. Apple Customer Member paik.e.william@gmail.com has a replacement invitation confirmed delivered by Resend; role/company preserved, first password setup pending. No app code changes.

## Admin quote navigation — 2026-10-14

Production `/admin/quotes` now uses a full-width table with no side inspector. Entire RFQ rows open dedicated detail pages; company shortcuts remain independent. Released/verified as dpl_8fsneoxWEbvWYqsYnoQ5WGT2suhC.

## Admin RFQ submission provenance — 2026-10-14

Queue now shows Eastern submission date/time (EST/EDT) and Submitted by instead of Due/owner and Customer quote. New submitted RFQs snapshot authenticated name/email; legacy blank names resolve from their saved email within the company for admin display. Released as dpl_53DPonoVfbvRSs1kMc6sYp4Cbcsy; 37 focused tests and live display/click checks pass.


Production RFQ intake/review audit completed (2026-10-14): four genuine customer accounts submitted three synthetic Production RFQs each; all 24 parts were reviewed as Lattice admin, all 39 originals download unchanged, and 840 comparisons match selected requirements/metadata. Three app defects remain (customer aggregate process display, hosted PDF previews, negated free-text drawing-required validation), plus Autodesk translation 403 affecting the six final-account models despite user-reported replenished credits. No source repair/deployment. Exact submitted values and durable findings are in `docs/audits/rfq-account-submissions-2026-10-14.json` and `docs/audits/rfq-account-audit-2026-10-14.md`.

## RFQ audit repairs — 2026-10-14

Released customer per-part process fallback, authenticated same-origin PDF preview streaming, and structured drawing-requirement validation/prefill (existing JSON metadata, no migration). Added admin saved-original CAD retry and a specific APS capacity error. Autodesk returns `ProductAccessRequiresCapacity`; newly added credits were Codex credits. William must restore APS/Flex capacity; six AH CAD previews and persisted URN/dimension backfill remain outstanding. Release `dpl_FboVWTNXMVUuxkBmZ1oLvk9ijLDN`. See `docs/audits/rfq-audit-repairs-2026-10-14.md`.

Quote preparation layout (2026-10-16): removed the embedded Active RFQs sidebar from the customer-quote workbench and expanded the editor to its available width. Global navigation, Review queue and the quote summary remain. Shop name is explicitly optional, with a blank No shop selected option; generic unassigned supplier metadata does not appear as a named vendor.

Quote preparation simplification release: source a17ffd6/9a3b1fd is live at latticeos.co as dpl_8SsFm13ehsEEd6BffUjSdNCCPhMo. Hosted browser confirms zero embedded RFQ queues, blank optional shop selector, retained global navigation and quote summary. Typecheck, focused lint and hosted build pass; no quote saved/issued/emailed. Released from a clean committed-source archive so unrelated in-progress quote address edits remain local.

Admin RFQ queue grouping (2026-10-16): Active now renders two distinct tables: Submitted RFQs (SUBMITTED/NEEDS_INFO/READY_FOR_SUPPLIER_RFQ) and Customer quotes issued (QUOTED). Shared search/stage/owner filters apply to both. The Submitted RFQs metric excludes issued quotes; Drafts and Archive retain their views. No request statuses or records change.

Admin queue split release verified (2026-10-16): source 7cf4ad8 is live as dpl_BxaCczsSFJSQ1jYSbCThyiv3BMFG. Genuine admin view shows Submitted RFQs 15 and Customer quotes issued 2, with 17 distinct RFQ detail links. Search, issued-stage filtering, Drafts and Archive pass browser checks; unfiltered Active restored. No request data changed.

Quote submissions summary cards removed (2026-10-16): the page now opens with queue tabs/search/filters and the separate submitted/issued tables. Counts remain in the table headings and view tabs.

Quote summary-card removal is released as dpl_4LeAnUKpDHdxCMUbfgqoiisjfSZj (4388798). Hosted admin browser confirms zero summary-card sections and the existing 15 submitted/2 issued rows retained.

Admin Users directory (2026-10-16): added /admin/users and a sidebar entry showing every provisioned User across Lattice Admin/Customer Admin/Customer Member roles, including unassigned accounts. Search, role/company filters, company-profile links, sign-in setup and creation date are read-only. Page and server-only data access enforce Lattice Admin authorization before private queries and return a field-limited DTO. Renamed the existing company directory to Companies throughout its navigation/header/search/breadcrumb; /admin/customers URLs remain compatible.
