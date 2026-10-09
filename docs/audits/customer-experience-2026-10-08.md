# Customer experience audit — October 8, 2026

## Assessment

The customer app has a useful RFQ, quote, order, and resource interface, but several visible actions do not complete a durable workflow. The highest priorities are draft privacy, real support delivery, usable quality documents, and an explicit first-cohort purchase process. A clean production customer end-to-end audit is still required.

This report combines interactive browser testing of the local app, source inspection, and the entire existing automated suite. It is not a certification that every feature works in Production.

## Environment and limits

- Browser: Chrome, local app at `http://localhost:3000`, signed in through the existing `will@latticeos.co` Google identity. The session is **Lattice Admin**, using the app's customer workspace bridge; it is not an ordinary Customer Admin/Member session.
- Data: local demo/fallback RFQs and orders. Browser/server warnings confirm Prisma reads fail because `Company.addressOnboardingDeferredAt` is absent in the configured database. Customer-directory reads also fall back, so no real company-scoped support session was established.
- Production: `/dashboard` redirects to the production sign-in screen; authenticated production customer behavior was not tested.
- Upload attempt: the synthetic zero-byte STEP fixture could not be selected through the Chrome automation file chooser because the extension lacks file-URL access. No successful CAD/drawing upload, APS translation, or new RFQ submission was performed. Native-picker fallback did not expose a usable chooser.
- Mobile: the viewport capability was attempted at 390 × 844, but actual page dimensions stayed 1470 × 746. The override was reset. Mobile behavior is **not verified**.
- No payments, orders, real support emails, invitations, credential changes, database migrations, production data changes, or app-code fixes were made. The support form test changed only transient component state. The CMM inspection option used for a validation check was restored.

## Features exercised

| Area | Checks performed | Result / limits |
| --- | --- | --- |
| Sign-in | Local Google account chooser and existing Lattice identity; production protected-route redirect | Local admin sign-in works. Provisioned customer login, first-password setup, reset, expiry, and invitation receipt remain unverified in the browser. |
| Customer shell | Sidebar routes, account menu, customer/admin bridge | Navigation works on desktop. Customer role-specific restrictions have automated coverage, but this browser session has admin permissions. |
| Dashboard | KPI links, Action Center, activity rows | Loads and links work; inconsistent counts and hidden actions found. |
| Notifications | Bell expansion, full history, record links | History loads; no durable read/unread or customer response workflow. Historical draft-created events can link to a draft URL even after the RFQ has been submitted. |
| New RFQ | Empty upload state, saved-draft resume, ISO tolerance dialog, quality dropdown | Loads. Standard Inspection stays required; selecting CMM without a drawing shows a required-drawing error. Successful uploads and submission were blocked by tooling. |
| Reorder | Prefill from `demo_order_quality` | Copies material/quantity and creates reorder context. This demo has only filename references, so CAD must be reuploaded; real stored-byte reuse was not verified. |
| Quote list | In-progress and quote-received groups; record navigation | Loads; purchased records are excluded. Current fixture sections have at most three rows, so pagination was not exercised. Delete/discard/archive were not executed. |
| Clarification | `demo_needs_info_valve` | Operator question is visible; there is no reply or replacement-file action. |
| Issued quote | `demo_quoted_brackets`, pricing, shipping, activity, purchase entry | Pricing is readable; expired quote still offers acceptance/checkout. |
| Quote PDF | Download LQ-4107 | Browser download succeeds: `lq-4107-amogy-manufacturing.pdf`. PDF layout/content was not separately rendered and inspected. |
| Checkout | Open issued quote checkout; switch card to PO | Both modes and tax-exemption options are exposed. Stripe reports unconfigured locally. No terms were accepted and no checkout submitted. |
| Orders | List; search `Battery`; status/milestone details | Search narrows from five to one order. Overdue milestones are visible. Reference generation needs review. |
| Order detail | `demo_order_quality` | Shows production context, milestone owner, quality metadata, and activity; original/quality files cannot be opened from the page. |
| Invoice | Download invoice for demo quality order | Browser download succeeds: `inv-demo-ord-amogy-manufacturing.pdf`. Immutable issued-invoice linkage and PDF visual QA remain unverified. |
| Order help | Enter synthetic audit note, submit, refresh | **Defect:** shows “Help request sent” although implementation only sets local React state. Refresh returns the blank form; no persistence or delivery exists. |
| Materials | Families, aluminum detail, 6063 T5 → T6 | Condition and reference properties update correctly. All families/grades were not individually checked. |
| Material inquiry | Open `/materials/inquiry` and inspect form | Form exists; no inquiry was submitted. Entry is not discoverable on the material family/directory components inspected. |
| Equipment | ZEISS search, reset, CNC Mill selection, no-match query | Search, reset, category isolation, and empty result feedback work. No technical specification document was independently verified. |
| Capabilities | Resource page, CMM thumbnail selection | Hero image updates to the selected photo. |
| Inspection guide | Definitions, drawing requirements, return-to-RFQ navigation | Content loads. Customer document review/approval workflow is missing despite service promises. |
| How it works | Authenticated resource presentation and sidebar | Loads with customer shell and RFQ CTA. Claims about pre-shipment document access exceed current order functionality. |
| Account settings | Profile/security/defaults/team sections; phone editor open/cancel | Editor opens and cancels. Saves, photo uploads, password changes, real customer permission boundaries, and address onboarding were not browser-tested. |
| Shipped / tracking | Dashboard link and tracking context inspected | Carrier link logic has automated coverage; carrier destination and delivered-state UI were not separately browser-tested. |

## Develop first

### 1. Enforce ownership of draft data and files — P1

**Source-confirmed privacy gap; no cross-company exploit was performed.** `canCurrentSessionAccessStorageKey()` authorizes any customer for any `rfq-drafts/...` key, rather than checking the owning user/company. Draft upload storage does not persist an owner. Incomplete RFQs also share the origin-wide `lattice.incompleteRfqs.v1` browser key; both the form and Quotes merge these drafts without a company/user filter. The logout endpoint does not clear them.

Implement company/user-owned durable drafts and uploaded-file records, authorize draft download and submission against those owners, scope or retire browser draft storage, and add two-company/shared-browser tests. Random storage keys are not an ownership boundary. Verify legacy drafts and files before migration.

Evidence: `src/lib/request-access-policy.ts`, `src/app/api/request-draft-files/route.ts`, `src/components/request-form.tsx`, `src/components/buyer-quotes.tsx`, `src/app/api/logout/route.ts`.

### 2. Make order support real — P1

Reproduction: open `/orders/demo_order_quality/help`, enter an audit note, click Send help request. The page says Lattice has the note and will follow up, but `handleSubmit()` only calls `setSubmitted(true)`.

Persist a company-owned support request with order, issue, urgency, message, requester, timestamp, and status. Route it into an operator queue; connect delivery with error/retry feedback; show success only after storage succeeds. Use the configured Lattice support identity consistently. Orders currently hard-code Erik Mast and `erik.mast@latticeos.com`, while quote detail uses William and `will@latticeos.co`.

Evidence: `src/components/buyer-order-help.tsx`, `src/components/buyer-order-detail.tsx`.

### 3. Build document delivery and customer quality review — P1

Reproduction: `/orders/demo_order_quality` shows Inspection report and Material certification but no preview/download controls. Original order files show a decorative download icon without a link. `SupplierDocument` stores name/type/size/category but no storage reference.

Add private stored document bytes, ownership-checked preview/download, revisions and document-to-part/lot linkage. Add explicit customer approval or rejection with notes and an operator-visible shipment-hold state where the customer requested approval before shipment. Preserve audit history and notify operators. Otherwise the quality-review milestone cannot be completed through the app.

Evidence: `src/components/buyer-order-detail.tsx`, `prisma/schema.prisma` (`SupplierDocument`), `src/app/how-it-works/page.tsx`.

### 4. Implement the approved first-cohort purchase boundary — P1

Reproduction: `/quotes/demo_quoted_brackets/checkout` offers card, PO, and tax-exemption choices. Account settings says cards are available. The August 19/21 decisions say card, PO, and tax exemption are unavailable for the initial release.

Add a shared server-enforced purchasing policy and matching UI. For the first cohort, provide a clear operator-assisted approval/order-release path with durable approval context and customer-facing next steps. Later activate card/PO/tax workflows deliberately after their validation and entitlement work. Missing Stripe keys alone are not a product gate; the PO action has no company credit/approval entitlement check.

Evidence: `src/components/buyer-quote-checkout.tsx`, `src/components/account-settings-workspace.tsx`, `src/app/(workspace)/quotes/[requestId]/checkout/page.tsx`, `src/app/(workspace)/quotes/[requestId]/actions.ts`, `src/lib/request-repository.ts`, `DECISIONS.md`.

### 5. Enforce quote validity and persist checkout choices — P1

Reproduction: demo LQ-4107 expired August 10, yet quote detail offers Accept quote and its October 8 checkout loads normally. Dashboard correctly calls it a quote needing renewal. Checkout authorization and repository purchase logic check `QUOTED`, but not validity.

Reject expired/stale quote versions on the server and provide Request renewal. Persist the accepted quote version and agreed terms. Checkout currently collects shipping method, requested delivery date, shipping instructions, end use, export-review choice, compliance certification, and tax status, but its actions do not consume these fields. Validate required delivery/compliance/terms on the server and retain their snapshots, or remove controls that cannot affect the order. This is implementation verification, not legal advice about import rules.

Evidence: `src/components/buyer-quote-checkout.tsx`, `src/app/(workspace)/quotes/[requestId]/actions.ts`, `src/lib/request-repository.ts`, `src/lib/stripe-checkout.ts`.

### 6. Let the customer resolve clarification requests — P1

Reproduction: `/quotes/demo_needs_info_valve` asks for a thread/finish clarification but contains no reply, attach-file, or resubmit action. Contact details are text, rather than a focused response action.

Add a company-scoped clarification thread with reply attachments and an operator queue state transition. A smaller first-cohort implementation can give a prefilled support-email action, but must make the handoff and return-to-review process explicit. Preserve each question/reply independently; current activity rendering uses the latest operator note for historical clarification/no-quote events.

Evidence: `src/components/buyer-quote-detail.tsx`, customer Action Center and notifications.

## Next improvements

| Priority | Development | Evidence / benefit |
| --- | --- | --- |
| P2 | Fix Action Center truncation/counts | Dashboard shows eight open workflows and five customer actions, but slices the list to five and then announces three customer items. No View all action exists, so lower-priority clarification/document actions can disappear. Count the complete set and expose all workflows or a continuation link. |
| P2 | Persist file-to-part association | `bundledFilesByLineItem()` independently indexes CAD and drawing arrays. If only part two has a drawing, it can be displayed as part one's drawing. Store line-item IDs on files and use those associations for UI and generated manufacturing documents. |
| P2 | Use unique, durable order/invoice references | All five demo orders display `PO-DEMO_ORD`; invoice download uses `INV-DEMO_ORD`. First-eight-character truncation also risks collisions for real ID formats. Add collision-tested durable references and connect order invoice downloads to saved issued `Invoice` snapshots. |
| P2 | Integrate onboarding | Welcome/tour lives only in the admin prototype. Connect real role/account state, durable progress, skip/resume/replay, production address suggestions, and controlled invitation validation. |
| P2 | Add durable notifications | Read/unread, preferences, event snapshots, customer replies, and transactional RFQ/order notifications. Old “draft created” links should open the record's current route. |
| P2 | Make material inquiries discoverable | Existing route/form has no entry in the material catalog components inspected. Add an unlisted-material CTA and customer inquiry status/history. |
| P2 | Align price/readiness copy | Checkout labels duties Included and tax $0 while shipping is Pending, yet presents a payable total. Require explicit agreed commercial terms before release, and distinguish estimates from final amounts. |
| Later | Company team administration/integrations | Intentionally centralized in Lattice Admin for first cohort; add governed roles, invitations, audit history, and company payment vault when enabled. |
| Later | Projects, analytics, carrier automation | Future modules; not blockers for proving the initial RFQ and operator-assisted fulfillment experience. |

## Engineering and validation results

- `npm run typecheck`: **pass**.
- `npm test`: **315 passed, 14 failed, 329 total**; **72 passing files, 3 failing files**.
  - 11 failures in `operator-request-detail.test.tsx`: expected retired drawer/table UI after the new review workbench. Update coverage to prove the current operator flow; do not simply remove failing tests.
  - 2 failures in `customer-invitation-email.test.ts`: old no-login-link expectation and company-name expectation no longer match current invitation copy. These failures do not by themselves prove a mail-delivery or escaping vulnerability.
  - 1 failure in `api/requests/route.qc.test.ts`: expected `Invalid local file storage key`, received `Invalid file storage key`. Status 400 still passes; this is an assertion mismatch, not evidence traversal succeeds.
- `npm run lint`: **fail — 9 errors, 1,183 warnings**. Seven source errors arise because a plain helper named `useValue` is interpreted as a Hook inside `fillMissingAddressFields`; rename the helper. Two errors and the bulk of warnings come from linting the generated onboarding bundle in `outputs/customer-onboarding/assets/`; exclude generated output appropriately.
- Existing passing tests include customer request form, quote/order presentation, access policies/direct URL ownership, account settings, material/equipment behavior, dashboard/activity, repository payment rules, and PDF helpers. These use mocks and do not establish live database, email, APS, storage, or Stripe reliability.
- Browser warning: `The column Company.addressOnboardingDeferredAt does not exist in the current database.` Reconcile the development schema against this checkout before testing database persistence. Verify production schema independently; do not infer production failure from the local warning.

## Finish the end-to-end validation

1. Reconcile the development database schema and use provisioned Customer Admin and Customer Member accounts at two companies.
2. Enable a working fixture-upload test channel; submit single/multipart RFQs, drawings, empty/unsupported/oversized files, duplicate names, and draft refresh/recovery. Verify persisted bytes and private storage ownership.
3. Run quote issue → clarification reply → renewal → approved manual release → production update → quality review → shipment → delivery using isolated test records.
4. Test direct URLs/actions/downloads between companies, including draft keys; test shared-browser logout/login and draft isolation.
5. Run real-device/mobile viewport and keyboard/focus/dialog checks. Verify PDF content/layout separately.
6. Validate invitation attachment receipt and recovery without collecting credentials in audit artifacts. Validate live external services only in deliberate test environments; payment authorization remains separate.
7. Repeat in customer-safe deployment with production configuration checks and clean automated gates.

Recommended order: draft isolation and schema readiness, support/clarification, document delivery/review, gated manual purchase lifecycle, then onboarding and notification improvements.
