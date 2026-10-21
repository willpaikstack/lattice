# Lattice OS

Production update (2026-10-21): main `1a3f348` is deployed at latticeos.co with customer payload isolation, the existing material catalog/RFQ updates and revised invitation guide. Combined verification passes 803 tests, 54 customer-access checks, TypeScript, lint and production builds; live anonymous smoke checks pass. Genuine authenticated customer journey checks remain separate. See `docs/completed-work-log.md`.

> Material update (October 19): the single material dropdown includes exact tempers/conditions, with the separate Condition selector removed. The exact S31803 and S32205 duplex rows are hidden from RFQ browse/search while the broader dual-certified 2205 offering remains; both specific grades stay on the Materials page. `1018S` resolves to the `1018 Steel` offering while its supplier designation is retained. Generic grades without temper choices, such as 7050, remain available. Composition completion adds 83 summaries (45 metal chemistry, 38 resin/coating constituents); 26 unresolved choices explicitly need a specification. Shared UNS references remain 102. Sources and limitations: [composition audit](docs/audits/material-composition-completion-2026-10-19.md). These updates are being prepared on `codex/materials-catalog-handoff` for a Vercel Preview deployment; Production is unchanged. Earlier test counts describe preceding implementation.


## Current cross-device handoff — October 19, 2026

The latest source and agent documentation are synchronized on `codex/materials-catalog-handoff` in `https://github.com/willpaikstack/lattice`. Start with [the cross-device handoff](docs/cross-device-handoff-2026-10-19.md), which records the branch, setup, completed work, verification and remaining checks. The material catalog now supplies consistent highlights/directories, a quote or sourcing action for every published grade/condition, and separate RFQ Material/Condition controls with exact-temper search. Latest automated verification: 758 passed, one opt-in database audit skipped; TypeScript and ESLint pass. These newer material changes are not deployed to Production. The previously released workflow baseline is GitHub main `cb90b13` (PR #1); older status notes below are historical.

P1 repairs released (2026-10-14): six confirmed findings F4–F7/R1–R2 are verified and deployed as `dpl_LKRxRX56KSzo6DE1vZmomPPFqezZ` (application commits `a96a704`/`e3d8d39`). RFQ validation rejects incomplete packages; malformed drafts recover or remain quarantined; quality uploads use private direct storage up to 25 MB; vendor edits persist in Postgres; Stripe Test provider delivery works without browser return. All 576 tests, 48 customer-access checks, typecheck, lint and local/hosted builds pass; runtime audit has zero advisories. Five unpatched development-only glob advisory entries remain documented. Live checkout stays disabled; P2 and operational rollout gates remain open. See [P1 repair and verification](docs/audits/p1-remediation-2026-10-14.md).

P0 patch released (2026-10-13): application commit `db347a6` fixes normal upload completion, administrative data exposure and CAD model isolation. All 557 tests pass; hosted Preview retests verified normal large/small CAD/PDF uploads, original hashes, role/company boundaries and real APS resource-scoped tokens. Production build `dpl_EmQHJHnZtE1ohen8tAMbuyagnTek` was promoted to latticeos.co and anonymous smoke checks pass. October 14 native browser retests also pass: large/small CAD and PDF uploads, saved two-part solid CAD rendering, draft reload/restore, normal RFQ submission and byte-identical original downloads; foreign-company model access remains denied. Live checkout stays disabled; the later P1 release above supersedes its P1 gates. P2 and operational gates remain open. See [P0 remediation and retest](docs/audits/p0-remediation-2026-10-13.md) and the [original readiness inventory](docs/audits/hosted-readiness-2026-10-13.md).

Prior Production release (2026-10-13, superseded by the P0 patch above): application commit `71b21df` is deployed as `dpl_31kujdnkXEq4S3nwWfkmQ4CaX8ZT` to `https://latticeos.co`. Both manufacturing JSONB columns are verified in Production. The private R2 bucket allows PUT/GET/HEAD from the three exact Production app origins; unrelated-origin preflight is denied. All 529 tests, typecheck, lint and local/remote builds pass. Large-file browser/APS and authenticated customer transaction checks remain follow-up work.

Owned-code manufacturing RFQ, procurement, and supplier-network workflow platform.

Lattice OS is being built as a machine-shop-focused network platform, similar in spirit to Xometry, Fictiv, Hubs, or Protolabs. Domestic shops can use it to route overflow or out-of-capability work to vetted overseas manufacturing partners, especially when they would otherwise no-quote because of capacity, machine, material, or labor constraints.

## Current vertical slice

- Buyer creates a manufacturable request.
- Buyer adds one or more CAD-backed line items.
- Buyer adds file references for each uploaded part and optional drawings.
- Buyer submits the request.
- Request appears in the admin quote submissions workflow.

This slice now persists submitted requests through the Next.js API layer into PostgreSQL via Prisma. Browser `localStorage` was removed from the active request handoff path.

## Current progress and handoff (2026-10-08)

- Admin customer management has a Companies/Waiting list directory and company profiles with Overview, Users, and RFQs & orders tabs.
- Admin quote review uses an Active/Drafts/Archive queue and an inline quote workbench for RFQ review and quote preparation.
- Customer invitations include the approved one-page “How Lattice works” guide as an email attachment. The delivery copy is `public/email/lattice-invitation-overview.pdf`; the editable PDF and builder are `output/pdf/lattice-invitation-overview.pdf` and `scripts/build-lattice-invitation-one-pager.py`.
- The guide describes Lattice's overflow-work value proposition, four-step customer workflow, and qualified-network statistics. The invitation attachment is wired into Resend delivery, but a controlled end-to-end invitation and attachment receipt check remains outstanding. No live invitation was sent as part of this documentation handoff.

Read `PROJECT_CONTEXT.md` for architecture and current state, `TODO.md` for the next actions, `docs/app-feature-map.md` for route-level behavior, and `docs/first-customer-onboarding-playbook.md` for the first-customer process. Recent work is recorded in `docs/completed-work-log.md`.

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

For provisioned-account sign-in on a new computer, configure the existing Lattice Clerk Development instance and separate development database in gitignored `.env.local`: `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`. Restart the development server after setting these values. Workspace access requires both the Clerk identity and the provisioned database membership; a temporary keyless Clerk instance cannot reproduce existing account access.

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

RFQ files upload directly to the private R2/S3 bucket in remote-storage mode; the CAD preview then streams the saved file to Autodesk. Before deploying this path, configure the bucket's browser CORS rule as described in that guide. Local development retains filesystem uploads.

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


Customer audit follow-through (2026-10-08): decisions and local changes are in `docs/audits/customer-decisions-implementation-2026-10-08.md`; checkout has a separate review in `docs/audits/customer-checkout-2026-10-08.md`. The additive schema is reviewable in `scripts/customer-audit-schema-2026-10-08.sql`. Development and Production are reconciled; release `dpl_B2YnUGqkNVau3QQBBBgkMj3yjk73` is deployed to latticeos.co. Stripe plugin now identifies the active Nexus account, with NY Tax registration configured. Hosted tax-aware checkout is prepared; deployed runtime key/signature verification and sandbox payment validation remain required before enabling checkout.
