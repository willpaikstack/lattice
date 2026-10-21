# Admin/customer separation review — October 14, 2026

Update October 20: the supplier payload exposure below is repaired in local source. The original findings are retained as historical evidence; implementation and current verification are recorded in the dated section at the end. No deployment or new authenticated hosted payload check is claimed.

Complete administrative-data isolation is not yet established. This is a source review and focused local test rerun, not a new authenticated Production payload test.

Existing controls: admin pages check role before private queries; handlers/actions enforce roles; customer requests/files are company-scoped; supplier quote attachment bytes are admin-only. The October 13 P0 report records deployed admin-page guards and hosted negative tests.

Remaining high-priority exposure:

- `src/app/(workspace)/quotes/page.tsx` passes full company-owned requests from `listBuyerQuotes` to the client component `BuyerQuotes`. The repository includes internal supplier quotes/attachments without redaction.
- `src/app/(workspace)/orders/page.tsx` passes `customerSafeRequest` results to client component `BuyerOrders`. That helper spreads the original request and supplier quotes, retaining supplier costs, structured line-item supplier notes/pricing and supplier quote attachment metadata. It redacts selected names/text rather than enforcing an approved customer field list.

These fields cross the browser boundary even if no visible control renders them. Actual exposure depends on populated internal records. Supplier attachment byte authorization remains a separate admin-only control in the reviewed policy.

Verification: seven focused suites / 45 tests pass (admin page authorization, partner privacy, request access, route authorization, direct URL ownership, file access and CAD access). Current privacy tests cover selected names/free text, not absence of all internal fields. No application code or deployment changed.

Next: define an explicit customer payload contract; apply it to every customer client component/API response, including submission retry responses; add regression tests with supplier names/costs/nested notes/attachment markers; inspect authenticated hosted HTML/React payloads as Customer Admin and Customer Member before certifying separation.


## Local repair — October 20, 2026

`src/lib/customer-request.ts` now defines a server-only `CustomerRequest` contract and constructs every returned object from approved fields. No full-record or nested stored-object spread is used. Supplier quotes and their prices/line-item notes, supplier quote attachment metadata, internal assignments/package notes, guest credentials, quality-approver identity and payment-provider IDs are excluded. Nested billing/manufacturing/file/quote/payment/status records are projected explicitly, so newly added internal fields do not automatically cross the customer boundary. Original server records remain intact for admin and transaction workflows.

The projection is applied to customer quote list/detail/checkout, order list/detail/help, shipped orders, RFQ continuation/reorder, dashboard and notification surfaces. Submission and idempotent retry JSON return only `{ request: { id } }`; draft archive uses the same receipt. `customer-request-draft.ts` projects legacy shared-draft envelopes, requests and form state on reads and writes. Unusable nested legacy records are excluded with recovery IDs while their stored rows remain intact. All existing role/company/file authorization remains enforced separately.

Customer quote prices and versions, original CAD/drawing references, manufacturing requirements/revisions, billing, PO reference, payment totals/card display, refund amounts, tracking and quality-document download references are preserved. Supplier identity/document names/free-text updates retain neutral customer labels. The legacy `internalNotes` field carries an explicitly customer-facing request-info/no-quote message only for NEEDS_INFO/CLOSED; other review notes are excluded.

Regression evidence uses a synthetic two-part request containing populated supplier prices, nested supplier notes, attachment paths, provider IDs and a private canary on every nested object. Route tests inspect the complete element props and JSON for both Customer Admin and Member, including foreign-company denial, submission retry, archive and legacy draft read/write. Separate rendering checks exercise the actual customer list/detail/checkout/order components with the reduced contract. Existing admin supplier/pricing and document-access regressions remain part of the full suite.

Final verification: 778 tests pass across 140 files, with the existing opt-in PostgreSQL audit skipped; 54 customer-access checks pass. TypeScript, full ESLint, the optimized production build and diff whitespace checks pass. The local production build runs with migration/bootstrap flags explicitly disabled. No database schema, customer workflow records, external providers or hosted deployment are changed by this repair.

Remaining release gate: deploy the reviewed source and inspect genuine authenticated hosted HTML, RSC navigation responses and JSON as Customer Admin and Member with synthetic populated internal records. Confirm internal markers are absent, customer/quality downloads still work and authorized admin supplier detail remains available. This local repair does not certify the currently deployed application.
