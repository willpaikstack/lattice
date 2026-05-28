# Decisions

Durable project decisions for Lattice OS. Add new entries at the top.

## 2026-05-27 - Keep Buyer RFQ Intake Upload-First

Decision: keep `/requests/new` as an upload-first RFQ flow where the detailed quote configuration stays locked until a CAD file is attached.

Reason: the Bubble prototype's request quote page reveals additional configuration after file upload, which makes the first step obvious and keeps buyers from facing a long form before anchoring the request to a part file.

Implications:

- Customer details, material, tolerance, finish, quantity, and documentation fields should appear after file selection/drop.
- Empty-state copy should guide buyers to upload a CAD/drawing file first.
- Post-upload UI should show a part mockup, pre-configured manufacturability parameters, and an optional technical drawing upload.
- Future multi-file support should preserve this progressive disclosure pattern.

## 2026-05-27 - Treat Customer Dashboard Inbox As Notification Center

Decision: make the buyer `/dashboard` inbox a customer-facing notification center for order changes, RFQ status updates, uploaded quality documents, and buyer action items.

Reason: the inbox should help end customers understand what changed and what needs attention, rather than remaining an empty Bubble placeholder or generic activity feed.

Implications:

- Keep inbox language buyer-facing and manufacturing-specific.
- Route notification rows to the relevant quote or order area until durable notification detail pages exist.
- Later work should connect these notifications to persisted RFQ/order/document events instead of static dashboard data.

## 2026-05-27 - Give Admin A Peach Visual Identity

Decision: make the admin experience visually distinct from the customer app by using `#FFD3AC` as the primary peach palette for admin shell, navigation, and dashboard surfaces.

Reason: admin workflows should feel like a separate internal control space while staying inside the same Lattice OS product.

Implications:

- Keep customer-facing app surfaces on the neutral/light operations palette.
- Apply peach admin styling at the shared shell level so `/admin` and operator/admin routes inherit the internal identity.
- Use darker warm neutrals for admin text and controls to preserve readability against the peach palette.

## 2026-05-27 - Keep Admin Overview Focused On Quote Request Control

Decision: make `/admin` a concise dashboard for the most critical active quote-request signals instead of a broad cross-admin activity summary.

Reason: the first admin overview should help operators quickly see which quote requests need assignment, missing-info recovery, supplier outreach, overdue attention, or buyer decision follow-up.

Implications:

- Keep `/admin` centered on active quote requests: submitted, needs info, supplier-ready, and quoted.
- Use `/admin/quotes`, `/admin/customers`, and `/admin/orders` for deeper management surfaces instead of crowding the overview.
- Prioritize operational risk, due dates, owner assignment, supplier quote progress, and open quoted value in the overview metrics.

## 2026-05-27 - Make Buyer Quote Rows Open A Standard Detail Template

Decision: make each row in `/quotes` navigate directly to `/quotes/[requestId]`, and use that route as the standard buyer-facing quote detail template.

Reason: buyers should be able to click a specific quote and land on a consistent page with the extra detail needed to review pricing, manufacturing requirements, files, supplier basis, activity, and purchase conversion.

Implications:

- Keep row navigation link-based so quote detail pages are shareable and browser-native.
- Keep granular customer-facing quote detail formatting centralized in `src/components/buyer-quote-detail.tsx`.
- Later durable quote-version work should feed the same template rather than introducing a competing buyer quote layout.

## 2026-05-26 - Start Customer Quote Issuance With A Local Markdown Builder

Decision: add an internal admin quote builder at `/admin/quotes/builder` that captures quote header fields, line-item pricing, files reviewed, lead time, assumptions, and open questions, then downloads a customer-ready Markdown quote file.

Reason: Lattice needs a usable quote issuance workflow before the full database-backed quote lifecycle is built. Markdown keeps the generated artifact simple to inspect, copy, email, or convert to PDF.

Implications:

- Keep quote file formatting in `src/lib/quote-file.ts` so it can later feed PDF generation or persisted quote records.
- Treat the builder as an operator/admin tool, not a buyer-facing quote acceptance surface.
- Later work should connect quote generation to saved RFQs, supplier quotes, and durable quote versions.

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
