# TODO

Shared next-actions list for AI agents across computers. Keep this focused on the next useful work, not every possible idea.

## Next Priorities

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
  - buyer and operator views stay in sync
- Connect the buyer dashboard inbox to persisted RFQ, order, document, and buyer-action events when the notification/event model is introduced.
- Configure Autodesk Platform Services for live CAD previews:
  - create APS app credentials
  - set `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, and globally unique `APS_BUCKET_KEY`
  - smoke test upload translation and Autodesk Viewer rendering from `/requests/new`
  - persist original file object IDs and translated model URNs with uploaded file records
- Replace the temporary `/requests/new` mock part image with real generated thumbnails or APS-derived previews when the CAD preview pipeline is fully configured.
- Continue clarifying buyer `/quotes` and operator `/operator/requests` role separation as quote issuance becomes database-backed.
- Connect the `/admin` quote request overview to durable quote versions and supplier quote records when those workflows move beyond demo/static request data.
- Extend `/admin/quotes/builder` so generated customer quotes can be loaded from an RFQ, saved as durable quote versions, and exported as PDF when the quote lifecycle is ready.
- Continue turning demo/static quote, order, supplier, and customer surfaces into durable database-backed workflows as needed.
- Reuse material/capability catalog data in RFQ form dropdowns where it helps buyers submit cleaner requests.
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
- `/operator/requests`
- `/quotes`
- `/orders`
- `/orders/[requestId]`
- `/supplier/orders`
- `/admin`
- `/admin/customers`
- `/materials`
- `/capabilities`
