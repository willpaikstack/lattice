# Lattice OS

Owned-code manufacturing RFQ and procurement workflow platform.

## Current vertical slice

- Buyer creates a manufacturable request.
- Buyer adds one line item.
- Buyer adds one file reference.
- Buyer submits the request.
- Request appears in the internal operator queue.

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
- Operator Queue: <http://localhost:3000/operator/requests>

## Verification

```bash
npm test
npm run lint
npm run build
```

## Shared agent context

This repo carries lightweight project memory so AI agents on different computers can pick up the same context:

- `PROJECT_CONTEXT.md` - product, architecture, routes, and current state.
- `DECISIONS.md` - durable technical and product decisions.
- `TODO.md` - next priorities and cross-computer handoff checklist.
- `AGENTS.md` - instructions agents should read before changing the repo.

Keep these files updated before committing/pushing meaningful work.
