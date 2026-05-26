# Decisions

Durable project decisions for Lattice OS. Add new entries at the top.

## 2026-05-26 - Use Autodesk Platform Services For Native CAD Preview

Decision: use Autodesk Platform Services Model Derivative plus Viewer SDK for browser-based previews of uploaded manufacturing CAD files.

Reason: supported RFQ formats such as STEP, IGES, SLDPRT, SAT, Parasolid, and Inventor parts are not reliably renderable directly in the browser without translation. APS can translate CAD files into SVF/SVF2 for web viewing and metadata extraction.

Implications:

- Keep Autodesk credentials server-side in `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, and `APS_BUCKET_KEY`.
- Upload preview files through a backend route before loading them in the browser viewer.
- Buyer upload UX should show translation progress and a configuration-needed state when APS is not configured locally.
- Later persistence work should store original file object references and translated model URNs with uploaded files.

## 2026-05-26 - Public Entry Is Invite-Only

Decision: make `/` the public Lattice landing page and keep it invite-only with only two visible entry points: Log in and Join waiting list.

Reason: the platform should feel private and controlled while the product is early, rather than presenting a broad marketing site or open signup path.

Implications:

- The internal command center lives at `/dashboard`.
- The app shell should not wrap the public landing page.
- Customer workspace navigation should treat `/dashboard` as home.

## 2026-05-26 - Repo Files Are The Shared Agent Memory

Decision: use versioned repo files as the shared memory layer across William's work and home computers.

Reason: local AI chat history does not reliably sync across machines or tools. GitHub does sync project files.

Implications:

- `PROJECT_CONTEXT.md`, `DECISIONS.md`, and `TODO.md` should be kept current.
- Agents should read these files before making meaningful changes.
- Important decisions from chat should be summarized here before the work is considered fully handed off.

## 2026-05-26 - Keep Next.js Docs Check In Agent Instructions

Decision: agents must read relevant Next.js docs from `node_modules/next/dist/docs/` before writing Next.js code.

Reason: this repo uses Next.js 16.2.6, and the project instructions warn that APIs, conventions, and file structure may differ from older assumptions.

Implications:

- Do not rely only on model memory for Next.js behavior.
- Check local docs before changing routing, layouts, server actions, metadata, caching, or other Next.js APIs.

## 2026-05-24 - Bubble Is A Product Reference, Not The Implementation

Decision: use the Bubble prototype to preserve product intent and information architecture, but rebuild cleanly in owned code.

Reason: the Bubble prototype captures useful UX direction but includes placeholders, debug text, and unfinished pages.

Implications:

- Keep useful structures like sidebar navigation, RFQ upload-first flow, materials catalog, capabilities page, dashboard cards, and quote/order modules.
- Improve labels, data quality, role separation, and operational clarity.
- Do not copy Bubble implementation constraints.

## 2026-05-24 - Product UI Direction Is Light B2B Operations Console

Decision: Lattice OS should feel like a light, professional B2B operations app.

Reason: manufacturing RFQ/procurement work benefits from clarity, dense information, and repeatable workflows.

Implications:

- Prefer light backgrounds, neutral borders, readable lists/tables, and restrained accents.
- Avoid decorative startup/marketing styling on app surfaces.
- Make status, ownership, due dates, process, material, quantity, files, and next actions easy to scan.

## 2026-05-24 - PostgreSQL Is The Source Of Truth For Requests

Decision: submitted requests should persist through the API and Prisma/PostgreSQL, not browser-only storage.

Reason: RFQs are durable business records and must survive browser/session changes.

Implications:

- The active request handoff path should not depend on `localStorage`.
- Request persistence belongs in `src/lib/request-repository.ts`, `src/lib/request-persistence.ts`, and `prisma/schema.prisma`.
- Workflow tests should cover validation, persistence mapping, and queue behavior.
