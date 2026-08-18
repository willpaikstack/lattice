# Lattice OS QC And Testing Plan

Date: 2026-06-18

## Scope

This plan covers the core RFQ-to-order workflows that need to stay reliable before broader customer, admin, and supplier use:

1. Customer RFQ submission
2. File upload and drawing attachment
3. Admin quote review
4. Supplier quote entry
5. Customer quote approval
6. PO/invoice generation
7. Order status tracking
8. Email notifications
9. Role-based permissions for customer, supplier, and admin

## Quality Gates

- Required fields reject missing or invalid buyer, part, quantity, due date, payment, and PO data.
- Uploaded CAD, drawing, supplier quote, and customer PO files must be non-empty, safely named, and stored outside draft-only namespaces after submission.
- Customers and suppliers must not enter each other's route families.
- Sensitive documents and APIs must enforce direct route/action authorization, not only Proxy redirects.
- Customer quote approval must not convert to an order until payment or purchase-order requirements are satisfied.
- Stripe finalization must be idempotent and must reject amount mismatches.
- Admin quote issuance must preserve supplier-side pricing separately from customer-facing quote pricing.
- Email notifications must contain private, specific links only where token/session scope allows it.

## Automated Coverage Added

### Authenticated workflow command

Run `npm run test:auth-workflows` for the access-critical RFQ lifecycle checks. It uses mocked payment, upload, and document bytes only: no live Stripe charge, email, object-storage operation, production database, or supplier login is required.

- RFQ submission: authenticated company customers receive their own company ID and cannot submit while unassigned.
- Checkout and orders: an owning customer can submit a PO-backed quote checkout; cross-company direct posts are blocked before checkout or order state changes.
- Documents: customer-owned RFQs and PO documents are available only to the owning company or Lattice admin; supplier quote files remain admin-only.
- Supplier access: customer sessions and unauthenticated calls cannot mutate supplier order state. Supplier-portal happy paths remain deferred until suppliers are deliberately onboarded.

- `src/app/api/requests/route.qc.test.ts`
  - Admin-only request queue access.
  - Customer/admin-only RFQ submission.
  - Supplier and unauthenticated submission denial.
  - Missing stored file bytes rejected.
  - Missing multipart file rejected.
  - Empty multipart file rejected.
  - Unsafe storage key traversal rejected.
- `src/lib/route-authorization.qc.test.ts`
  - Unauthenticated sensitive route access returns 401.
  - Wrong-role sensitive route access returns 403.
  - Allowed role access returns no blocking response.
- `src/lib/local-file-storage.test.ts`
  - Local upload keys are scoped under the requested upload folder.
  - Unsafe filenames are sanitized.
  - Stored bytes can be read back.
  - Traversal storage keys are rejected.
  - Draft upload key detection is pinned.
- `src/lib/request-repository-qc.test.ts`
  - PO checkout converts a quoted RFQ into a purchased order only with PO number, AP email, and uploaded PO file metadata.
  - Card checkout cannot bypass Stripe finalization.
  - Stripe checkout session recording marks payment pending.
  - Stripe finalization rejects amount mismatches.
  - Stripe finalization converts to purchased order and stays idempotent on retry.
- `src/lib/guest-quote-email.test.ts`
  - Guest quote acknowledgement and ready emails include the expected recipient, copy, quote reference, and absolute private quote link.

Existing coverage also exercises request-form drawing-required validation, admin RFQ decision validation, customer quote/detail rendering, supplier order detail rendering, invoice/PDF builders, dashboard/notification derivation, guest token validation, auth role routing, and quote/order UI regressions.

## 2026-06-18 Manual Fixture QC Run

Executed against the local app on `localhost:3000` with the fixture pack in `fixtures/manual-testing/cad/`.

- Created RFQs:
  - `cmqjwu9et0001fzvmd0uqm6td` - single STEP plus drawing PDF.
  - `cmqjwu9fn0008fzvme2lt4n3l` - multi-file RFQ with `.step`, `.stp`, duplicate basenames, spaced filename, and drawing PDF.
  - `cmqjwua9d000mfzvm4yt6iwg6` - other-company direct URL privacy probe.
- Passed: 24 live checks, including unauthenticated/admin/customer/supplier route role guards, required title/file validation, zero-byte STEP rejection, STEP/PDF upload persistence, multi-file upload persistence, local RFQ file preview, admin RFQ queue visibility, admin quote review page load, customer quote detail page load, supplier quote attachment upload, empty supplier attachment rejection, supplier-role attachment upload rejection, existing purchased-order invoice PDF rendering, and supplier invoice route role enforcement.
- Failed: 2 privacy probes.
  - Any authenticated customer could download a supplier quote attachment through `/api/local-files/[storageKey]` if they know the storage key. Expected secure result is 403 or 404.
  - A second customer-role session could load another company's `/quotes/[requestId]` by direct URL. Expected secure result is 403 or 404.
- Follow-up implementation: customer quote/order/detail/checkout/list/file access is now company-scoped. Customer Admins and Customer Members can access records owned by their company; Lattice Admin support access remains broad. Supplier portal ownership is deferred because suppliers are not yet platform users.
- Tooling limitation: the in-app browser runtime could inspect pages but did not expose file chooser upload, cookie setting, or authenticated upload automation hooks, so file-heavy manual checks were run through live multipart requests and direct role-cookie page/API probes.

## Manual Test Matrix

Manual fixture pack: `fixtures/manual-testing/cad/`.

| Workflow | Manual test | Expected result |
| --- | --- | --- |
| Customer RFQ submission | Submit one RFQ with one CAD file and all required fields. | Buyer lands on quote detail; admin sees the request in `/admin/quotes`. |
| Customer RFQ submission | Submit multi-part RFQ by dragging multiple CAD files. | One configurable line item appears per CAD file and submits as one RFQ. |
| File upload and drawing attachment | Select FAIR/dimensional documentation without drawing. | Form blocks submit and asks for a drawing. |
| File upload and drawing attachment | Upload large CAD, unsupported extension, empty file, duplicate names, and filename with path-like characters. | Empty/invalid cases are blocked; valid names are sanitized; no UI crash. |
| File upload and drawing attachment | Refresh a local draft with draft-stored CAD and drawing files. | Draft reopens without requiring reupload when storage keys exist. |
| Admin quote review | Open new RFQ drawer, inspect files, request more info with customer note, then no-quote a separate RFQ. | Customer sees correct status and note in quote detail, dashboard, and notifications. |
| Admin quote review | Issue a quote with shipping, validity dates, selected supplier shop, and per-line pricing. | Quote is read-only by default after issue; buyer sees latest quote. |
| Supplier quote entry | Upload PDF supplier quote, preview it inline, download it, then remove it. | Admin drawer and quote/order detail stay in sync. |
| Supplier quote entry | Enter structured supplier line costs that differ from customer prices. | Supplier PO uses supplier costs only and does not leak customer markup. |
| Customer quote approval | Try card checkout with Stripe test cards for success, decline, cancel, retry, and duplicate webhook. | Order creates only after successful payment; duplicate webhook does not double-convert. |
| Customer quote approval | Try PO checkout without PO number, without AP email, and without PO file. | Each missing requirement is blocked before order creation. |
| PO/invoice generation | Download buyer, admin, and supplier invoice PDFs for a purchased order. | PDFs render, content matches accepted quote/order/PO context, and routes enforce role. |
| Order status tracking | Move supplier status through acknowledgment, production, QC, docs uploaded, ready to ship, shipped. | Buyer, admin, supplier, shipped, and notifications surfaces reflect expected state. |
| Email notifications | Configure Resend test sender and issue guest quote. | Acknowledgement and quote-ready emails are delivered with correct private link. |
| Role permissions | Login as customer, supplier, and admin; probe protected route families and document URLs directly. | Customers cannot access admin/supplier routes; suppliers cannot access customer/admin routes; admins can access admin and customer support routes only. |
| Data privacy | Attempt to open another company's `/quotes/[requestId]`, `/orders/[requestId]`, invoice PDF, and checkout URL. | Customer-role sessions should receive not-found/forbidden unless the record belongs to their company. Lattice Admin sessions should retain support access. |

## Known Risks And Gaps

- Customer ownership is company-scoped: Customer Admins and Customer Members can access records owned by their company, and records without a company assignment remain hidden from customer sessions. Lattice Admin access remains broad.
- Supplier ownership is intentionally deferred because suppliers are not yet platform users; supplier communication and data are managed by Lattice operators.
- Production upload storage still uses a local-development bridge in this repo. R2/S3 integration needs separate tests for object ACLs, signed URLs, size limits, retry behavior, and malware/content scanning policy.
- Stripe tests here cover repository business rules, not live network behavior. Webhook signature validation and test-card flows require Stripe CLI or dashboard test mode.
- Email tests cover message composition; Resend delivery, sender-domain alignment, SPF/DKIM, bounce handling, and local-outbox policy still need environment-level validation.
- Invoice downloads currently render repeatable order-derived references. Durable issued invoice snapshots and annual invoice IDs need deeper accounting tests once wired into order downloads.
- Supplier workspace access remains intentionally disabled until supplier users are deliberately onboarded.
