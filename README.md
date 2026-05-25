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

- Command Center: <http://localhost:3000>
- New Request: <http://localhost:3000/requests/new>
- Operator Queue: <http://localhost:3000/operator/requests>

## Verification

```bash
npm test
npm run lint
npm run build
```
