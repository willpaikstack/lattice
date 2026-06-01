# TODO

Shared next-actions list for AI agents across computers. Keep this focused on the next useful work, not every possible idea.

## Next Priorities

- Tomorrow handoff after pulling latest:
  - run `npm install` if dependencies changed
  - start local services with `docker compose up -d postgres minio`
  - run `npm run prisma:generate` and `npm run db:push`
  - run `npm test`, `npm run lint`, and preferably `npm run build`
  - open `/`, `/login`, `/requests/new`, `/quotes`, `/quotes/demo_quoted`, `/orders`, and `/orders/demo_purchased`
  - visually check the public Figma AI pages, request-form dropdowns, quote table/detail, quote checkout, and order detail/help/reorder flows
- Move `/waiting-list` entries, duplicate detection, and local waitlist email outbox records into the chosen durable CRM/database/email workflow.
- Connect `/login` to the chosen authentication provider when auth is selected; it currently hands demo users into `/dashboard`.
- Verify the current app end-to-end after pulling on any new computer:
  - install dependencies if needed
  - start local Postgres/MinIO with Docker Compose
  - run Prisma generation and database push
  - run tests, lint, and build
  - open the key routes in a browser
- Keep improving the RFQ lifecycle:
  - buyer submits RFQ
  - operator reviews RFQ
  - operator marks missing info or ready for supplier RFQ
  - operator saves a durable customer quote version
  - buyer and operator views stay in sync
- Run `npm run db:push` on a machine with local PostgreSQL available so the new `CustomerQuoteVersion` table is applied.
- Connect the buyer dashboard inbox to persisted RFQ, order, document, and buyer-action events. `/notifications` now derives quote-ready and missing-info rows from request state with static fallback data.
- Configure Autodesk Platform Services for live CAD previews:
  - create APS app credentials
  - set `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, and globally unique `APS_BUCKET_KEY`
  - smoke test upload translation and Autodesk Viewer rendering from `/requests/new`
  - keep tuning the initial viewer camera/framing across native CAD files
  - persist original file object IDs and translated model URNs with uploaded file records
- Add real generated thumbnails or APS-derived preview images anywhere static CAD thumbnails are still useful outside the interactive upload preview.
- Continue clarifying buyer `/quotes` and admin `/admin/quotes` role separation now that quote issuance is database-backed and admin-owned.
- Connect the `/admin` quote request overview more deeply to durable quote versions and supplier quote records.
- Connect `/admin/vendors` to durable supplier/vendor records, including contacts, capability documents, quality history, payment terms, and quote/order performance.
- Decide whether to keep or retire `/operator/requests/[requestId]` after more RFQ detail review lives in the `/admin/quotes` command drawer.
- Continue turning demo/static quote, order, supplier, and customer surfaces into durable database-backed workflows as needed.
- Reuse material/capability catalog data in RFQ form dropdowns where it helps buyers submit cleaner requests.
- Build admin/operator source-trace views for material and equipment repositories so each standardized customer-facing claim can be audited back to vendor, document, and extraction notes.
- Continue deduplicating vendor-provided material/equipment entries across Zintilon, Saky Steel, ZYTC, Best Prototypes, and future vendor documents.
- Add the original source files for previously entered Zintilon processing and sheet metal capability data into `docs/vendor-sources/` when available; the registry currently records placeholders for those older sources.
- Add or update tests whenever request status, persistence, queue filtering, or role-specific views change.

## Cross-Computer Handoff Checklist

Before ending a substantial session:

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
npm test
npm run lint
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
- `/admin`
- `/admin/customers`
- `/admin/vendors`
- `/materials`
- `/capabilities`
