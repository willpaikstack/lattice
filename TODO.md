# TODO

Shared next-actions list for AI agents across computers. Keep this focused on the next useful work, not every possible idea.

## Next Priorities

- Replace the temporary landing-page `mailto:` waiting list action with the real waitlist capture flow when CRM/email storage is chosen.
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
- Make buyer `/quotes` and operator `/operator/requests` role separation clearer.
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
- `/requests/new`
- `/operator/requests`
- `/quotes`
- `/orders`
- `/supplier/orders`
- `/admin`
- `/admin/customers`
- `/materials`
- `/capabilities`
