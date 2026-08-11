# Lattice OS

Owned-code manufacturing RFQ, procurement, and supplier-network workflow platform.

Lattice OS is being built as a machine-shop-focused network platform, similar in spirit to Xometry, Fictiv, Hubs, or Protolabs. Domestic shops can use it to route overflow or out-of-capability work to vetted overseas manufacturing partners, especially when they would otherwise no-quote because of capacity, machine, material, or labor constraints.

## Current vertical slice

- Buyer creates a manufacturable request.
- Buyer adds one or more CAD-backed line items.
- Buyer adds file references for each uploaded part and optional drawings.
- Buyer submits the request.
- Request appears in the admin quote submissions workflow.

This slice now persists submitted requests through the Next.js API layer into PostgreSQL via Prisma. Browser `localStorage` was removed from the active request handoff path.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Vitest + Testing Library
- Prisma + PostgreSQL
- S3-compatible storage target via MinIO/S3 env placeholders
- Docker-ready deployment skeleton

## Local development

```bash
npm install
cp .env.example .env
docker compose up -d postgres minio
npm run prisma:generate
npm run db:push
npm run dev
```

Open:

- Landing Page: <http://localhost:3000>
- Log In: <http://localhost:3000/login>
- Waiting List: <http://localhost:3000/waiting-list>
- Command Center: <http://localhost:3000/dashboard>
- New Request: <http://localhost:3000/requests/new>
- Roadmap: <http://localhost:3000/roadmap>
- Quote Submissions: <http://localhost:3000/admin/quotes>

### Data modes

Local development defaults to mock mode so product and UI work can use demo RFQs/orders without touching the customer-safe fallback store.

```bash
npm run dev          # defaults to mock mode in development
npm run dev:mock     # explicit mock mode
npm run dev:customer # customer-safe mode on the same localhost URL
```

Set `LATTICE_DATA_MODE=customer` for customer-facing deployments. Production refuses `LATTICE_DATA_MODE=mock`. Mock fallback RFQs/orders are stored under `.data/mock/requests.json`; customer-safe fallback RFQs/orders remain under `.data/requests.json`.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run dead-code
npm run build
```

## CAD preview setup

Live CAD translation previews require Autodesk Platform Services credentials in `.env.local` or the deployed environment:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `APS_BUCKET_KEY`

See `docs/autodesk-aps-cad-preview.md` for setup, bucket naming, and secret-rotation guidance.

After setting the variables and restarting the server, visit `/api/cad-previews/configuration` to verify that the server can authenticate with Autodesk without exposing any secrets.

## Google Workspace SSO setup

Create a Google OAuth web client and add the local redirect URI:

- `http://localhost:3000/api/auth/google/callback`

Set these values in `.env.local`:

- `GOOGLE_SSO_CLIENT_ID`
- `GOOGLE_SSO_CLIENT_SECRET`
- `GOOGLE_SSO_ALLOWED_DOMAINS` (comma-separated Google Workspace domains)
- `GOOGLE_SSO_REDIRECT_URI`

For production, register the production callback URL and set the same variables in Vercel.

The host that starts Google sign-in must match the registered callback host. The local route automatically redirects `0.0.0.0:3000` starts to `localhost:3000` before setting its secure OAuth state cookie, so use `http://localhost:3000/login` as the local sign-in URL.

## Real RFQ data

The quote workflow is now commissioned for real submitted RFQs. Keep artificial RFQ records out of customer mode and `.data/requests.json`. Use `LATTICE_DATA_MODE=mock` and `.data/mock/requests.json` for isolated demo/product-development records, and keep real customer/vendor CAD files out of Git.

## Shared agent context

This repo carries lightweight project memory so AI agents on different computers can pick up the same context:

- `PROJECT_CONTEXT.md` - product, architecture, routes, and current state.
- `docs/app-feature-map.md` - operator-facing feature map of app areas, routes, data sources, status, and limitations.
- `docs/completed-work-log.md` - daily record of completed tasks, features, fixes, and documentation changes.
- `DECISIONS.md` - durable technical and product decisions.
- `TODO.md` - next priorities and cross-computer handoff checklist.
- `AGENTS.md` - instructions agents should read before changing the repo.

Keep these files updated before committing/pushing meaningful work.
