# Project Context

This file is durable project memory for AI agents working on Lattice OS from multiple computers. Keep it concise and current.

## Product

Lattice OS is an owned-code manufacturing RFQ and procurement workflow platform.

The app is being rebuilt from a Bubble prototype into a local Next.js application. The Bubble prototype is a product and UI reference, not an implementation source to copy directly.

Core users:

- Buyers submit RFQs with CAD files, materials, quantities, due dates, and notes.
- Lattice operators review incoming RFQs, identify missing information, and prepare supplier outreach.
- Suppliers and downstream order workflows are future phases.
- Admin/customer management surfaces support internal operations.

## Current App State

The current working vertical slice:

1. Buyer creates a request.
2. Buyer starts with a CAD file upload; customer and manufacturing configuration fields are revealed after a file is attached, a mock part image and optional technical drawing upload are shown, and the request form can start an Autodesk Platform Services preview translation when APS credentials are configured.
3. Request form submits through the Next.js API layer.
4. Request is validated/transformed by local business logic.
5. Prisma persists the request to PostgreSQL.
6. Submitted requests appear in the internal operator queue.
7. Buyer quote rows at `/quotes` open a consistent quote detail template at `/quotes/[requestId]` with pricing, lead time, line-item requirements, files, supplier quote basis, activity, and purchase conversion.

Important routes:

- `/` - public invite-only landing page with Log in and waiting list entry points.
- `/login` - public invite-only login page that hands demo users into the workspace.
- `/waiting-list` - public waiting list request page that writes local waitlist entries for admin review, blocks exact duplicate emails with an on-page notice, emails same-domain requesters with the existing waitlist contact, and triggers a thank-you email for new entries.
- `/dashboard` - command center/dashboard.
- `/requests/new` - buyer RFQ/request creation.
- `/operator/requests` - internal operator queue.
- `/operator/requests/[requestId]` - operator request detail/review.
- `/quotes` and `/quotes/[requestId]` - buyer quote/RFQ tracking.
- `/orders` and `/orders/[requestId]` - buyer order tracking and detail.
- `/supplier/orders` and `/supplier/orders/[requestId]` - supplier-facing order views.
- `/admin` - critical quote request overview dashboard for active RFQ intake, blocked requests, supplier outreach, overdue items, and buyer decision follow-up.
- `/admin/customers` and `/admin/customers/[companyId]` - customer management, including a waiting list viewer.
- `/admin/quotes` - admin quote management.
- `/admin/quotes/builder` - internal customer quote builder for typing line-item pricing and downloading a customer-ready Markdown quote file.
- `/admin/orders` - admin order management.
- `/materials` - material catalog.
- `/capabilities` - fabrication capabilities.
- `/analytics` and `/projects` - placeholder/future modules.

Important folders:

- `src/app/` - Next.js App Router pages, nested routes, and API routes.
- `src/components/` - reusable UI components.
- `src/lib/` - business logic, typed data, persistence, and repository code.
- `prisma/` - database schema.
- `docs/` - product research, Bubble audit notes, and implementation plans.
- `public/equipment/` - manufacturing/equipment imagery.

## Stack

- Next.js App Router 16.2.6.
- React 19.2.4.
- TypeScript.
- Tailwind CSS 4.
- Prisma 7 with PostgreSQL.
- Vitest and Testing Library.
- Docker Compose for local Postgres and MinIO/S3-compatible storage placeholders.

Important: this repo uses a newer Next.js with breaking changes. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.

## Product Direction

The UI should move toward a light B2B operations console:

- persistent left sidebar
- clear RFQ/order/dashboard navigation
- neutral light background
- dense but readable operational lists/tables
- restrained accents
- manufacturing-specific fields and language
- admin surfaces should feel visually distinct from the customer app, using `#FFD3AC` as the primary peach palette

Avoid making the app feel like a generic startup landing page. Lattice is an operational tool for RFQs, procurement, manufacturing partners, quotes, and orders.

The public website entry point is intentionally minimal and invite-only. The landing page should keep the visible choices constrained to logging in or joining the waiting list.

The Bubble reference worth preserving:

- app shell/sidebar information architecture
- `Request Quote` as a primary action
- dashboard metrics, customer notification inbox, and activity lists
- upload-first RFQ flow
- materials and fabrication capabilities as resource catalogs

The Bubble reference worth improving:

- remove placeholder/debug text
- replace generic users/transactions with manufacturing RFQ/order data
- separate buyer, operator, supplier, and admin workflows more clearly
- make statuses and next actions explicit

## Key Files To Know

- `src/components/app-shell.tsx` - shared shell/navigation.
- `src/components/request-form.tsx` - buyer RFQ form.
- `src/components/cad-upload-preview.tsx` and `src/components/autodesk-model-viewer.tsx` - upload-time CAD preview and Autodesk Viewer integration.
- `src/components/operator-queue.tsx` - operator request queue.
- `src/components/operator-request-detail.tsx` - internal request review.
- `src/components/buyer-quotes.tsx` and `src/components/buyer-quote-detail.tsx` - buyer quote views.
- `src/components/buyer-orders.tsx` and `src/components/buyer-order-detail.tsx` - buyer order views.
- `src/components/supplier-orders.tsx` and `src/components/supplier-order-detail.tsx` - supplier order views.
- `src/components/admin-*.tsx` - admin operation surfaces, including the quote-request overview dashboard.
- `src/components/customer-quote-builder.tsx` and `src/lib/quote-file.ts` - quote builder UI and customer-facing quote file generation.
- `src/lib/request-model.ts` - core request types, statuses, and transitions.
- `src/lib/request-persistence.ts` - app/database mapping.
- `src/lib/request-repository.ts` - database operations.
- `src/lib/autodesk-platform-services.ts` - APS authentication, OSS upload, Model Derivative translation, and viewer token helpers.
- `src/lib/request-queue.ts` - operator queue filtering/sorting.
- `src/lib/catalog-data.ts` - materials/capabilities data.
- `src/lib/customer-profiles.ts` - demo/customer profile data.
- `src/lib/waiting-list.ts` - local JSON-backed waiting list request store and duplicate/same-domain detection for early admin review.
- `src/lib/waiting-list-email.ts` - waiting list thank-you and same-domain contact email composition and delivery; uses Resend when configured and a local outbox otherwise.
- `prisma/schema.prisma` - database model.

## Verification

Use the smallest verification set that matches the change risk. For meaningful workflow changes, prefer:

```bash
npm test
npm run lint
npm run build
```

For database schema changes:

```bash
npm run prisma:generate
npm run db:push
```

For UI changes, start the app and browser-check the changed route(s).

## Updating This File

Update this file when:

- the app's purpose or user roles change
- a major route/workflow is added or removed
- the architecture changes
- important files move
- the working vertical slice changes
