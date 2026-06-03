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
- Quote Submissions: <http://localhost:3000/admin/quotes>

## Verification

```bash
npm test
npm run lint
npm run build
```

## CAD preview setup

Live CAD translation previews require Autodesk Platform Services credentials in `.env.local` or the deployed environment:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `APS_BUCKET_KEY`

See `docs/autodesk-aps-cad-preview.md` for setup, bucket naming, and secret-rotation guidance.

After setting the variables and restarting the server, visit `/api/cad-previews/configuration` to verify that the server can authenticate with Autodesk without exposing any secrets.

## Real RFQ data

The quote workflow is now commissioned for real submitted RFQs. Avoid seeding artificial RFQ records into the quote database or local fallback store. Use `.data/requests.json` only as the local development fallback when Prisma/Postgres is unavailable, and keep real customer/vendor CAD files out of Git.

## Shared agent context

This repo carries lightweight project memory so AI agents on different computers can pick up the same context:

- `PROJECT_CONTEXT.md` - product, architecture, routes, and current state.
- `DECISIONS.md` - durable technical and product decisions.
- `TODO.md` - next priorities and cross-computer handoff checklist.
- `AGENTS.md` - instructions agents should read before changing the repo.

Keep these files updated before committing/pushing meaningful work.
