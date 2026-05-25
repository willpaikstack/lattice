# Bubble Emulation Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Rebuild the useful visible Bubble prototype surfaces in the local owned-code Lattice app, starting with real routes and resource/RFQ pages.

**Architecture:** Keep the existing Next.js App Router application and `AppShell`. Convert Bubble page intent into typed React components, local data modules, and route pages. Use local/static data for catalogs first; connect RFQ submission to the existing request model/persistence where available.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Vitest/Testing Library for logic and component behavior.

---

## Source reference

Read first:

- `docs/bubble-page-audit.md`
- `docs/bubble-uiux-reference.md`
- `src/components/app-shell.tsx`
- `src/app/page.tsx`
- `src/components/request-form.tsx`

## Task 1: Replace sidebar hash links with real route targets

**Objective:** Make the Bubble sidebar information architecture navigable locally.

**Files:**

- Modify: `src/components/app-shell.tsx`

**Steps:**

1. Change sidebar hrefs:
   - Analytics: `/analytics`
   - Project Management: `/projects`
   - Our Quotes: `/quotes`
   - Our Orders: `/orders`
   - Materials: `/materials`
   - Capabilities: `/capabilities`
2. Keep `/requests/new` as the CTA.
3. Preserve current Bubble-like visual styling.
4. Run `npm run lint`.

**Verification:** Sidebar links route to non-hash paths. Lint passes.

## Task 2: Add placeholder route pages for incomplete Bubble modules

**Objective:** Preserve Bubble navigation continuity without overbuilding empty pages.

**Files:**

- Create: `src/app/analytics/page.tsx`
- Create: `src/app/projects/page.tsx`
- Create: `src/app/quotes/page.tsx`
- Create: `src/app/orders/page.tsx`

**Steps:**

1. Create simple pages using the app shell layout automatically inherited from `layout.tsx`.
2. For `/quotes`, use Bubble heading/subtitle:
   - `My Quotes`
   - `Track the status of your submitted RFQs`
3. For `/orders`, use Bubble heading/subtitle:
   - `MY ORDERS`
   - `Track the status of your purchases`
4. For `/analytics` and `/projects`, say the Bubble preview only exposed the shell and this local surface is pending real data.
5. Use realistic empty states and links back to `/requests/new` or `/operator/requests`.
6. Run `npm run lint`.

**Verification:** All routes load without 404 and visually use the shared shell.

## Task 3: Create typed material catalog data

**Objective:** Extract Bubble material catalog content into reusable local data.

**Files:**

- Create: `src/lib/catalog-data.ts`

**Steps:**

1. Export `materials` array with fields:
   - `slug`
   - `name`
   - `summary`
   - `details`
   - `commonGrades`
   - `standards`
2. Include Bubble categories:
   - Aluminum
   - Stainless steel
   - Mild steel
   - Brass
   - Copper
   - Alloy steel
   - Tool steel
   - Titanium
   - Inconel/Incoloy
3. Keep copy concise but faithful to `docs/bubble-page-audit.md`.
4. Add a simple unit test if catalog helpers are introduced.

**Verification:** TypeScript compiles and data can be imported by pages/components.

## Task 4: Build reusable accordion/card component for catalogs

**Objective:** Recreate Bubble material/capability accordion-card visual pattern.

**Files:**

- Create: `src/components/catalog-card.tsx`

**Steps:**

1. Build a client component if expand/collapse state is needed.
2. Props:
   - `title`
   - `summary`
   - `children` or `details`
   - optional `defaultOpen`
3. Style as wide white rounded cards with subtle border, muted text, and right-side chevron.
4. Keep keyboard-accessible button semantics.
5. Run `npm run lint`.

**Verification:** Component renders accessible buttons/cards and lint passes.

## Task 5: Build `/materials` from Bubble `materialscatalog_page`

**Objective:** Recreate the canonical Bubble material catalog locally.

**Files:**

- Create: `src/app/materials/page.tsx`
- Use: `src/lib/catalog-data.ts`
- Use: `src/components/catalog-card.tsx`

**Steps:**

1. Add large title `Material Catalog`.
2. Add Bubble-inspired intro copy about supplier partnerships, consolidated purchasing power, traceability, mill certs, and wholesale pricing without wholesale MOQs.
3. Render all material cards from typed data.
4. Add CTA link to `/requests/new`.
5. Run `npm run lint` and `npm run build`.

**Verification:** `/materials` visually resembles Bubble page but is cleaner and has no Bubble badge.

## Task 6: Create capability catalog data

**Objective:** Fill in Bubble's blank capability accordions with useful manufacturing categories.

**Files:**

- Modify: `src/lib/catalog-data.ts`

**Steps:**

1. Export `capabilities` array with fields similar to materials.
2. Include initial categories:
   - CNC milling: 3-axis, 4-axis, 5-axis
   - CNC turning / mill-turn
   - Precision inspection / CMM / FAI
   - Material traceability and certifications
   - Production scaling / supplier network
   - Optional future: sheet metal, welding/fabrication if William confirms scope
3. Keep the intro aligned with Bubble copy from `fabrication_capabilities`.
4. Run `npm run lint`.

**Verification:** Capability data imports cleanly.

## Task 7: Build `/capabilities` from Bubble `fabrication_capabilities`

**Objective:** Recreate the Bubble fabrication capabilities page locally with corrected spelling and real accordion labels.

**Files:**

- Create: `src/app/capabilities/page.tsx`
- Use: `src/lib/catalog-data.ts`
- Use: `src/components/catalog-card.tsx`

**Steps:**

1. Add large title `Fabrication Capabilities`.
2. Add intro card using Bubble copy, corrected for spelling and clarity.
3. Render capability cards from typed data.
4. Add CTA link to `/requests/new`.
5. Run `npm run lint` and `npm run build`.

**Verification:** `/capabilities` has visible card labels instead of Bubble's blank rows and matches the light operations style.

## Task 8: Update `/requests/new` to emulate Bubble's upload-first RFQ flow

**Objective:** Bring the existing local RFQ form closer to Bubble's visible request quote page while improving rough placeholders.

**Files:**

- Modify: `src/components/request-form.tsx`
- Maybe modify: `src/lib/request-model.ts`

**Steps:**

1. Ensure a prominent CAD upload/dropzone-style section appears near the top.
2. Include suggested file types:
   - STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT
3. Keep/introduce customer details fields:
   - Customer PO#
   - Company Name
   - Project Name
   - Notes / RFQ details
4. Remove any equivalent of Bubble debug labels like `HEADER`, repeated `Quote Number`, or `yes(No quote line items)`.
5. Keep existing domain fields that are better than Bubble:
   - process
   - material
   - quantity
   - due date
   - quality/documentation needs
6. Verify submit still creates a request in the local flow.
7. Run `npm test`, `npm run lint`, and `npm run build`.

**Verification:** Buyer can submit one RFQ and it appears in the local operator queue.

## Task 9: Browser verification pass

**Objective:** Prove the emulated Bubble surfaces actually render and navigate locally.

**Files:** none unless defects are found.

**Steps:**

1. Start dev server in tracked background process.
2. Visit:
   - `/`
   - `/requests/new`
   - `/materials`
   - `/capabilities`
   - `/quotes`
   - `/orders`
   - `/analytics`
   - `/projects`
3. Click sidebar links to confirm routing.
4. Submit a sample RFQ.
5. Confirm it appears in `/operator/requests`.
6. Run final `npm test`, `npm run lint`, `npm run build`.

**Verification:** Mechanical checks and browser checks both pass.
