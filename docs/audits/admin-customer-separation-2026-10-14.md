# Admin/customer separation review — October 14, 2026

Complete administrative-data isolation is not yet established. This is a source review and focused local test rerun, not a new authenticated Production payload test.

Existing controls: admin pages check role before private queries; handlers/actions enforce roles; customer requests/files are company-scoped; supplier quote attachment bytes are admin-only. The October 13 P0 report records deployed admin-page guards and hosted negative tests.

Remaining high-priority exposure:

- `src/app/(workspace)/quotes/page.tsx` passes full company-owned requests from `listBuyerQuotes` to the client component `BuyerQuotes`. The repository includes internal supplier quotes/attachments without redaction.
- `src/app/(workspace)/orders/page.tsx` passes `customerSafeRequest` results to client component `BuyerOrders`. That helper spreads the original request and supplier quotes, retaining supplier costs, structured line-item supplier notes/pricing and supplier quote attachment metadata. It redacts selected names/text rather than enforcing an approved customer field list.

These fields cross the browser boundary even if no visible control renders them. Actual exposure depends on populated internal records. Supplier attachment byte authorization remains a separate admin-only control in the reviewed policy.

Verification: seven focused suites / 45 tests pass (admin page authorization, partner privacy, request access, route authorization, direct URL ownership, file access and CAD access). Current privacy tests cover selected names/free text, not absence of all internal fields. No application code or deployment changed.

Next: define an explicit customer payload contract; apply it to every customer client component/API response, including submission retry responses; add regression tests with supplier names/costs/nested notes/attachment markers; inspect authenticated hosted HTML/React payloads as Customer Admin and Customer Member before certifying separation.
