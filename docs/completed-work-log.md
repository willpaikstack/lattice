# Completed Work Log

## 2026-08-18 — Guarded production Lattice Admin bootstrap

- Extended the existing Vercel-only Clerk migration runner with a one-time, explicitly enabled Lattice Admin bootstrap path.
- The path refuses to run outside Vercel, requires Clerk Production credentials, applies the Prisma schema after duplicate checks, creates the named `LATTICE_ADMIN` membership, and then creates or links the matching Clerk user.
- Normal builds skip both migration and bootstrap unless their explicit one-time environment flag is present.

Running daily record of meaningful Lattice OS tasks, features, fixes, and documentation work completed across computers.

Update this file at the end of a substantial work session. Keep entries concise, newest first, and focused on completed work. Open work, blockers, and next actions belong in `TODO.md`.

## 2026-08-18

- Implemented password recovery with hashed, single-use, one-hour `PasswordResetToken` records and durable `AuthAuditEvent` records. The generic forgot-password response now sends a reset link only for provisioned users, the reset route updates the salted password hash, consumes the token, writes an audit event, and invalidates prior signed sessions. Applied the schema locally; focused tests, typecheck, lint, build, and diff validation passed.
- Replaced the shared sidebar identity with the server session’s name and email, including per-user navigation-preference keys. Began account-settings isolation by keying persisted settings to the signed-in user, migrating the legacy Amogy settings into its new customer account, and returning blank settings for newly provisioned users instead of the Amogy fixture.
- Provisioned `william.paik@amogy.co` as the Customer Admin for the canonical Amogy customer company, separate from the sole Lattice Admin account. The Amogy membership is scoped to its two historical RFQs; no password was issued so it can be generated through the admin UI when needed.
- Consolidated the local test Amogy data into one canonical Amogy customer company. Reassigned its two historical customer-facing RFQs before deleting 12 obsolete duplicate Amogy/Amogy Manufacturing company records; verification confirms the canonical company now owns both RFQs.
- Added a Lattice Admin custom-password control beside each customer user. It replaces the credential with a newly salted hash and requires at least 12 characters; existing passwords remain unrecoverable by design.
- Turned `/admin/customers` into the company-grouped customer-user hub: Lattice Admin can add users, monitor membership and password-issued state, promote/demote Customer Admins and Members, reset a password to issue a one-time temporary credential, and remove users while preserving at least one Customer Admin per company. Removed the redundant Quote Submissions shortcut from the page header.
- Added salted per-user password credentials and provisioned-account authentication. Existing passwords are not readable or retained in plaintext; Google and password sign-in reject unprovisioned customer accounts, customer roles cannot reach `/admin`, and deleting a membership invalidates its server-side session.
- Verification: Prisma client generation, TypeScript, ESLint, focused customer-management/auth tests, and diff validation passed. Production still needs the current Prisma schema applied before the new credential fields can be used against the production database.
- Archived the received Jucheng Precision two-page equipment list and registered it in the internal vendor-source registry and manifest.
- Added 32 normalized records for its CNC/EDM, sheet-metal, manual, and inspection equipment to the customer equipment catalog. The browser now receives an opaque customer-equipment DTO rather than the internal dataset, so supplier/source identifiers, provenance URLs, and supplier-derived slugs cannot be recovered from the customer bundle.
- Verification: focused equipment catalog test, typecheck, JSON-manifest validation, and diff validation passed.
- Hardened `/account/settings` toward WCAG 2.2 AA: added a page-level heading, accessible profile-photo upload naming, keyboard-operable tabs and labelled panels, visible keyboard focus, and announced status/validation feedback.
- Moved browser-local account-settings restoration to a post-hydration effect so initial server and client renders remain deterministic; removed the previous mount-time default write.
- Verification: focused account-settings tests, TypeScript, and targeted lint passed.
- Removed the unused `catalog-card.tsx` implementation, moved the Vitest config to native ESM (`vitest.config.mts`) to eliminate its loader warning, and updated the dead-code entry list. The deprecated CDN redirect helper is already absent from application code; its remaining mention is historical QA documentation.
- Reconciled the `/how-it-works` capacity evidence and test expectations with the normalized equipment catalog: 335 total CNC machines, comprising 282 milling and 53 turning/turn-mill machines, with 109 explicitly listed as 5-axis; the documented inspection inventory totals 17 CMMs.
- Added SSR-to-client hydration regression coverage for browser-local RFQ drafts and buyer quote drafts. The tests render without browser storage, hydrate with populated localStorage, and fail on React hydration warnings while preserving the intended post-mount draft restoration. The retired `/simple-quote` route has no active component to cover.
- Verification: hydration regression suite plus the request-form and buyer-quote component suites passed (33 tests).

## Entry Format

```md
## YYYY-MM-DD

- Completed item, feature, fix, or documentation change.
- Verification: command or smoke test run, if applicable.
```

## 2026-08-17

- Added the `npm run test:auth-workflows` authenticated workflow suite. It exercises company-owned RFQ submission, PO checkout/order mutation, direct-URL/document authorization, and supplier-portal mutation denial using isolated mocks for external services.
- Retired the full account-free `/simple-quote` route family, guest token/email helpers, and guest Stripe checkout path; authenticated RFQ submission remains at `/requests/new`.
- Removed guest-link generation from admin quote issuance while preserving legacy request-origin fields for historical data compatibility.
- Hid the Finishing section from the customer equipment navigation while retaining its internal source-backed records.
- Hid source-backed Die Casting and Additive Manufacturing sections from the customer equipment navigation while retaining their internal catalog records for a later release.
- Reformatted expanded equipment-card accuracy fields as `Positional accuracy (X/Y/Z)`; single-value source tolerances now explicitly state that the documented figure is common across X/Y/Z rather than inventing separate axis values.
- Removed all Yijin-associated equipment cards and source mappings from the customer `/equipment` catalog; the original vendor PDF remains archived internally for potential future onboarding.
- Expanded `/equipment` to expose every documented equipment section, including Manual Machines, Finishing, EDM, Die Casting, and Additive Manufacturing.
- Normalized the audited Zintilon, Best Prototypes, Yijin Solution, and Best Parts source inventories into the customer-safe equipment dataset, including the previously omitted ZhiHeng tapping machine, vendor-specific machining capacity, and grouped inspection-tool coverage.
- Preserved original vendor-document provenance for every added record while keeping supplier identity and source-document labels out of the customer interface.

## 2026-08-08

- Populated the Stainless steel long-tail directory with researched machining profiles: free-machining grades show Good, conventional austenitic/martensitic/PH and specialty grades show Fair, and duplex grades show Difficult. Supporting references are retained from Carpenter Technology and Outokumpu machining literature; condition-sensitive selection guidance is included in expanded rows.
- Replaced the non-Aluminum long-tail directory's unsupported `Review` machinability placeholder with an explicit blank state while source-backed per-grade research and coverage tracking are built out.
- Standardized all material-family long-tail catalogs on the Aluminum directory template: shared collapsible group cards, grade rows, expanded selection detail, and condition/availability language now replace the old grade-chip layouts.
- Restyled the material-family RFQ action as a subdued outlined link with a directional arrow, retaining the direct Request Quote path without competing with the material content.
- Removed the Aluminum long-tail search and filter controls, leaving a simpler collapsible series directory beneath the Common grades reference layer.
- Reduced the visual weight of Common-grade property data: the five values now sit in a light, unboxed reference strip with a small source link and condition note, keeping material selection guidance primary.
- Verification: focused Materials detail/view-model tests, typecheck, lint, diff validation, and desktop browser overflow review passed.

## 2026-08-07

- Added source-linked, condition-specific reference-property strips to every curated Common grade across the twelve material-family guides. Each shows yield, tensile, elongation, hardness, and density and is explicitly framed as typical room-temperature reference data—not design allowables or certification.
- Replaced the Aluminum long-tail directory's generic designation/temper subtitle with a mapped UNS alloy number (for example, `UNS A96060`); records without a verified mapping are now explicitly marked pending verification.
- Replaced the Aluminum long-tail grade-chip catalog with the selected searchable series directory: working series/form/temper/machinability filters, collapsible series cards, compact grade rows, and a nested expanded-grade selection subcard.
- Added a Xometry-inspired five-column mechanical-properties table to the expanded subcard, removed the comparison and grade-level RFQ actions, and limited published values to exact checked grade/temper references with a not-for-design caveat and an explicit unverified state.
- Verification: focused directory/detail tests, typecheck, lint, desktop browser review, removal checks for both retired actions, and 390 x 844 responsive/table-overflow QA passed.
- Extended the Aluminum family-guide art direction to Stainless steel, Mild steel, Brass, Titanium, and Inconel/Incoloy with 25 purpose-generated images: one raw-stock/CNC hero and four application-specific common-grade photographs per family.
- Replaced generic featured-grade content for those five guides with family-specific UNS identifiers, forms, use cases, machinability guidance, and selection notes while retaining RFQ confirmation language for availability.
- Verification: six focused view-model/detail-page tests, typecheck, lint, five-family desktop browser capture, mobile Stainless steel QA, and runtime console review passed.

- Built the selected Option 1 material-family workflow: removed the card-level `View grades` action, made every family card navigate as one target, and added reusable `/materials/[slug]` guides with a hero, common-grade comparison, complete grouped catalog, and RFQ actions.
- Art-directed the Aluminum guide with five purpose-generated raw-stock and CNC-part images for the family hero and the 6061-T6, 7075-T6, 5052-H32, and 2024-T3 profiles.
- Verification: focused Materials tests, typecheck, lint, exact-viewport source comparison, card navigation, all-grades anchor behavior, and 390 x 844 responsive browser QA pass.

- Rebuilt `/materials` as the selected family-first material atlas: a responsive three-column card grid with exact unique grade counts, curated grade examples, generated material swatches, grade/family search, dedicated family guides, and direct listed/unlisted RFQ actions. Refined the desktop breakpoint, card density, and swatch width so every material card retains the original design's slim vertical side ribbon at the annotated viewport. Regenerated and pre-cropped the ribbon assets with stronger material-specific grain so horizontal brushing, diagonal machining, crosshatch, raw nickel-alloy mill grain, crystalline metal, and polymer facets survive browser downsampling.
- Replaced the Inconel/Incoloy ribbon's woven pattern with a solid raw nickel-alloy mill finish—longitudinal machining lines, subtle mottling, and no perforated-sheet appearance.
- Verification: focused materials-page tests, `npm run typecheck`, `npm run lint`, `git diff --check`, and Codex in-app browser design QA at 1536 x 1024 and 390 x 844 passed.
- Archived the original HAYNES 617 and HAYNES 625 alloy brochures received from Dominic at ZYTC, with provenance in the vendor-source registry and manifest. The files are material-reference evidence and are not treated as a current stock or availability commitment.
- Reorganized `docs/vendor-sources/` into vendor-specific subfolders and added archive instructions covering reusable-reference eligibility, naming, manifest/registry updates, source links, and validation. Verification: every manifest path resolves after the move.
- Archived reusable vendor reference documents from Outlook in `docs/vendor-sources/` and registered their provenance: Yijin equipment and ISO certificates, Best Parts equipment/inspection/material references, Jucheng's traceability procedure, and the Zintilon factory-profile package.
- Replaced the two Zintilon `not-yet-archived` source placeholders with their original processing-equipment and sheet-metal capability PDFs. Order-specific supplier quotes and inspection reports remain in workflow storage rather than the reference archive.
- Added `Inspection & Certificates` to the customer sidebar's `Your Resources` section, linking directly to the quality documentation guide with an inspection-document icon.
- Verification: `npm run typecheck` and `git diff --check` passed.
- Expanded the quality-documentation guide with output, method, and sampling detail: dimensional reports now explain the critical-dimension table and 100%/sampled inspection policy; CMM Inspection Report now references ZEISS CONTURA and ACCURA capacity; FAIR AS9102 and Custom Inspection now describe their respective methodologies and customer-defined scope.
- Renamed the customer-facing RFQ option from `CMM Inspection with Dimensional Report` to `CMM Inspection Report` to distinguish it cleanly from the standard dimensional-report choice.
- Redesigned `/quality-documentation` as a single, Notion-inspired documentation page with a restrained title block, inline reading flow, subtle section dividers, and a desktop contents rail; retained Lattice typography and color tokens.
- Updated the RFQ inspection/documentation selector: Standard Inspection is always included, source inspection and build-and-hold first article were removed, Custom Inspection now points buyers to Manufacturing notes, and a subtle info link opens the new `/quality-documentation` definitions page.
- Added plain-language definitions for dimensional reports, CMM inspection, FAIR AS9102, custom inspection, and MTRs in the app and the existing Notion Request Quote guide, including the distinction between a CMM method and a dimensional-report deliverable.
- Verification: 23 request-form tests passed and `npm run typecheck` passed.
- Added backdrop dismissal to the `/requests/new` technical-drawing review modal. Clicking the dimmed area now follows the same close-and-validate path as Done, while clicks inside the PDF/specification panel leave it open.
- Added focused regression coverage and verified both inside-click and backdrop-click behavior in the live request form. Verification: all 22 request-form tests, `npm run typecheck`, targeted lint, and `git diff --check` passed.
- Fixed the `/requests/new` technical-drawing modal so changing the general tolerance or drawing-required checkboxes no longer recreates the attached PDF's browser object URL and flashes/reloads the embedded viewer.
- Added regression coverage that holds the PDF preview URL stable through both tolerance and checkbox updates.
- Verification: focused request-form tests, `npm run typecheck`, targeted lint, and `git diff --check` passed; live in-app browser testing confirmed the PDF retained the same `blob:` URL while the selected tolerance and Engineering Fits state changed.

## 2026-08-06

- Reworked the customer quote detail Parts and pricing card into a quote-sheet-style line table with Part / File, Specifications, Qty, Unit price, Line total, Lead time, and subtotal, plus a stacked mobile fallback and contained horizontal scrolling for constrained desktop widths.
- Verification: `npm run typecheck`, `npm run lint`, `npm test -- src/components/operator-request-detail.test.tsx`, and Codex in-app browser visual QA on `/quotes/demo_quoted_brackets` passed, including a 1436px desktop overflow check.
- Aligned `/materials` material family cards to the same content width as the catalog intro copy.
- Verification: focused materials-page test and lint passed.
- Renamed the customer sidebar Roadmap resource link to `Lattice OS Roadmap`.
- Verification: focused app-shell test and lint passed.
- Added an Archive action to `/requests/new` draft continuation rows. Saved drafts now archive through a customer/admin-scoped API route with an optional reason prompt, while browser-local incomplete drafts are removed from local draft recovery.
- Verification: `npm test -- src/components/request-form.test.tsx`, `npm run typecheck`, `npm run lint`, and `git diff --check` passed.
- Refined the Notion/ChatGPT-style notification sidebar interaction so the Lattice sidebar header/ribbon stays stable and only the content below it changes into a newest-first chronological notification feed when the bell is active.
- Updated the bell panel to remove search/refresh controls, add Notion-style row dividers, group rows into This week, Last week, and Older, and show compact relative day labels for this-week notifications.
- Removed repeated per-row bell icons from the notification sidebar preview so each notification row is a cleaner text-and-timestamp item.
- Kept the notification sidebar preview open after notification-row navigation so users leave activity view explicitly by toggling the bell/close control.
- Added notification-sidebar exit behavior for clicking the Lattice home mark or anywhere in the main content area, while keeping notification-row navigation persistent.
- Verification: `npm test -- src/components/app-shell.test.tsx src/app/notifications/page.test.tsx src/lib/customer-notifications.test.ts`, `npm run typecheck`, `npm run lint`, and `git diff --check` passed.
- Replaced the active admin sidebar nav red inset stripe with a normal bordered selected state that preserves item spacing.
- Verification: `npm test -- src/components/app-shell.test.tsx` and `npm run lint -- src/components/app-shell.tsx` passed.
- Simplified dashboard KPI detail copy so active orders read as `X active orders` and shipped/in-transit work reads as `X orders in transit` based on `SHIPPED` supplier-order status.
- Added focused customer-dashboard summary assertions for the revised KPI copy.
- Verification: `npm test -- src/lib/customer-dashboard.test.ts` and `npm run typecheck` passed.
- Added a Notion-style customer notification sidebar preview: the global bell now swaps the left navigation into a newest-first notification feed on desktop and opens a mobile overlay with the latest derived notification rows and a `View all notifications` link.
- Added `/api/customer-notifications` so the app shell can lazy-load a customer/admin-scoped notification preview without moving the full `/notifications` page into the client shell.
- Updated notification/sidebar documentation in `docs/app-feature-map.md` and `docs/customer-inbox-notification-spec.md`.
- Verification: `npm test -- src/components/app-shell.test.tsx src/app/notifications/page.test.tsx src/lib/customer-notifications.test.ts`, `npm run typecheck`, and `npm run lint` passed.
- Updated the customer sidebar profile card so the card opens account settings, the account action popup closes on outside click, and the card has a stronger bordered treatment matching the workspace shortcut style.
- Added focused app-shell regression coverage for profile-card navigation and outside-click menu dismissal.
- Verification: `npm test -- src/components/app-shell.test.tsx` and `npm run typecheck` passed.
- Added environment-driven customer/mock data mode separation. Customer mode keeps `.data/requests.json` customer-safe and hides artificial `demo_`/`fixture_` RFQs; mock mode uses `.data/mock/requests.json` and can load demo RFQ/order fixtures for product and UI iteration.
- Added `src/lib/data-mode.ts`, mode-aware local request fallback loading, explicit `npm run dev:mock` and `npm run dev:customer` commands, and documentation for deployment/local toggling.
- Updated durable project memory in `README.md`, `PROJECT_CONTEXT.md`, `DECISIONS.md`, and `docs/app-feature-map.md`.
- Replaced the small mock RFQ set with a mature customer-account scenario covering a saved draft, clarification request, supplier-ready RFQ, expiring and long-lived quotes, active production, quality-document review, shipment tracking, supplier acknowledgment, and delivered history.
- Kept all records isolated behind mock data mode and aligned them to William's local customer session so the customer workspace can be inspected end to end.
- Verification: focused customer dashboard/action-center/repository tests, typecheck, and lint pass.
- Verification: focused data-mode/request-repository tests, `npm run typecheck`, `npm run lint`, and `git diff --check` passed.

## 2026-08-01

- Redesigned the customer `/requests/new` first screen around the selected upload-first concept: clear RFQ progress, autosave reassurance, a more focused CAD upload surface, and a draft continuation table that excludes submitted requests.
- Preserved the existing multi-file upload, CAD preview, local draft persistence, configuration, drawing validation, and submission behavior. Verification: all 19 request-form tests, TypeScript, targeted ESLint, desktop browser rendering, page-width checks, and visual source comparison passed; a pre-existing app-shell navigation hydration warning remains visible in local development.
- Replaced the customer dashboard Inbox with a workflow-based Action Center covering supplier clarification, quote review/expiration, overdue order milestones, and customer document review; each workflow now shows priority, owner, due context, progress, checklist steps, and a direct continuation action.
- Preserved informational updates through a separate Recent Updates dashboard preview and the full `/notifications` history, and added a global notification bell to customer desktop/mobile navigation without presenting derived attention state as unread state.
- Added focused workflow derivation, dashboard, notification-page, and app-shell coverage. Verification: type checking, lint, dead-code analysis, production build, `git diff --check`, and all 36 focused tests passed; the full suite passed 245 of 246 tests, with only the pre-existing date-sensitive admin activity assertion failing.
- Reworked customer quote detail around a clear status/next-step summary and responsive part-and-pricing rows that stack before columns become cramped; removed unused line-item selection controls and the duplicate disabled status action.
- Reworked customer order detail around one operational health panel for status, latest update, milestone ownership, overdue state, and tracking; consolidated customer invoice, reorder, and help actions into the summary rail while preserving admin-specific controls.
- Verification: 32 focused quote/order/admin tests and ESLint passed, `git diff --check` passed, and desktop/mobile browser checks confirmed quote and order detail pages have no horizontal page overflow.
- Redesigned the admin order-progress publisher into a compact lifecycle workflow with semantic status cues, suggested milestones and owners, conditional tracking, collapsible internal details, a live customer preview, and completion-aware validation.
- Verification: focused order-progress and admin-order tests, targeted ESLint, `git diff --check`, desktop/mobile browser checks, conditional shipped-state testing, and console-error review passed. Visual comparison evidence is recorded in `design-qa.md`.
- Added a shared, manually managed purchased-order lifecycle. Admins can publish status, Lattice owner, next milestone/date, responsible party, tracking number, and required customer-facing update from `/admin/orders/[requestId]`.
- Added explicit `Delivered` status, monotonic status-transition validation, persistent order-progress fields, audit actor metadata, local-fallback persistence, customer-visible milestone context, and automatic overdue-milestone alerts in dashboard/notifications/order views.
- Verification: `npm run prisma:generate`, `npm run db:push`, `npm run typecheck`, `npm run lint`, focused order/dashboard/notification tests, and `npm run build` passed. The full suite has one unrelated date-sensitive admin activity dashboard assertion that now expects a stale June queue label.
- Configured the first internal Lattice Google Workspace OAuth web client for local and production callback URLs.
- Added the Google Workspace SSO settings to the Lattice Vercel Production environment and redeployed `latticeos.co`; verified the live login route exposes Google Workspace sign-in and starts Google authorization with the production callback URI.
- Fixed local Google sign-in state validation when the development server is opened through `0.0.0.0:3000`; SSO now redirects to the registered callback host before setting its secure state cookie.
- Added route coverage for host normalization and OAuth state-cookie creation.
- Added a stable local development launcher at `npm run dev:local` that pins Lattice to `http://localhost:3000` while also listening on the local machine interface.
- Installed a macOS LaunchAgent at `~/Library/LaunchAgents/com.lattice.local-dev.plist` so the local dev server starts at login and is kept alive in the background on this computer.
- Rebuilt `/login` with optional configured Google Workspace SSO, preserved email/deep-link context, and added accessible errors, pending feedback, password visibility, Caps Lock feedback, official Google branding, and support paths.
- Simplified the login journey after review: work email and password now appear together on one screen, while configured Google Workspace SSO remains an optional alternative.
- Verification: targeted login and recovery tests, lint, type checking, `git diff --check`, and a fresh local browser check passed.
- Refined `/forgot-password` with a prefilled work-email handoff, pending feedback, non-enumerating reset confirmation, inbox/spam guidance, retry support, and a primary return-to-sign-in action.
- Verification: focused login/auth tests, `npm run typecheck`, `npm run lint`, `npm run dead-code`, `npm run build`, `git diff --check`, and desktop/mobile browser checks passed. The full suite passed 234 of 235 tests; the unrelated admin activity dashboard test remains date-sensitive and expects a June queue label that no longer applies on the current August date.
- Verification: `launchctl print gui/$(id -u)/com.lattice.local-dev`, `lsof -nP -iTCP:3000 -sTCP:LISTEN`, and `curl -I http://localhost:3000` confirmed the service is running and serving `200 OK`.
- Fixed the buyer quote-list delete flow for browser-only drafts: the UI now labels the action `Discard draft` and removes it locally without attempting to delete a non-existent server request. Saved RFQs continue to use the authorized server delete path, with an inline error for genuine failures.
- Verification: buyer-quote regression coverage, TypeScript, and lint passed; live Quotes page reload confirmed the failed draft had already been discarded locally.
- Reordered `/dashboard` so the KPI cards lead, the Action Center is the second row, and quote/order activity follows. Removed the redundant Recent Updates preview; `/notifications` remains the single notification-history destination.
- Implemented the approved minimal Action Center: one contextual summary sentence and compact rows that retain only a state marker, reference, concise status, and direct continuation action. Removed dashboard checklist, ownership, priority-badge, and duplicate-count noise.
- Made each compact Action Center row a full-width order/quote link, replacing the redundant `View order` button with a subtle directional affordance and keyboard-visible focus state.
- Fixed the date-sensitive admin activity dashboard test by supplying a fixed pre-due-date clock; the existing activity-summary test continues to cover overdue quote recovery separately.

## 2026-06-22

- Prepared the cross-computer handoff for the latest RFQ and quote UX work, including Hubs-style material metadata, the RFQ ISO 2768-1 tolerance popup, line-item deletion confirmation, CAD upload/viewer polish, buyer quote list pagination, and quote-detail status messaging.
- Documented that buyer quote-request modification is intentionally deferred for now, after removing the temporary modify route and related customer/admin surfaces.
- Verification: final pre-commit verification was run before committing and pushing this handoff.

## 2026-06-20

- Removed the temporary buyer quote-request modification workflow, including the `/quotes/[requestId]/modify` route, quote-detail modify links, request-form modify mode, legacy revise prefill handling, and admin `Modification requested` surfaces.
- Verification: `npx vitest run src/components/request-form.test.tsx src/components/operator-request-detail.test.tsx`, `npm run lint`, `npm run typecheck`, and `git diff --check` passed.
- Added a distinct `/quotes/[requestId]/modify` route for buyer quote modifications, updated quote-detail edit links to use it, and gave the request form a modification mode with `Update Quote Request` and `Cancel` actions while preserving revision change-log admin notifications.
- Verification: `npx vitest run src/components/request-form.test.tsx src/components/operator-request-detail.test.tsx`, `npm run lint`, `npm run typecheck`, `git diff --check`, and unauthenticated curl route protection checks passed.
- Added UNS numbers, detailed composition notes, and compact Hubs-style composition formulas to the CNC material library.
- Updated the RFQ material dropdown so selected and listed materials show compact `UNS ... | formula` metadata and material search matches UNS/composition fields.
- Verification: `npx vitest run src/lib/cnc-material-library.test.ts src/components/request-form.test.tsx`, focused `npx eslint`, and `npm run typecheck` passed.
- Added a Hubs-style `ISO 2768-1 standards` tolerance reference link and modal table to the RFQ request form.
- Verification: `npx vitest run src/components/request-form.test.tsx` and focused `npx eslint` passed.
- Resized the RFQ `ISO 2768-1 standards` modal to match the compact Protolabs Network/Hubs popup observed in Chrome via Computer Use.
- Verification: `npx vitest run src/components/request-form.test.tsx`, focused `npx eslint`, and `npm run typecheck` passed.
- Added a right-aligned delete button to configured RFQ line-item headers, moved the visible remove action out of the expanded body controls, and added a Hubs-style `Remove from quote` confirmation modal before deletion.
- Verification: `npx vitest run src/components/request-form.test.tsx`, focused `npx eslint`, and `npm run typecheck` passed.
- Increased contrast for the disabled buyer quote-detail review CTA so pending RFQs keep the grey disabled button while the status text remains legible.
- Verification: `npx vitest run src/components/operator-request-detail.test.tsx`, focused `npx eslint`, and `npm run typecheck` passed.
- Updated submitted RFQ quote-detail messaging to explain that Lattice is gathering supplier-network feedback to prepare accurate pricing and lead time.
- Verification: `npx vitest run src/components/operator-request-detail.test.tsx`, focused `npx eslint`, and `npm run typecheck` passed.
- Restored the pending quote-detail sidebar CTA copy to `Lattice is checking the RFQ package before supplier outreach.` while keeping the updated main status message.
- Verification: `npx vitest run src/components/operator-request-detail.test.tsx`, focused `npx eslint`, and `npm run typecheck` passed.
- Replaced the buyer quote-detail upload-style revision link with `Modify quote request` and surfaced revised RFQ submissions in admin quote management as `Modification requested` with the first revision change-log line as a summary.
- Verification: `npx vitest run src/components/operator-request-detail.test.tsx`, focused `npx eslint`, and `npm run typecheck` passed.

## 2026-06-19

- Improved the RFQ quality-documentation multi-select so clicking the field shell opens the dropdown while selected document pills keep their own remove/no-open behavior.
- Verification: `npm test -- src/components/request-form.test.tsx`, `npm run lint`, and `git diff --check` passed.
- Fixed the RFQ surface-finish color selector so the selected color row border follows the rounded list container instead of being clipped at the corners.
- Verification: `npm test -- src/components/request-form.test.tsx`, `npm run lint`, and `git diff --check` passed.
- Updated the buyer `/quotes` tables to sort each section by most recently edited and paginate quote rows three at a time with Previous/Next controls.
- Removed the request-form resume panel helper sentence while preserving the resume table and actions.
- Verification: `npm test -- src/components/buyer-quotes.test.tsx src/components/request-form.test.tsx`, `npm run typecheck`, `npm run lint`, and `git diff --check` passed.

## 2026-06-18

- Added Hubs-aligned secondary surface finish controls to the RFQ request form, including cosmetic requirement choices, anodized/hardcoat/chromate color options, and powder coat RAL/Pantone custom entries; selected finish details now persist through local drafts and submitted RFQ line items.
- Removed stale buyer quote-list footer helper copy after the in-app footer text cleanup.
- Verification: `npm test -- src/components/request-form.test.tsx src/components/buyer-quotes.test.tsx`, `npm run typecheck`, `npm run lint`, and `git diff --check` passed.
- Tightened customer direct-URL ownership from interim email/domain matching to exact requester email only for quote/order lists, quote detail, checkout, order detail, order help, quote PDFs, invoice PDFs, checkout server actions, quote deletion, and submitted-file downloads.
- Added regression coverage for wrong-owner customer quote, checkout, order, invoice PDF, and checkout server-action access; unauthorized customer direct URLs now terminate before rendering PDFs, creating Stripe checkout state, recording payment state, saving PO files, or purchasing the quote.
- Updated project memory and QC documentation to record exact-requester-email v1 ownership, admin support access, and durable company membership as the future target.
- Added interim customer ownership checks for customer quote/order lists, detail pages, checkout, quote/invoice PDFs, revise/reorder prefill, checkout server actions, quote deletion, and local submitted-file downloads.
- Documented the interim permissions model: exact requester email matches are allowed, admins retain support access, and durable company/customer ID membership remains the target.
- Closed the confirmed customer privacy gaps from the live QC run: customer-role direct URLs now require matching requester email, and local submitted-file downloads are scoped to the owning RFQ/document context.
- Verification: `npm test` passed with 51 files and 214 tests, `npm run typecheck` passed, `npm run lint` passed, and `git diff --check` passed.
- Ran live local fixture QC with generated STEP/STP/PDF files against RFQ submission, file validation, admin quote review page load, supplier quote attachment upload, invoice PDF routes, and role redirects; 24 checks passed and 2 data-privacy probes failed.
- Confirmed privacy gaps before the fix: `/api/local-files/[storageKey]` was session-only rather than document/owner scoped, and customer quote detail pages allowed cross-company direct URL access.
- Verification before the fix: `npm test` passed with 50 files and 206 tests, `npm run typecheck` passed, and `npm run lint` passed after the manual QC run.
- Added a local manual CAD fixture pack under `fixtures/manual-testing/cad/` with mock STEP/STP files, duplicate basename folders, an edge-case filename, a zero-byte STEP file, and a mock drawing PDF for RFQ upload and drawing-required manual testing.
- Researched external CAD sample sources for real geometry viewer checks, with NIST, Xometry, and FreeCAD source links recorded in the fixture README.
- Added `docs/qc-testing-plan.md` covering RFQ submission, uploads/drawings, admin quote review, supplier quote entry, quote approval, PO/invoice generation, order tracking, email notifications, and role permissions.
- Added QC regression tests for request API authorization/upload edge cases, route authorization, local file-storage path safety, guest quote email copy, and PO/Stripe RFQ-to-order repository behavior.
- Updated the dashboard summary test expectations for the current `No quote` customer-facing lifecycle copy.
- Verification: focused QC tests passed, `npm run typecheck` passed, `npm run lint` passed, `npm test` passed with 50 files and 206 tests, and `git diff --check` passed.
- Added admin RFQ response outcomes for `Request information` and `No quote`; both require a customer-facing operator note and reuse the existing `NEEDS_INFO` and `CLOSED` request statuses without a schema migration.
- Updated buyer quote detail, dashboard Inbox, and notifications so request-info and no-quote outcomes surface the operator note through the same derived RFQ activity feed.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx src/lib/customer-notifications.test.ts src/app/notifications/page.test.tsx src/app/dashboard/page.test.tsx src/app/admin/quotes/actions.test.ts`, `npm run lint`, `git diff --check`, and browser smokes for `/admin/quotes?requestId=...`, `/dashboard`, `/notifications`, and `/quotes/[requestId]` passed.
- Added repeatable cleanup tooling with `npm run typecheck`, `npm run dead-code`, and `knip.json`; removed direct unused dependency declarations for `zod`, `pg`, and `@types/pg`.
- Removed runtime-dead RFQ/browser store code, obsolete quote actions, unused preview/template helpers, stale public exports, and tracked local Next dev logs.
- Retired the legacy operator request detail UI so `/operator/requests/[requestId]` redirects to `/admin/quotes?requestId=...`, and moved admin customer/vendor links to admin-native quote/order routes.
- Verification: `npm run typecheck`, `npm run lint`, `npm test`, `npm run dead-code`, `npm run build`, `git diff --check`, and authenticated route probes for `/requests/new`, `/admin/quotes?requestId=...`, `/dashboard`, `/notifications`, `/admin/customers`, `/admin/vendors`, and `/operator/requests/[requestId]` passed; `/quotes/[requestId]/checkout` returned 404 only because no local quoted request exists for checkout smoke data.
- Added Jucheng Precision (JC Proto) and Best Prototypes to the admin Overseas Vendors directory from public/vendor source information.
- Updated the app feature map and added vendor-directory regression coverage for the new overseas vendor seeds.
- Verification: `npm test -- src/lib/admin-vendors.test.ts`, `npm run lint`, `git diff --check`, and `/admin/vendors` browser smoke passed.
- Removed the top KPI card strip from `/admin/quotes` so Quote Submissions goes directly from the page header into drafts and submission review.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx`, `npm run lint`, `git diff --check`, and `/admin/quotes` browser smoke passed.
- Removed the `1. Intake`, `2. Supplier basis`, and `3. Issue quote` chips from the `/admin/quotes` header.
- Verification: `npm run lint`, `git diff --check`, and `/admin/quotes` browser smoke passed.
- Tightened the admin quote drawer pricing table so `Uploaded files` and `Qty` sit closer together.
- Verification: `npm run lint`, `git diff --check`, and `/admin/quotes?requestId=cmqil4boj00012mvmuhgxqqtm` browser spacing smoke passed; lint still reports the existing unused-export warnings in `invoice-pdf.ts` and `quote-xlsx.ts`.
- Replaced the admin RFQ response drawer's dashed header metadata line with labeled Quote, Customer, Process, Package, Quantity, and Files fields.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx`, `npm run lint`, and `git diff --check` passed.
- Reduced the admin RFQ response drawer pricing table gap between `Part` and `Specs`.
- Verification: `npm run lint`, `git diff --check`, and `/admin/quotes?requestId=cmqil4boj00012mvmuhgxqqtm` browser spacing smoke passed.
- Removed the `Files` chip from the admin RFQ response drawer header summary.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx`, `npm run lint`, `git diff --check`, and `/admin/quotes?requestId=cmqil4boj00012mvmuhgxqqtm` browser smoke passed.
- Removed the `Package` chip from the admin RFQ response drawer header summary.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx`, `npm run lint`, `git diff --check`, and `/admin/quotes?requestId=cmqil4boj00012mvmuhgxqqtm` browser smoke passed.
- Removed the `Quantity` chip from the admin RFQ response drawer header summary.
- Verification: `npm test -- src/components/operator-request-detail.test.tsx`, `npm run lint`, `git diff --check`, and `/admin/quotes?requestId=cmqil4boj00012mvmuhgxqqtm` browser smoke passed.

## 2026-06-17

- Added a customer `/roadmap` page where buyers can review upcoming Lattice product/service capabilities and flag which ones they are interested in.
- Added server-side roadmap interest persistence through a new `RoadmapInterest` Prisma model with `.data/roadmap-interests.json` development fallback.
- Added customer navigation, route protection, guarded server action, and focused tests for the Roadmap page interaction.
- Added `docs/completed-work-log.md` as the shared daily record of completed Lattice OS work.
- Linked the completed-work log from the shared memory and handoff docs so future agents keep it updated across machines.
- Added `docs/app-feature-map.md` as the operator-facing feature map for routes, app areas, data sources, status, limitations, and maintenance rules.
- Added `docs/customer-inbox-notification-spec.md` as the editable working spec for customer Inbox and notification taxonomy decisions.
- Updated RFQ status notifications so the dashboard Inbox shows high-signal customer updates such as `RFQ submitted` and action-required quote review rows while keeping audit-style rows such as `Draft created` and `Quote closed` in the full notification history.
- Reclassified quote-issued rows under RFQ Progress as `Quote ready for review`, refreshed RFQ notification copy, and added dashboard/notification tests for the high-signal Inbox split.
- Removed photo-upload rows from the customer notification taxonomy, consolidated tracking availability into the `Order shipped` notification, and added a V1 order-detail package tracking link backed by the supplier tracking number.
- Truncated customer-facing order progress notifications to `Order placed`, `In Production`, and `Inspection In Progress`, while suppressing ready-to-ship, acknowledgment, and generic supplier-movement rows from customer notifications.
- Moved quote-ready notifications under RFQ Progress as `Quote ready for review`, removed `Supplier pricing started` from customer notifications, and documented what `Documents need review` means for quality/compliance uploads.
- Removed the right-side dashboard Orders/contact card so the dashboard focuses on KPIs, Inbox, and the main activity table.
- Replaced the dashboard `Quote activity` card with `Quote and Order Activity`, limited to customer quote-received events and customer order-placed events with direct quote/order links.
- Removed the `View Quotes` shortcut from the top of the customer Orders page header, leaving `Request Quote` as the only header action.
- Removed the remaining `Request Quote` shortcut from the top of the customer Orders page header.
- Updated CAD preview UX so Autodesk translation is presented as background processing, RFQ work can continue while translation runs, and the embedded Autodesk viewer exposes native controls plus top-level fit/full-screen shortcuts.
- Renamed the RFQ line-item CAD replacement action from `Replace` to `Replace Part`.
- Added RFQ CAD viewer toolbar shortcuts for Autodesk Measure, Explode, Section, Model Tree, and Properties extensions.
- Reworked the RFQ CAD viewer controls to use Autodesk native toolbar buttons instead of custom overlay buttons.
- Fixed Autodesk native toolbar attachment timing and visibility in the RFQ CAD preview card.
- Removed the duplicate Lattice-added CAD toolbar group so only Autodesk's native viewer toolbar controls remain visible.
- Trimmed the RFQ CAD preview toolbar to Autodesk's native Measure and Explode Model controls only.
- Added Autodesk's native Section Analysis control back to the focused RFQ CAD preview toolbar.
- Fixed the Section Analysis toolbar behavior by preserving Autodesk's native X/Y/Z plane and box section submenu controls.
- Added drawing-required behavior to dimensional/FAIR-style RFQ quality documentation options, including dropdown labeling, drawing-modal enforcement, submit validation, and generated RFQ notes.
- Removed the top-level `Supplier quote notes` field from the admin RFQ response drawer so customer-facing quote notes stay centralized in `Customer note`.
- Changed Section 2 of the admin RFQ response drawer so `Shop name` is selected from the saved Overseas Vendors directory instead of typed as free text.
- Removed the manual `Supplier quote total` field from Section 2; selected supplier quote totals now derive from supplier line-item costs plus shipping cost.
- Defaulted the admin customer-quote `Shipping speed` selector to `International` for new quote issuance.
- Removed the `Drawing / revision` column from Section 2 of the admin RFQ response drawer.
- Removed the Section 2 supplier line-item notes column so quote notes stay centralized in the customer note field.
- Removed the Section 2 `Supplier contact` field so supplier contact details stay in the uploaded supplier quote file.
- Changed the Section 2 `Country` field to a dropdown with `China`, `Vietnam`, and `India`, defaulting to `China`.
- Changed the Section 2 `Overall lead time days` field to a calculated read-only value from the longest supplier line lead time plus shipping duration.
- Retired the standalone admin Overview page from the sidebar; `/admin` now redirects to `/admin/quotes`, and Quote Submissions is the admin home.
- Removed the duplicate Section 2 supplier line-item pricing/lead-time table; Section 3 is now the single source for line-item unit prices, lead times, supplier quote totals, and calculated overall lead time.
- Changed Section 4 of the admin RFQ response drawer to a single-column Issue customer quote layout.
- Moved selected supplier shop, country, and calculated lead-time fields into Section 1 of the admin RFQ response drawer and removed the standalone Section 2.
- Verification: `npm test`, `npm run lint`, focused dashboard/notification tests, route smoke checks for `/dashboard` and `/notifications`, and `git diff --check` passed.
- Audited local Codex thread history and git milestones, then backfilled this timeline with completed work from prior Lattice OS sessions.

## 2026-06-16

- Reworked `/dashboard` and `/notifications` around derived customer activity from existing RFQ, quote, order, supplier update, shipping, tracking, and supplier document records.
- Added or consolidated the customer dashboard/notification helpers so dashboard metrics, Inbox rows, quote activity, and notification rows share existing request/order data without introducing a new activity/read-state table.
- Added buyer-facing lifecycle labels for quote rows, including `Draft`, `Quote Requested`, `Quote Received`, `In Production`, `Shipping`, `Delivered`, and `Archived`.
- Repaired the dashboard implementation after overlapping agent work left duplicate helper paths and temporary immutable file flags.
- Removed the unused `quoteMutedColor` lint warning from `src/lib/quote-pdf.ts`.
- Verification recorded in Codex thread audit: `npm test`, `npm run lint`, and `npm run build` passed during the dashboard stabilization pass.

## 2026-06-15

- Added direct server-side role guards for sensitive document routes, internal resource downloads, Autodesk CAD preview APIs, and role-specific mutation server actions.
- Added the public account-free `/simple-quote` lane for guest CAD-backed RFQs, tokenized quote review, quote PDF access, and card-only payment.
- Replaced the fake saved-card checkout path with Stripe inline card-only PaymentIntent checkout through Stripe-managed card fields.
- Added structured selected supplier quote data so order-specific supplier purchase order PDFs can render from supplier-side costs and line details instead of customer prices or unstructured attachments.
- Persisted buyer checkout payment choice on purchased orders, including purchase-order number, AP email, buyer notes, and customer PO attachment metadata for PO checkout.
- Ran a security-focused app audit covering tests/build, dependency audit, route probes, role boundaries, file access, Server Action authorization, upload limits, rate limiting, security headers, and guest quote token handling.
- Published the broad app/security update to GitHub as commit `2d5b376` with message `Add simple quote checkout and access hardening`.
- Verification recorded in Codex thread audit: `npm run prisma:generate`, `npm run db:push`, `npm test`, `npm run lint`, `npm run build`, local route smoke checks, and unauthenticated access probes.

## 2026-06-12

- Implemented supplier quote PDF viewer popup in the admin RFQ response drawer.
- Added `?preview=1` support to `/api/local-files/...` so PDFs can render inline while normal download behavior remains unchanged.
- Updated supplier quote attachment UI so PDF filenames open an inline viewer modal with close, title, iframe preview, and separate Download action.
- Updated project memory to note that supplier quote PDFs are previewable inline.
- Verification recorded in Codex thread audit: focused operator request detail tests passed and `npm run lint` passed with the then-existing `quoteMutedColor` warning.

## 2026-06-10

- Defined the expanded buyer-facing quote lifecycle vocabulary: `Draft`, `Quote Requested`, `Quote Received`, `In Production`, `Shipping`, `Delivered`, and `Archived`.
- Updated quote surfaces to avoid untagged submitted/internal-review rows and to reserve `Delivered` for a future durable delivery confirmation trigger.

## 2026-06-09

- Made customer RFQ intake batch-part friendly: drag/drop or multi-select CAD upload now treats each CAD file as a separate configurable line item.
- Updated the buyer material picker to use broad customer-facing material families modeled after Hubs/Protolabs Network-style groupings.
- Added draft storage behavior so selected CAD/drawing upload references are retained earlier in the RFQ flow when local draft upload storage is available.
- Removed the redundant `Explore Model` overlay button from the Autodesk CAD viewer while keeping the embedded model interactive.
- Verification recorded in Codex thread audit: focused request-form tests passed, `npm run lint` passed, and browser checks confirmed the removed viewer control.

## 2026-06-08

- Isolated customer, admin, and supplier app spaces with role-aware sessions and route protection.
- Added role-based navigation behavior: admins land in `/admin`, customers in `/dashboard`, suppliers in `/supplier/orders`, and admin support sessions can deliberately bridge to the customer workspace.
- Added server/session helpers for role derivation and route protection, including Google Workspace SSO support alongside the interim local credential gate.
- Added admin-native order/customer/vendor/resource routes and reduced accidental admin links into buyer-facing quote/order/RFQ routes.
- Added invoice PDF routes for purchased orders across buyer, admin, and supplier app spaces.
- Added order archive behavior through `Request.isArchived` without changing `status: PURCHASED`.
- Added editable admin vendor detail surfaces with local override persistence.
- Removed the customer quote `Files reviewed` card from buyer quote detail after browser review.
- Verification recorded in project/git history: large `6/8 update` committed as `1c71c0e`.

## 2026-06-06

- Promoted draft-backed RFQ uploads from `rfq-drafts/...` into permanent `rfq/...` storage on submission.
- Continued customer workflow polish around RFQ draft recovery and upload-time CAD preview behavior.
- Matched Hubs-style drawing bucket polish in the request form and increased the compact quote-name line to 24px after browser review.
- Documented practical database inspection workflow with Prisma Studio as the record editor/debugging tool, with schema changes still owned by `prisma/schema.prisma`.
- Verification recorded in Codex thread audit: focused request-form tests passed, `npm run lint` passed with existing warnings, and browser computed style confirmed the 24px quote-name line.

## 2026-06-05

- Attached received supplier quote files to RFQs and orders through `SupplierQuoteAttachment`, local supplier-quote upload storage, and admin quote/order detail surfaces.
- Added editable buyer company default through account settings and persisted `AccountDefaults.companyName`.
- Added purchased-order-only invoice PDF rendering for buyer, admin, and supplier order routes.
- Retired DOC-001 from admin resources so DOC-004 became the active customer quote reference.
- Added Google Workspace SSO to the existing session gate while retaining the interim local password fallback.

## 2026-06-04

- Froze DOC-004 customer quote PDF template as Rev 1.
- Expanded account defaults and RFQ snapshots so quote PDFs can use durable requester, buyer company, contact, and ship-to data instead of browser-only settings.
- Added quote dates, validity, shipping fields, customer notes, and quote revision/persistence plumbing across admin quote issuance and customer quote rendering.
- Added or updated admin resource template previews and route support for quote, invoice, and supplier purchase-order templates.
- Verification recorded in git history: `quote updates` committed as `2fb0634`.

## 2026-06-03

- Added local RFQ file storage under `.data/uploads` and persisted uploaded CAD/drawing `storageKey` metadata with RFQ records.
- Added customer quote PDF download/preview routes for buyer and admin quote views.
- Added request-specific Excel quote workbook export at `/admin/quotes/[requestId]/quote-template.xlsx`.
- Added admin resource-library document routes and backing template/resource files.
- Removed artificial seeded RFQs from the commissioned quote workflow and kept local fallback storage focused on real submitted RFQ records.
- Added customer profile icon/detail improvements and admin/customer quote management refinements.
- Verification recorded in git history: commits `c9398a2` and `d521488`.

## 2026-06-02

- Set up the production launch baseline: Vercel project, production domain, Vercel fallback alias, GitHub deployment connection, Neon Postgres project/database, and production env var wiring.
- Added Vercel Web Analytics instrumentation and `.vercelignore` protection for local env files.
- Added Autodesk Platform Services CAD preview setup documentation and configuration endpoint support.
- Added Google/SSO-related env placeholders, logout/password-reset/public-entry refinements, and production/local waiting-list persistence/email fallback improvements.
- Added brand/logo iteration assets for sidebar and signature exploration.
- Verification recorded in git history: production setup committed as `1382667`; earlier downloadable quote PDF work committed as `8951418`.

## 2026-06-01

- Added downloadable customer quote PDFs from buyer quote detail.
- Added quote-file and quote-PDF helpers plus tests for customer-facing quote artifact generation.
- Uploaded the app online and added Vercel deployment hygiene, brand/logo iteration assets, and waiting-list/email persistence updates.
- Verification recorded in git history: commits `8951418` and `f034a83`.

## 2026-08-01

- Fixed a customer Action Center gap where purchased orders without a confirmed supplier milestone date were omitted from attention workflows.
- Added a distinct milestone-confirmation workflow with owner, next-step context, progress checklist, and order-detail continuation action; redesigned it as a neutral `Lattice monitoring` state with compact rows, calmer copy, and an outlined continuation action.
- Renamed the dashboard section to `Action Center` and changed its summary metric to distinguish customer actions from order updates Lattice is monitoring.
- Verification: focused Action Center tests, typecheck, lint, production build, and diff validation pass. The full suite has one unrelated existing admin-activity label assertion failure.

## 2026-05-31

- Expanded the app shell and authenticated customer workspace toward the current operations-console shape.
- Added account settings workspace, notification center, shipped orders, admin vendors, equipment/material/vendor source repositories, and source-document metadata.
- Added public/vendor source documents under `docs/vendor-sources/` and design-export prompt packages for equipment, quotes, and quote detail redesign work.
- Added buyer quote checkout and order help routes, richer buyer order/quote detail surfaces, and request-form dropdown redesign research/assets.
- Redesigned public landing/login/request-quote surfaces with Figma AI reference captures and introduced `custom-select` for improved RFQ dropdowns.
- Verification recorded in git history: commits `fdcf839`, `24672e3`, and `f48f8ca`.

## 2026-05-28

- Added manufacturing and interface icon/visual asset work for the app.
- Continued equipment, capability, and visual-system polish from earlier operational dashboard work.
- Verification recorded in git history: commits `b679f56` and `af92e54`.

## 2026-05-27

- Built invite-only access surfaces with login, waiting list, and public entry behavior.
- Added operational RFQ dashboards across buyer/admin areas, including customer/order/quote management refinements.
- Added waiting-list local persistence and email/local-outbox helpers.
- Added first pass of buyer orders, order detail, quote detail, and expanded RFQ form/operator review tests.
- Verification recorded in git history: commit `6c9b344`.

## 2026-05-26

- Added the customer quote builder workflow, quote Markdown/file helpers, and customer quote template documentation.
- Continued RFQ process updates and app-shell navigation adjustments.
- Added manufacturing photos and visual refresh assets.
- Verification recorded in git history: commits `fdd4b98`, `96f3f61`, `6ac6d80`, `b19dfc2`, and `8ce43fb`.

## 2026-05-25

- Built the owned Lattice app foundation from the Bubble prototype reference.
- Added the Next.js App Router app shell, RFQ creation route, operator request queue/detail, buyer quotes/orders, catalogs, placeholder analytics/projects, and API persistence skeleton.
- Added Prisma schema, Docker/Postgres development setup, request model/persistence/repository helpers, catalog data, RFQ option data, and initial Vitest coverage.
- Added Bubble audit/reference documentation and the initial Bubble emulation build plan.
- Verification recorded in git history: commit `92dd2f2`.

Initial backfill note: this log was created on 2026-06-17. Entries before then were reconstructed from local Codex thread summaries, `DECISIONS.md`, `PROJECT_CONTEXT.md`, and git history, so older daily history is selective rather than exhaustive.

## 2026-08-07 — Completed remaining material-family photography

- Extended the approved Aluminum family-guide visual system to Copper, Alloy steel, Tool steel, Precision alloys, Magnesium / zinc alloys, and Plastics / polymers.
- Added 30 built-in ImageGen assets: one art-directed hero and four application-specific grade images for each of the six remaining families.
- Added dedicated common-grade profiles, selection notes, machinability guidance, and cautious specification-review language for designations that do not map cleanly to UNS identifiers.
- Fixed duplicate React keys in grouped long-tail grade lists discovered during browser QA.
- Verification: 12 focused tests pass, typecheck passes, lint passes, production build passes, desktop browser checks pass for all six routes, mobile QA passes at 390 × 844, every displayed image reports a nonzero natural size, and the clean QA tab has no console warnings or errors.

## 2026-08-08 — Audited the customer Equipment reference page

- Captured and reviewed the desktop equipment catalog, QC and inspection inventory, an expanded ZEISS CMM record, and the 390 × 844 mobile layout.
- Audited the 83-record equipment dataset for source concentration, field completeness, record-type consistency, claim strength, and customer trust risks.
- Documented prioritized UX, equipment-data, provenance, precision-language, responsive, and accessibility recommendations under `docs/audits/equipment-page-2026-08-08/`.
- Added a deterministic Figma-import package with a 4096 × 1620 overview board and four 2048 × 2800 audit-card PNGs; visually verified all five exports for sequence, legibility, and cropping.

## 2026-08-08 — Added traceable long-tail mechanical-property coverage

- Added canonical, condition-specific mechanical-property records and alias resolution for Stainless, Mild, Alloy, and Tool steels; Titanium; and Inconel / Incoloy directory rows.
- Normalized the expanded directory table to yield, tensile, elongation, hardness, and density so it uses the same property vocabulary as the common-grade cards.
- Added a visible source link and condition label for every populated record; unsupported exact labels retain blank values instead of a generic or invented value.
- Added `docs/material-mechanical-property-sources.md` with source hierarchy, coverage counts, and the explicit held-blank backlog.
- Added condition-aware Mild steel machinability ratings for mapped carbon and structural grades, retaining blanks for coated and otherwise unsourced trade labels.
- Extended sourced machinability ratings across every material family, surfaced the per-rating source in expanded grade detail, and added a complete 379/418 coverage report with the 39 intentionally unresolved labels.
- Added a condition-specific EN AW-6060 T6 extruded-product reference record after catalog review, using its source minimum values rather than an unstated generic temper.
- Added a live 214-label mechanical-property coverage report, separated from machinability coverage, to make every currently blank property row auditable and researchable.

## 2026-08-09 — Normalized customer-facing material-grade aliases

- Consolidated documented supplier and marketplace aliases into a canonical customer catalog while preserving raw labels in the source datasets.
- Reduced the Aluminum directory from 50 source labels to 38 distinct customer-facing grades; `Al 6061-T6` and `6061-T6 Aluminum` now render as one `6061-T6 Aluminum` row, while T6 and T651 remain separate.
- Applied the same explicit-alias approach to clear equivalents across Stainless, Steel, Brass/Copper, Titanium, Nickel-family, and Precision-alloy directories; removed misclassified Cast Iron from Magnesium / zinc and Inconel 625 from Precision alloys.
- Made material-card and family-header counts derive from the normalized directory, and refreshed the mechanical-property backlog to 190 canonical grades.

## 2026-08-09 — Grouped Aluminum catalog by alloy offering and condition

- Replaced Aluminum’s peer temper rows with 21 alloy offerings, following the marketplace pattern of presenting `6061 Aluminum` once with its supported conditions rather than listing bare 6061, T6, and T651 independently.
- Expanded Aluminum offerings now expose the supported temper chips and switch the reference-property table to the selected condition; unsupported conditions remain visibly blank instead of inheriting another temper’s values.
- Updated customer-facing counts and the mechanical-property/machinability coverage reports for the 312-record normalized catalog.

## 2026-08-09 — Reconciled Aluminum condition-level mechanical properties

- Added source-linked reference records for every currently surfaced Aluminum temper, including 6063-T6, 2014-T6/T651, 2017-T4, 2024-T351, 5083-H111, 6061-T651, 6082-T6/T651, and 7075-T651/T7351.
- Retained bare alloy offerings as intentionally blank until the supplier-supported condition and product form are known; no family-level values are inferred.
- Added an automated assertion that every supported Aluminum condition resolves to a directory property record.

## 2026-08-10 — Researched the remaining Aluminum reference-property gaps

- Researched and added source-linked reference conditions for the eleven previously blank Aluminum offerings: 1070, 2A12, 2A14, 3003, A413, MIC-6, 2007, 2017A, 5251, 5754, and 7050.
- Preserved the distinction between a network offering and a referenced condition: the UI now labels a condition from literature as a reference condition when the supplier listing itself does not state a temper or product form.
- Generalized the table heading from `Hardness (Brinell)` to `Hardness`, so data sheets reporting Vickers hardness are not mislabelled. 1070-H14 and 2007-T4 explicitly show `Not published` because their selected references omit hardness.
- Updated the mechanical-property source log, coverage report, feature map, and product decision record; added regression coverage for all 21 Aluminum offerings.

## 2026-08-10 — Added source-backed Mild, Alloy, and Tool-steel reference rows

- Added condition-labelled mechanical-property rows for CSA 44WT / 44W, 40CrNiMo, 11SMnPb37 / 1.0737, 30CrNiMo8 / 1.6580, 34CrNiMo6 / 1.6582, 17-4PH H900, Toolox 33, and 1.2085.
- Used producer or supplier data sheets where available and preserved source gaps as explicit `Not published` table cells instead of merging values from incompatible material conditions.
- Reduced the source-backed property backlog to six Mild-steel labels, one Alloy-steel label, and no Tool-steel labels. The remaining Alloy entry, `18CrNiMo7-6 / 1.6587`, requires the supplier's delivery condition before a responsible reference row can be chosen.
- Verification: focused Materials-directory tests, TypeScript typecheck, and ESLint all pass.

## 2026-08-10 — Reconciled remaining material-property aliases and generic polymers

- Resolved 58 additional customer-facing labels to condition-specific source records across Brass/Copper, Stainless, Titanium, Precision alloys, Magnesium/Zinc, Tool steel, Inconel/Incoloy, and unfilled engineering polymers.
- Kept 91 labels blank only where the designation is a family, a coating/trade name, a filled or modified polymer, a composite, an elastomer, a proprietary resin, or a grade without an exact documented delivery condition.
- Rewrote the coverage report as the source-of-truth missing-data report, with the exact remaining labels and reason each family remains blank.

## 2026-08-10 — Reframed plastics selection around functional traits

- Replaced the customer-facing Plastics / polymers mechanical-property strips with the approved functional-selection rail: heat tolerance, moisture response, chemical resistance, and wear / friction.
- Kept forms, machinability, application context, and selection notes intact; added a concise RFQ guidance note to confirm the specific resin grade and data sheet.
- Omitted reference mechanical-property tables from expanded long-tail plastic records, while retaining those records internally for source audit and operator research.
- Verification: focused Material page/directory tests, TypeScript typecheck, browser console check, and source-to-implementation desktop visual comparison passed.

## 2026-08-11 — Added on-demand polymer behavior disclosures

- Replaced the always-visible plastics trait rail with the selected `Material behavior` disclosure treatment.
- The expanded detail is a flush 2 × 2 editorial grid within the same material card, including concise guidance for each qualitative trait; no tinted or nested subcard was introduced.
- Shared the component between the curated common-polymer cards and long-tail plastics directory rows, with native accessible disclosure behavior.
- Verification: focused Materials tests, TypeScript typecheck, ESLint, desktop/mobile disclosure interaction, no horizontal overflow at 390 px, and a clean browser console.

## 2026-08-08 — Implemented compact equipment qualification cards

- Replaced the customer Equipment catalog's tall provenance-heavy expanded rows with the selected compact qualification-card design.
- Added a unified six-field technical rail with consistent label/value typography, responsive two/three/six-column layouts, qualified supplier-reported precision language, best-fit guidance, limitations, and an explicit manufacturability qualification note.
- Removed customer-facing supplier identity, source/review dates, generic verification badges, and manufacturer-source actions while retaining internal provenance data.
- Added representative-image labeling, customer-safe quantity/guidance fields for the Jingdiao JDGR200T, a technical data-sheet link, and an `Evaluate my part` route into the RFQ workflow.
- Replaced the nested interactive accordion markup with one accessible disclosure button per machine card and preserved filters, sorting, and open/closed states.
- Verification: focused Equipment tests, typecheck, lint, production build, desktop visual comparison, 390 px mobile responsive checks, accordion interaction checks, and a clean browser console.
## 2026-08-11 — Implemented the manufacturing-proof public landing page

- Replaced the prior invite-only entry screen with the selected manufacturing-proof concept: a close CNC-machine hero, overflow-capacity positioning, account-free quote CTA, managed-service proof strip, and inspection-document workflow section.
- Added responsive generated raster assets for the CNC hero and inspection-report proof, with accessible image descriptions and existing icon-library controls.
- Connected public navigation and conversion paths to capabilities, materials, quality documentation, login, the on-page workflow, and `/simple-quote`.
- Added focused landing-page regression coverage and verified the desktop/mobile layouts, anchor behavior, simple-quote navigation, and a clean browser console.

## 2026-08-11 — Added the unlisted-material inquiry workflow

- Removed search from the family-level Materials atlas and routed `Request an unlisted material` to a dedicated authenticated inquiry form.
- Added PostgreSQL-first `MaterialInquiry` persistence with a development local fallback, customer confirmation state, and an admin queue with New/Reviewing/Resolved status plus internal sourcing notes.
- Added Material Inquiries to admin navigation and documented the new customer/admin routes, data source, and rollout requirement.
- Verification: Prisma client generation, four focused test files (7 tests), TypeScript typecheck, focused ESLint, full customer submission/confirmation smoke test, admin queue/status-update smoke test, and desktop visual review passed. The synthetic browser QA record was removed after verification.

## 2026-08-11 — Integrated functional traits into plastic directory cards

- Removed the expandable plastic-grade subcard that repeated typical applications and carried the now-retired mechanical-property treatment.
- Applied the four-item functional-selection rail from Common grades directly to every plastic directory card: heat tolerance, moisture response, chemical resistance, and wear / friction.
- Kept application context, common forms, and machinability in the main card, so each plastic grade is scannable without an additional interaction.

## 2026-08-11 — Refined polymer behavior disclosure details

- Reduced the `Material behavior` disclosure to a shorter, quieter 27 px control with lower-contrast type and a smaller chevron.
- Replaced the ambiguous responsive border utility combination in the open two-column trait grid with explicit positional dividers, removing the unintended dark bottom borders from the right-hand cells.
- Verification: focused Materials tests, TypeScript typecheck, ESLint, and a live expanded-disclosure inspection passed.

## 2026-08-11 — Anchored polymer behavior controls to their rows

- Moved the shared `Behavior details` trigger beneath each polymer row's machinability rating in both Common grades and the long-tail catalog.
- Kept the expanded functional-trait panel full-width, making the row association explicit without losing the 2 × 2 comparison layout.
- Verification: focused Materials tests, TypeScript typecheck, ESLint, and live browser interaction/overflow checks passed.

## 2026-08-11 — Made polymer behavior disclosures mutually exclusive

- Added page-level disclosure coordination so only one polymer `Behavior details` panel can remain open across Common grades and the long-tail catalog.
- Opening a different material automatically closes the prior expanded panel.
- Verification: focused Materials tests, TypeScript typecheck, ESLint, and a live two-disclosure browser check passed.

## 2026-08-11 — Corrected Aluminum numbered-series grouping

- Moved `2007` and `2017A` to 2000 series, `5251` and `5754` to 5000 series, and `7050` to 7000 series.
- Removed the resulting erroneous Aluminum `Other grades` fallback bucket and added regression coverage for the series mapping.
- Verification: focused catalog/directory tests, TypeScript typecheck, ESLint, and live guide review passed.

## 2026-08-11 — Added verified UNS labels for cast and 316 stainless grades

- Added `UNS A04130` for A413 and labelled MIC-6 accurately as proprietary tooling plate with no standard UNS.
- Added `S31600`, `S31603`, `S31673`, and `S31635` to the corresponding 316, 316L, 316LVM, and 316Ti directory rows; the dual-certified 316/316L listing shows both applicable identifiers.
- Verification: focused catalog/directory tests, TypeScript typecheck, ESLint, and live stainless guide review passed.

## 2026-08-11 — Consolidated customer-facing 304 and 316 stainless offerings

- Merged standard 304 and 304L into one `304/304L Stainless Steel` offering, and standard 316 and 316L into one `316/316L Stainless Steel` offering.
- Retained 304LVM, 316LVM, and 316Ti as distinct specification-sensitive materials; normalized `SS 304H` and `SS 316H` to `304H` and `316H`.
- Verification: focused catalog/directory tests, TypeScript typecheck, ESLint, and live directory label checks passed.

## 2026-08-11 — Temporarily narrowed the customer Equipment catalog

- Removed Manual Machines, Finishing, EDM, Die Casting, and Additive Manufacturing from the customer-facing Equipment section selector.
- Preserved their underlying equipment records so the sections can return after their photo and data quality are remediated.
- Retained CNC Milling, CNC Lathe, QC & Inspection, and Sheet Metal as the current customer-visible scope.
- Removed free-text search and customer-controlled sorting from the Equipment catalog, retained curated section filters, and kept cards alphabetized by make/model.
- Shrink-wrapped the desktop Equipment section switcher around its visible tabs while preserving narrow-screen horizontal overflow.

## 2026-08-11 — Enforced customer-safe equipment imagery

- Classified all 83 equipment records as `same-model` or `representative`; no record is presented as an actual supplier-machine photo without supplier-facility evidence.
- Retained only model-specific same-model imagery on named cards, including priority CNC, inspection, and sheet-metal records.
- Removed representative, duplicated, and mismatched card photos—including the logo and manufactured-part imagery—from customer rendering and replaced them with a neutral `Photo pending verification` state.
- Added regression coverage to prevent representative images from reappearing on customer cards without an explicit same-model or actual-machine classification.

## 2026-08-11 — Restored visual references for unverified equipment imagery

- Restored the existing local image assets to cards with representative/unverified imagery so operators can still scan the catalog visually.
- Kept the explicit `Photo pending verification` label for those images and styled it with a light-yellow background to distinguish it from same-model imagery.

## 2026-08-11 — Added a generic VMC-866 reference image

- Replaced the unrelated logo shown for the Shenzhen JingRui WH-866 (BT40) with a generic VMC-866 machine photograph from a public VMC-866 listing.
- Retained its light-yellow `Photo pending verification` label and documented the complete actual-machine-photo gap list: no catalog record is currently backed by a supplier-facility/actual-machine image.

## 2026-08-11 — Added a cleaned VMC-850 reference image

- Used the user-provided VMC-850 visual reference to produce a clean, machine-only product image and applied it to the Shandong Shengyu 850 card.
- Preserved the card's `Photo pending verification` status because the image is a generic VMC-850 reference rather than verified Shengyu equipment.

## 2026-08-11 — Split ambiguous equipment fleet records

- Removed the controller-only FANUC 31i-MODEL B Plus record from the customer Equipment catalog.
- Replaced the combined three-model Jingdiao entry with separate SmartCNC500-DRTD, JDGR400-A13S, and JDCT800T cards with their individual quantities and specifications.
- Replaced the broad 40+ 3-axis VMC fleet with its 21 source-backed individual machine-model cards, preserving listed counts, envelopes, speeds, and accuracy data; any source ambiguity remains visible in the related card note.

## 2026-08-11 — Integrated equipment imagery into catalog rows

- Replaced the bordered thumbnail treatment with a full-height integrated left image column in every Equipment row.
- Hid customer-facing image-status captions while retaining the image classification metadata and descriptive image alt text in the dataset/UI.

## 2026-08-11 — Simplified equipment-card actions

- Removed the repeated `Evaluate my part` action from all expanded Equipment cards.
- Kept the technical data-sheet link where a record includes one.

## 2026-08-11 — Made equipment specification links model-specific

- Removed the generic fallback from expanded Equipment cards: an online specification link now appears only when a public page explicitly names the model.
- Withheld generic manufacturer and supplier home pages, including the Jingdiao home-page link previously shown for JDGR400-A13S.
- Retained verified technical PDFs and added audited direct model pages for DMU 50, Makino PS105, Dazu MPS-3015C, EKO ES3512, and Jingdiao JDCT800T.
- Verification: focused Equipment tests, TypeScript typecheck, and ESLint passed.

## 2026-08-11 — Protected proprietary manufacturing partner identities

- Added a customer-safe supplier projection that redacts underlying manufacturing shop names, contacts, and free-text partner updates before customer order, shipment, dashboard, and notification routes render or serialize them.
- Replaced customer order labels with neutral Lattice manufacturing-network language while retaining exact partner records for admin and supplier workflows.
- Sanitized Equipment guidance to prevent internal source-vendor names from appearing in buyer-facing cards.

## 2026-08-11 — Simplified Equipment guidance

- Removed the repeated `Qualification note` disclaimer from expanded Equipment cards.
- Retained the model-specific `Best for` and `Limitation` guidance, which provide the actionable routing context.

## 2026-08-11 — Added specification links to every equipment card

- Preserved the `View technical data sheet` label for records with an archived or model-specific PDF.
- Added `View online specifications` to all remaining expanded records, using the best available model/manufacturer reference URL without labelling a general or supplier page as a data sheet.
## 2026-08-11 — Corrected the precipitation-hardened stainless family label

- Renamed the stainless catalog group from `Precipitation hardening` to `Precipitation-hardened stainless steels` so the heading describes the family rather than its heat-treatment process.
- Added regression coverage confirming the existing PH grades remain grouped there.

## 2026-08-11 — Corrected 303 stainless catalog placement

- Moved 303Se and 303Sulf into the 300-series austenitic customer group.
- Removed the generic `SS 300 series` family label from the RFQ material library and customer catalog because it is not a quoteable grade.
- Updated the mechanical-property coverage counts and regression coverage for the grouping and removal.
# 2026-08-13 - Disabled landing-page routes pending access-policy hardening

- Replaced the landing header's Capabilities, Materials, Quality, and How it works links with visually retained disabled controls so they cannot route customers into app surfaces without the required access-policy decision.
- Preserved the account-free `/simple-quote` and login conversion paths.
- Updated the feature map, project context, decision record, and next-action list; added landing-page regression coverage for the disabled controls.

# 2026-08-13 - Removed the account-free hero quote action

- Removed the `Start your quote` action and the `No account required` message from the public landing-page hero.
- Kept the hero layout and its secondary visual treatment intact, while updating regression coverage and project records to reflect the account-required direction.

# 2026-08-13 - Refined the landing-page capacity message for machine-shop owners

- Replaced the generic capacity headline with `Additional capacity when you need it.`
- Updated hero copy to address overflow and cyclical demand, scheduled commitments, lead times, and customer responsiveness through Lattice's qualified global CNC machining and fabrication partner network.

# 2026-08-13 - Clarified pre-shipment quality-document review

- Updated the public landing-page quality section to state that requested inspection reports and material documentation are uploaded to Lattice for customer review before shipment.

# 2026-08-13 - Restored invite-only landing-page entry

- Replaced the public landing header's `Get a quote` action with `Request an account`, routing it to the existing `/waiting-list` access-request flow.
- Added regression coverage and documented that the remaining public simple-quote routes need separate route-level access-policy hardening before future promotion.

# 2026-08-13 - Simplified the landing-page quality section

- Removed the redundant `QUALITY YOU CAN VERIFY` eyebrow and retained the larger `Quality you can verify.` heading as the single visual message.

# 2026-08-13 - Tightened landing-page capacity copy

- Reduced the main capacity paragraph from 42 to 34 words while retaining the qualified global CNC/fabrication network, overflow and cyclical-demand, schedule protection, managed delivery, lead-time, and customer-responsiveness messages.

# 2026-08-13 - Added an account-safe public How It Works page

- Reactivated only the landing-page `How it works` link and routed it to `/how-it-works`.
- Added a four-step one-pager covering approved-account work sharing, production-plan alignment, managed production coordination, and pre-shipment review of requested inspection and material documentation.
- Kept the page invite-only in practice: its only conversion path is `Request an account`; it exposes no guest RFQ action.

# 2026-08-13 - Made the How It Works page standalone

- Added `/how-it-works` to the app shell's public routes so the explainer does not render the authenticated workspace sidebar or application chrome, even for an already signed-in visitor.

# 2026-08-13 - Restyled the public How It Works page as documentation

- Reworked `/how-it-works` into the same editorial, documentation-style hierarchy as the Quality Documentation guide: breadcrumb, page header, structured sections, and a sticky desktop contents rail.
- Retained the standalone public layout and account-request-only conversion path.

# 2026-08-13 - Added the Lattice founding problem to How It Works

- Reframed the one-pager around domestic demand outpacing machine-shop capacity, the need for confidence when accessing overseas production capacity, and Lattice's managed bridge between them.
- Retained the four-step workflow as the practical explanation of how that bridge operates.

# 2026-08-13 - Divided How It Works into problem and solution

- Organized the public one-pager into explicit `01 · The problem` and `02 · The solution` sections, with the four-step workflow nested under the solution.
- Updated the desktop contents rail to reflect the problem/solution narrative hierarchy.

# 2026-08-13 - Clarified capacity-expansion constraints

- Updated the Problem section to state that adding people, machines, or floor space takes time, capital, and risk, particularly for cyclical demand.
- Clarified that work may not fit either the schedule or the shop's available capacity.

# 2026-08-13 - Clarified overseas-capacity qualification work

- Reframed the overseas-capacity message around rigorous vetting needed to access qualified capacity at scale.
- Added the real qualification costs domestic shops otherwise bear: factory visits/audits, up-front investment, and risk on initial parts.

# 2026-08-13 - Added operational coordination to qualification work

- Clarified that building confidence in overseas capacity also requires establishing operational coordination, alongside audits, up-front investment, and initial-part risk.

# 2026-08-13 - Clarified overseas subcontracting language

- Updated the capacity-qualification statement to describe domestic shops subcontracting with overseas capacity, using the approved operator wording.

# 2026-08-14 - Sharpened How It Works capacity messaging

- Reframed the public explainer around access to qualified global production capacity while protecting customer relationships and production schedules.
- Clarified that the difficult work is qualifying suppliers, validating process capability, managing requirements and documentation, coordinating production, and delivering conforming parts.
- Reordered the demand-pressure narrative to lead with the consequence of a job that cannot fit the schedule or available capacity.
- Reframed the solution around customer-controlled requirements and Lattice-managed supply-chain coordination, including pre-shipment quality documentation.
- Clarified the sustained-demand paragraph with the hiring, training, automation, and capital constraints of adding productive capacity.
- Renamed the demand-pressure subheading to emphasize the gap between customer demand and productive capacity.
- Moved the section's Lattice value statement into a separate bold closing sentence.
- Replaced the global-capacity follow-up paragraph with the concise managed coordination and delivery statement.

# 2026-08-14 - Reframed How It Works around managed capacity

- Refocused the public page on profitable demand, constrained internal capacity, and global capacity that Lattice qualifies and manages against the customer&apos;s requirements.
- Updated the four-step workflow to customer job intake, supply planning, managed production, and pre-shipment quality review.
- Added concise first-job guidance, a four-point managed-capacity value grid, and backlog-focused CTAs that reuse the existing waiting-list contact flow.
- Softened the problem-section capacity-gap statement into a bold continuation of the body copy rather than a callout treatment.
- Applied the same subdued inline treatment to the global-capacity closing statement.

# 2026-08-14 - Refined approved How It Works conversion and navigation details

- Replaced the global-capacity opening with a more measured supplier-qualification statement.
- Moved the practical first-job guidance ahead of the workflow and aligned the desktop contents rail with the resulting section order and current labels.
- Added sticky-header-safe anchor offsets, consolidated the repeated closing CTA and invite-only note, and retained desktop CTA wording while shortening the mobile header CTA and keeping login visible.

# 2026-08-14 - Added the customer origin behind Lattice

- Added a concise, customer-facing credibility note before the closing CTA: Lattice was built after domestic quote and lead-time constraints on high-temperature ammonia reforming work led the team to qualify overseas manufacturing capacity through audits, process validation, and supplier management.
- Kept the detailed origin story and investment history out of the workflow page so the page stays focused on the buyer’s practical next step.

# 2026-08-14 - Expanded the customer-origin context on How It Works

- Reframed the origin section around the proposition that global manufacturing should not require building a global supply chain.
- Added the approved customer context: domestic constraints on price, lead time, and process requirements; the work of qualifying overseas production; and Lattice’s formation while sourcing high-temperature ammonia reforming components.

# 2026-08-14 - Refined the Why Lattice exists section

- Updated the section to lead with managed access to global manufacturing capacity and to explain the qualification, validation, material, quality, communication, and logistics work required to make it dependable.
- Preserved the firsthand ammonia-reforming sourcing context and emphasized that Lattice provides the resulting manufacturing infrastructure without asking customers to build it themselves.

# 2026-08-14 - Positioned Lattice as strengthening domestic manufacturers

- Clarified that the overseas network was built to augment and fortify the domestic manufacturing team, not displace the work that belongs on its floor.
- Replaced the origin section&apos;s final statement with the approved domestic-manufacturer outcome: retain customer relationships, protect internal capacity, and accept more of the work already being won.

# 2026-08-14 - Clarified the How It Works workflow

- Updated the four steps to reflect complete manufacturing-package intake, validation before supplier quoting, customer approval before production launch, and order-attached quality documentation for pre-shipment review.
- Added the multi-part RFQ specificity, supplier-backed quote, order-tracking, and manufacturing-package documentation details; aligned the desktop contents rail with the new step names.

# 2026-08-15 - Simplified the How It Works page index

- Reduced the desktop page index to three primary anchors: The problem, How Lattice works, and Why Lattice exists.
- Removed the visual sidebar rule and added a sticky-header-safe origin-section anchor, so the navigation remains useful without competing with the short page content.

# 2026-08-15 - Collapsed the How It Works page index by default

- Replaced the always-visible desktop index with a compact three-line rail that expands to the three primary links on hover or keyboard focus.
- Kept the index out of the mobile layout and preserved the existing sticky anchor behavior.

# 2026-08-15 - Restored the detailed How It Works page index

- Kept the compact collapsed rail while restoring the problem, solution, workflow, value, and origin links inside its expanded state.

# 2026-08-15 - Widened the How It Works reading column

- Increased the desktop article column from 740px to 820px and modestly tightened the desktop grid gap so the page uses the available space more comfortably while retaining the responsive layout and index rail.

# 2026-08-15 - Added expandable Lattice benefit details

- Replaced the static two-column `What Lattice adds` card grid with four full-width disclosure rows that retain their benefit summaries while revealing more operational detail on demand.
- Added one-panel-at-a-time behavior, relevant icons, open-state styling, keyboard-visible focus, reduced-motion handling, responsive layouts, and interaction coverage for the benefit controls.

# 2026-08-15 - Redesigned the How It Works workflow

- Replaced the desktop workflow stack with a wider four-column sequence connected by a restrained directional curve and numbered milestones.
- Matched each step with a compact semantic icon, retained the approved operational copy, and preserved the vertical step layout on narrower screens.
- Expanded the public-page container for the horizontal composition, kept the desktop contents rail at the extra-large breakpoint, and verified the section at desktop and 390px mobile sizes without horizontal overflow.

# 2026-08-15 - Docked the How It Works index to the viewport edge

- Moved the collapsed desktop page index from the centered content grid to the right edge of the browser window.
- Kept the compact rail and made its detailed link panel expand inward so it no longer floats between the article and viewport edge.

# 2026-08-15 - Reframed the How It Works problem section

- Converted the paired demand-pressure and global-capacity narratives into balanced desktop columns under the existing section headline.
- Retained the original stacked order, dividers, and text treatment below the medium breakpoint for a familiar mobile reading flow.

# 2026-08-15 - Matched the solution section to the two-column page rhythm

- Placed the solution overview and practical-first-job guidance side by side at wider breakpoints, using the same vertical divider and spacing treatment as the problem section above.
- Preserved the existing stacked reading order on narrower screens and kept the workflow presentation below unchanged.

# 2026-08-15 - Aligned How It Works introduction width

- Removed the hero summary&apos;s narrower reading cap so it now aligns with the widened content column used by the rest of the page.

# 2026-08-15 - Refined the How It Works page marker

- Replaced the introductory clipboard symbol with a route icon that more directly conveys the page&apos;s managed production path and matches the workflow timeline.

# 2026-08-15 - Removed the duplicate workflow heading

- Kept the compact `How the workflow works` eyebrow as the section label and anchor while removing the repeated large heading immediately below it.

# 2026-08-15 - Reframed the service delivery label

- Renamed the production-steps section label from `How the workflow works` to `How Lattice delivers` so the page describes an accountable managed service rather than an internal workflow.

# 2026-08-15 - Added China network-reach proof to How It Works

- Added a restrained China map beneath the value disclosures to make the qualified manufacturing network tangible without presenting a supplier directory.
- The illustration shows regional clusters only and explicitly keeps supplier identities and exact facility locations confidential.

# 2026-08-15 - Aligned the solution heading scale

- Reduced the `Add capacity without building it yourself` heading from the page-section scale to the same type scale as the neighboring content headers.

# 2026-08-15 - Added source-backed network statistics

- Added current equipment-catalog counts to the `More capacity` and `Managed quality` benefit rows on `/how-it-works`.
- Derived the public counts from `src/lib/vendor-equipment.ts` at render time so they stay aligned with the app's documented network records.
- Left the fixed-expansion and accountable-partner benefits unnumbered because the app does not yet hold defensible outcome statistics for those claims.

# 2026-08-15 - Expanded CNC and quality evidence

- Added a dynamically calculated CNC snapshot to the expanded `More capacity` benefit: 212 documented machines, a 192 / 20 milling-to-turning split, and 82 machines explicitly listed as 5-axis in the normalized equipment catalog.
- Added high-level process coverage and documented maximum milling/turning envelopes, with an availability-at-quote caveat.
- Researched current official quality claims for Zintilon, Best Prototypes, Jucheng Precision, ZYTC Alloy, and Huaxiao Metal, then summarized the evidence without exposing supplier identities on the public page.
- Distinguished verified/source-held certificates, ISO-based quality-program claims, and material-traceability documentation; the public copy requires scope, currency, heat traceability, and job applicability to be confirmed during qualification.

# 2026-08-15 - Tightened How Lattice delivers workflow copy

- Removed the redundant supporting lines from the first three delivery steps so each title leads directly into its operational detail.
- Kept the quality-evidence summary in the final step because it remains a distinct pre-shipment trust signal.

# 2026-08-15 - Clarified pre-shipment quality control

- Added the requested hold point: when requested, shipment is held until the substantiation documents are approved.

# 2026-08-15 - Consolidated Step 4 quality copy

- Combined the quality-review lead-in and documentation detail into one operational statement, keeping the pre-shipment hold point while removing repeated evidence language.

# 2026-08-15 - Renamed first-job guidance

- Renamed the practical first-job section to `Where to start with Lattice` for a clearer, more approachable entry point.

# 2026-08-15 - Added Network reach to the page index

- Added a direct `Network reach` anchor to the expanded desktop page index, linking to the China regional-capacity map.

# 2026-08-15 - Strengthened What Lattice Adds disclosures

- Reframed the section around `More capacity. Less infrastructure to manage.` and made every collapsed row a concise customer outcome.
- Expanded each benefit with grounded manufacturing details, moving dynamic equipment and inspection counts into secondary proof positions rather than leading with internal-record language.
- Added concrete capacity, fixed-expansion, managed-quality, and accountable-partner guidance while retaining the existing one-panel accordion behavior.

# 2026-08-15 - Warmed the What Lattice Adds visual treatment

- Replaced the accordion’s cool blue/slate surfaces and expanded-state accent with the page’s warm stone neutrals and a restrained charcoal state marker.

# 2026-08-15 - Tightened More capacity detail

- Removed the redundant expanded-panel lead-in so the capability snapshot appears immediately after the customer-facing summary.

# 2026-08-15 - Simplified More capacity proof

- Removed the trailing equipment-record count because the machine snapshot is the clearer proof of available capacity.

# 2026-08-15 - Stabilized the network map asset

- Configured the China map as an unoptimized local image so the browser loads the verified PNG directly rather than relying on the image-optimization route.

# 2026-08-15 - Simplified the CNC capacity snapshot

- Replaced the inset metric card with a borderless three-column definition list, using only subtle rules and separators so the data reads as part of the expanded panel.

# 2026-08-15 - Updated network workforce coverage

- Updated the public partner-network workforce figure from 300+ to 400+ across machining, quality control, shipping and receiving, and related production support.

# 2026-08-15 - Simplified the Managed quality panel

- Removed the nested card surfaces from the four-step quality flow and qualification evidence, replacing them with lightweight rules, compact step numbers, and responsive inline columns.
- Removed the trailing inspection-equipment record count so the panel ends on the customer-facing quality outcome.

# 2026-08-15 - Added machine and workforce proof to More capacity

- Added the dynamically derived CNC machine total to the expanded milling-capability bullet so the public copy stays aligned with the normalized equipment catalog.
- Replaced the redundant turning-process bullet with a 300+ combined partner-network workforce statement spanning machining, quality control, shipping/receiving, and related production support.

# 2026-08-15 - Added source-backed QC capability proof

- Replaced the generic measurement-capability bullet with a dynamically derived 12-CMM network aggregate plus documented vision, material-analysis, surface, hardness, ultrasonic, and traceability controls.
- Grounded the public aggregate in the supplied Zintilon and Best Prototypes inspection-equipment lists and Jucheng's identification and traceability procedure, while keeping supplier identities confidential on the public page.

# 2026-08-15 - Reframed Managed quality around qualification

- Rebuilt the expanded `Managed quality` disclosure around four customer-protection stages: vet the supplier, qualify the job, control production, and verify evidence before shipment.
- Repositioned certification, inspection-equipment, and traceability records as supporting qualification evidence rather than the primary story.
- Added a clear customer promise that released parts remain tied to the approved drawing, material, inspection, and documentation requirements.

# 2026-08-15 - Reframed fixed expansion as capacity on demand

- Renamed the `Less fixed expansion` disclosure to `Capacity on demand` and centered it on job-by-job access to qualified CNC capacity.
- Clarified that customers can scale outsourced production with backlog demand without a long-term volume commitment or year-round headcount, equipment, and floor-space costs.
- Preserved the quote-and-approval gate so the public copy does not imply that unreviewed work is released directly to production.

# 2026-08-15 - Clarified the accountable-partner value

- Reframed the `One accountable partner` summary around access to qualified overseas capacity through a single accountable manufacturing partner.

# 2026-08-15 - Made supplier vetting more tangible

- Clarified that supplier approval includes Lattice-funded onsite facility visits, QMS and supply-chain audits, and sample-part production used to verify process and inspection performance.

# 2026-08-15 - Put qualification evidence in Lattice's direct voice

- Rewrote the supplier-certification and inspection-capability proof to use `we` and `our`, making Lattice accountable for matching, qualification, and verification rather than describing the partner base from a distance.

# 2026-08-15 - Clarified Lattice ownership across quality controls

- Made the final three quality-protection stages explicit Lattice actions—qualifying the job, controlling production, and verifying evidence before shipment—so customers are not implied to manage those steps themselves.

# 2026-08-15 - Varied quality-control copy rhythm

- Reworked the three quality-control descriptions to lead with the job stage while retaining clear Lattice ownership, avoiding repetitive sentence openings.

# 2026-08-15 - Explained China network reach

- Added concise public context for China&apos;s dense industrial clusters and manufacturing specialization across machining, materials, finishing, and inspection, explaining why Lattice qualifies capacity there.

# 2026-08-15 - Clarified Lattice&apos;s customer-origin story

- Updated the credibility note to trace Lattice&apos;s qualification experience to sourcing critical components for high-temperature chemical reactor systems, while retaining the domestic-team augmentation message.

# 2026-08-15 - Connected quality evidence to vendor selection

- Clarified that the listed certifications are held across the supplier network and that customer-requested standards are used to shortlist eligible vendors.
- Rewrote the inspection proof around matching each job to the right inspection resources before award, then requiring the selected vendor to provide requested reports and maintain traceability through shipment.

# 2026-08-15 - Tightened the Managed quality outcome

- Replaced the defensive closing claim with a direct customer outcome centered on approved requirements, inspection evidence, and expected documentation.

# 2026-08-15 - Corrected the China network map

- Replaced the illustration's baked-in decorative pins with code-positioned markers for the five operator-confirmed network cities: Shenzhen, Dongguan, Beijing, Shanghai, and Tianjin.
- Added a visible city legend and clarified that supplier identities and exact facility addresses remain confidential.

# 2026-08-15 - Corrected XRF inspection terminology

- Replaced generic X-ray material-analysis language with the specific `X-ray fluorescence (XRF)` method across the public capacity and quality disclosures.

# 2026-08-15 - Simplified the China network map

- Removed the public city-name legend while retaining the corrected network markers and the general facility-confidentiality statement.

# 2026-08-15 - Refined the China network copy

- Tightened the network-reach description to refer to qualification across the region rather than multiple regions.

# 2026-08-15 - Moved the China map note

- Relocated the city-marker and facility-confidentiality note beneath the map as a subtitle, keeping the adjacent network description focused on context.

# 2026-08-15 - Added supplier disqualification to the origin story

- Clarified that Lattice built its network by qualifying capable suppliers and disqualifying prospective suppliers that could not demonstrate the quality systems, process controls, and execution discipline each job requires.

# 2026-08-15 - Reframed the closing CTA around platform access

- Replaced the backlog prompt with an access-request invitation for readers who see Lattice as a fit for how they manage capacity.

# 2026-08-15 - Simplified the map caption

- Removed the caption background and facility-confidentiality sentence, retaining only a smaller verified-city marker note.

# 2026-08-15 - Simplified the platform-access CTA

- Removed the closing CTA headline so the access-request explanation and action can stand alone.

# 2026-08-15 - Unified How Lattice works access CTAs

- Changed the header action to `Request access` so it matches the closing platform-access CTA at every responsive breakpoint.

# 2026-08-15 - Clarified the China map caption

- Updated the caption to describe the pins as locations of partner manufacturers.

# 2026-08-15 - Tightened the platform-access prompt

- Removed the follow-up promise from the closing access-request copy.

# 2026-08-15 - Redesigned the waiting-list access request

- Audited the legacy waiting-list page against the current public landing page and How Lattice works experience, then replaced the old dark procurement-workspace presentation with the warm, editorial Lattice public design system.
- Repositioned the page around invite-only access for domestic manufacturers seeking qualified overflow and out-of-capability production capacity, with concise proof for managed execution and pre-shipment quality evidence.
- Kept the existing server-action persistence and duplicate-company behavior, added a pending submit state through the shared form-status control, improved the duplicate-request announcement semantics, and redesigned the successful-request confirmation state.
- Verification: four focused waiting-list tests and targeted ESLint passed; desktop browser QA covered the request, duplicate-request, and confirmation states. Repository-wide typecheck remains blocked by a pre-existing unchecked indexed access in `src/app/how-it-works/page.test.tsx:76`.

# 2026-08-17 - Added partner-network industry proof to the home page

- Added a compact, logo-strip-inspired home-page section that communicates documented partner-network industry coverage without naming downstream companies, reproducing their trademarks, or implying customer endorsement.
- Grounded the public labels in the published industry/capability information of Zintilon, Best Prototypes, and Shenzhen Jucheng Precision Model, with the source basis and public-copy limitation recorded in `docs/how-it-works-network-evidence.md`.
- Verification: focused home-page test, TypeScript typecheck, targeted ESLint, clean diff check, desktop and 390 px mobile browser QA, and a clean browser console.

# 2026-08-17 - Added public capabilities, materials, and quality explainers

- Replaced the disabled home-page navigation items with working public routes for Capabilities, Materials, and Quality, and unified them with the existing How Lattice works public header.
- Added account-safe editorial explainers based on the approved workflow: aggregate CNC/process capacity, material coordination and family coverage, and supplier/job quality planning plus documentation evidence.
- Preserved confidential supplier identity and job-specific availability; every page directs prospective readers to request an account instead of opening an unauthenticated RFQ.

# 2026-08-17 - Archived vendor factory-floor references

- Archived two publicly published factory-floor photos from Best Prototypes and two workshop photos from Shenzhen Jucheng Precision Model in their vendor-specific source folders.
- Added original URLs, SHA-256 checksums, and internal-reference-only usage notes; vendor permission remains required before any customer-facing publication.

# 2026-08-17 - Adopted the official Lattice mark

- Replaced the prior unframed four-cell symbol with the approved outer-diamond, four-cell mark in the shared Lattice brand component.
- The public site header, waiting-list header, and authenticated workspace shell now inherit the official mark from one source.

# 2026-08-17 - Added a user-provided inspection reference

- Archived the supplied CMM inspection-station image separately from vendor-sourced photos and marked its original source and public-use rights as unverified.
- Added user-provided references of a 5-axis machining center and a press-brake fabrication floor under the same provenance restriction.
- Added eleven more unique user-provided manufacturing references spanning quality control, CNC machining, laser cutting, press-brake work, and finishing; one identical repeated image was cataloged as a duplicate rather than stored twice.
- Reclassified that eleven-image set under Shenzhen Jucheng Precision Model after the user confirmed `jcproto.com` as its source.

# 2026-08-17 - Archived public capabilities, materials, and quality explainers

- Removed the three public explainer routes from the marketing header and returned Capabilities and Materials to their authenticated workspace views; the standalone Quality page was removed.
- Moved the surviving How Lattice works link to the right-side account actions, keeping the public header focused on the core service explanation and account access.

# 2026-08-17 - Removed the landing-page capabilities CTA

- Removed the redundant `Explore capabilities` hero button after archiving the public capabilities explainer; account access remains available through the shared header CTA.

# 2026-08-17 - Moved the How Lattice works entry point

- Removed the informational link from the account-action header and added a quiet `See how Lattice delivers` hero link instead, so the supporting explainer follows the service promise rather than competing with account access.

# 2026-08-17 - Simplified equipment-card subtitles

- Removed vendor-provided machine-description subtitles and axis-count subtitles from every equipment card, leaving only the equipment category and make/model.

# 2026-08-17 - Standardized equipment positional-accuracy labels

- Renamed the expanded-card tolerance/accuracy metric to `Positional accuracy` across the equipment catalog.

# 2026-08-17 - Updated capabilities inspection imagery

- Replaced the inspection-ready production card image with a CMM inspection-laboratory scene and updated its descriptive alt text.

# 2026-08-17 - Reframed the workspace capabilities catalog with production proof

- Rebuilt `/capabilities` as a responsive workspace page: a split Fabrication capabilities hero, a compact real-production gallery, capability rows, and aggregate documented CNC capacity.
- Reused only the supplied, source-tracked factory imagery and kept supplier identities, exact facilities, availability, and job-fit claims out of the public presentation.
- Kept `/capabilities` inside the authenticated workspace shell, retained its resource navigation ribbon, and refreshed the public and workspace brand marks to the selected outlined Lattice symbol.
- Verification: focused capabilities test, TypeScript typecheck, clean diff check, and desktop browser visual QA against the selected reference.

# 2026-08-17 - Standardized the Lattice wordmark

- Added a reusable outlined four-diamond Lattice mark and compact uppercase `LATTICE` wordmark for the public header, waiting-list header, and authenticated workspace sidebar.
- Updated the workspace home button to use the same mark while preserving its destination and accessible label.

# 2026-08-17 - Simplified the workspace Capabilities hero

- Removed the duplicate Request access and How Lattice works hero actions because Capabilities is available only within the signed-in workspace.
- Retained the lower Discuss a job action as the page’s contextual next step.

# 2026-08-17 - Refreshed the Capabilities hero production image

- Replaced the hero image with the user-supplied Zintilon CNC machining-line photo and archived the source-tracked copy under `docs/vendor-sources/zintilon/factory-photos/`.

# 2026-08-17 - Clarified Capabilities coverage copy

- Reframed the process-coverage introduction around the available production paths and identified the CNC milling range as part of Lattice's equipment list.

# 2026-08-17 - Refreshed the Capabilities turning image

- Replaced the CNC turning row image with the supplied Jucheng CNC turning-operation photo, retaining the existing source-tracked archive.

# 2026-08-17 - Added visual proof for supporting processes

- Added the supplied Jucheng press-brake operation image to the Supporting processes capability row.

# 2026-08-17 - Made the Capabilities production gallery interactive

- Factory-image thumbnails now update the hero photo for the current visit while preserving the Zintilon CNC-line image as the default on every page load.

# 2026-08-17 - Simplified the Capabilities page ending

- Removed the documented-capacity callout, job CTA, and aggregate equipment-count metrics so the page ends after the capability coverage rows.

# 2026-08-17 - Refined the Lattice mark geometry

- Replaced the subdivided single-diamond mark with four individual diamond cells so the brand reads as a lattice rather than a cross.

# 2026-08-17 - Collapsed the quality documentation contents rail

- Replaced the fixed-width desktop table of contents with the compact right-edge tab used on How Lattice works; it expands on hover or keyboard focus while keeping every documentation anchor available.
# 2026-08-17 - Removed redundant material-family request CTA

- Removed the per-material `Request {material} parts` button from material family pages so signed-in customers use the shared workspace `Request Quote` action instead.
# 2026-08-17 - Aligned material pages with the workspace canvas

- Removed material-page background overrides from the catalog, family-guide, and inquiry templates so their canvas matches the authenticated workspace without a visible panel edge.
# 2026-08-17 - Simplified the materials catalog header

- Removed the duplicate `Request an unlisted material` CTA from the materials catalog; requests continue through the shared workspace quote action.

# 2026-08-17 - Added source-backed network scale to Capabilities

- Added a Capabilities row showing the combined public partner footprint: 590+ people and 42,000 m² of production space.
- Recorded the calculation and source caveats in `docs/vendor-sources/network-scale.md`; Zintilon's facility area is included, while its historical team-size claim is not presented as current staffing.

# 2026-08-17 - Added durable customer-company access

- Added Prisma workspace roles for the sole Lattice Admin plus Customer Admin and Customer Member users, with `User.companyId` membership.
- Changed customer RFQ, quote, order, invoice, and submitted-file authorization from exact requester-email checks to shared customer-company ownership; Lattice admins retain support access.
- Added `npm run onboard:lattice-admin` for the sole Lattice Admin and `npm run onboard:customer` to create the first customer company/admin or add a member to an existing customer company after the schema is applied.
- Updated Google SSO callback role selection to honor provisioned durable workspace roles.
- Suppliers remain internal/operator-managed for this phase; no supplier accounts or portal access are provisioned.
- Verified with Prisma generation, TypeScript typechecking, and focused authorization, auth, request-route, and persistence tests.

# 2026-08-17 - Hardened the Capabilities photo gallery

- Made each thumbnail selection explicitly remount the hero image and added a regression assertion for the selected image source, so the gallery reliably updates the enlarged photo while retaining the default image on load.

# 2026-08-17 - Added a second CNC-cell gallery image

- Added the supplied Jucheng CNC-cell image to the fourth Capabilities production-environment gallery tile.

# 2026-08-17 - Protected supplier identity in the equipment catalog

- Added a customer-copy boundary to `/equipment` that dynamically strips each record's supplier name and internal source-document title from visible table copy, expanded specifications, accessibility labels, and search terms.
- Added a regression test for the Tsugami Swiss turning record to prevent the Best Parts source reference from returning to the customer app.

# 2026-08-17 - Separated account-menu and settings interactions

- Replaced the clickable profile-card wrapper with an explicit Account Settings link beside an independent Account menu button, eliminating invalid nested interactive controls and making the Settings and Sign Out menu reliably available.

# 2026-08-17 - Simplified expanded equipment cards

- Removed the `Best for` and `Limitation` guidance row from all expanded equipment cards, keeping the disclosure focused on documented technical specifications and any model-specific source link.

# 2026-08-17 - Completed cross-surface application QC

- Ran typecheck, lint, all 305 automated tests, the production build, and the dead-code check.
- Smoke-tested public, customer, resource, account, and admin routes in the in-app browser, including desktop/mobile layouts, equipment filtering, quote detail, draft resume, route guards, and the Capabilities gallery.
- Documented reproducible hydration failures, accessibility gaps, production-integration blockers, maintenance warnings, evidence screenshots, and prioritized acceptance criteria in `docs/qc-report-2026-08-17.md`.

## 2026-08-17 — Matched capability-row icons to their content

- Replaced the generic capability-row symbols with content-specific icons for multi-axis milling, rotational turning, supporting tools, inspection scanning, and manufacturing-network scale.
- Added regression coverage for the five capability-to-icon mappings.

## 2026-08-17 — Clarified Capabilities production-gallery copy

- Reframed the production-environments introduction so the gallery explicitly presents the facility, equipment, and inspection infrastructure Lattice can use to support a customer’s production work.

## 2026-08-17 — Rebuilt the customer roadmap as a simple wiki

- Replaced the dashboard-like filters, metrics, card grid, and priority sidebar with a restrained Now / Next / Later visual and concise Soon/Later document rows.
- Kept the existing server-backed customer-interest controls, now attached to each upcoming roadmap row.
- Removed aggregate customer-interest counts from the roadmap rows while retaining individual interest controls.

## 2026-08-17 — Withheld the customer roadmap

- Removed the Lattice OS Roadmap item from the customer sidebar and blocked customer-role access to `/roadmap`.
- Kept the route, roadmap data, interest storage, and admin access in place for a future reintroduction.
# 2026-08-17 — Equipment catalog comparison redesign

- Replaced the active `/equipment` image-led card catalog with an image-independent comparison table that prioritizes make/model, available sets, positional accuracy (X/Y/Z), work envelope, and an expandable source-backed specification view.
- Added process and make/model search while preserving each record's existing image path, image source, and verification classification in `vendorEquipment` for future use.
- Archived the prior card-first implementation in `ArchivedEquipmentCardCatalog` so it can be reconsidered without losing the working interaction and layout.
- Updated equipment feature documentation and focused catalog tests for the new comparison workflow.
- Removed controller and photo columns (and their dependent photo-status UI) to keep the active table focused on model, sets, positional accuracy, work envelope, and specifications; header and row tracks now share the same grid definition.
- Made the specifications action a shared fixed-width grid track, so the blank header cell and row-level action cannot produce divergent table-column boundaries.
- Normalized expanded legacy equipment labels to `Work envelope` and `Positional accuracy (X/Y/Z)`, retaining the existing common-X/Y/Z value disclosure whenever the source gives one accuracy figure rather than separate axes.
- Simplified the catalog-table accuracy cells to the source's numeric value and unit only; the X/Y/Z context now lives in the column label and expanded specification detail.
- Restored customer equipment-type filtering alongside process and make/model search, covering axis counts, turning variants, CMM, Wire EDM, laser cutting, and press-brake capacity.
- Replaced the equipment-type dropdown with the prior catalog's direct-select filter pills, including active-state and pressed-state semantics.
- Replaced the pill cloud with the selected compact Equipment type rail: direct text controls retain the model-count context, use an unambiguous active underline, and scroll horizontally rather than wrapping into a second row.
- Consolidated the 3-, 4-, and 5-axis filter controls into one `CNC Mill` control so the rail reads by equipment family rather than axis-count fragments.
- Renamed the CMM filter to `QC equipment` and made it include the complete QC & Inspection equipment category.
- Consolidated Laser cutting and Press brake into a `Sheet metal fabrication` filter that includes every Sheet Metal equipment record.
- Consolidated CNC lathe, Swiss-type, and turn-mill capacity under a single `Lathes` filter; removed the customer-facing Wire EDM filter from the rail.
- Added a `Manual equipment` filter for the complete Manual Machines category.
- Filled the missing HT710 CNC Mill positional-accuracy field with the exact X/Y/Z specification published by Han's Laser (`±0.005 / ±0.005 / ±0.005 mm per 300 mm`) and linked that source at the record level. The remaining unnamed or ambiguous Best Prototypes rows stay blank because neither the source PDF nor an exact-model manufacturer reference publishes a defensible value.
- Filled the four missing named Shuofang lathe work-envelope values from the Zintilon equipment source: SZ-325F1 (`Dia. 32 mm`), SZ-255E1 (`Dia. 25 mm`), SZ-206F (`Dia. 20 mm`), and SC-46YD (`Dia. 45 mm`). Generic Best Prototypes and Best Parts lathe rows remain blank because their source lists do not identify an exact model or envelope.
- Simplified the isolated Manual equipment table to show only make/model, sets, and specifications; positional-accuracy and work-envelope columns remain available for production-capacity categories.
- Applied the same simplified make/model, sets, and specifications table to isolated QC equipment.
- Fixed the `CNC Mill` equipment-type filter so it is scoped to the CNC Milling category and excludes axis-counted Swiss-type lathes.
- Gave every grouped table in the all-equipment view its own category-appropriate header and row schema, rather than applying one shared set of columns across unrelated equipment types.
- Tightened the QC equipment table's three-column spacing and row density so long instrument names, set counts, and specification actions scan cleanly without large empty gaps.
- Simplified the Sheet Metal table to the same make/model, sets, and specifications schema, temporarily hiding positional-accuracy and work-envelope columns while preserving those documented fields in each expandable specification view.
- Removed the equipment-type rail's accidental vertical scrollbar, tightened its item spacing, and retained horizontal overflow only for narrow viewports.
- Narrowed the customer Sheet Metal table to the eight vendor-documented laser-cutting and bending machines. Oil-press and riveting records remain in the source dataset for a later reintroduction, but are no longer counted or shown in customer filters.
- Renamed the customer-facing type label for the four bending machines to `Press brake`, while retaining the vendor source terminology in the equipment provenance.
- Added the documented equipment specification summary to every expanded equipment row, alongside model-specific technical details and calibration information.
- Removed calibration cycles, dates, and related detail from all customer-facing equipment disclosures; those source-record fields remain retained in the underlying dataset.
- Audited customer routes and shared customer components for supplier disclosure. Expanded equipment specifications now redact supplier identities (including Best Parts, Best Prototypes, and Zintilon) while preserving internal source records and admin data. Renamed the remaining customer-facing factory-photo URL to a neutral asset name.
- Removed duplicate capacity fields from expanded CNC comparison rows: positional accuracy and work envelope remain in the primary table, while the disclosure now shows only supplemental specifications. Compact table schemas retain those fields in their disclosures.
- Simplified redacted equipment summaries to direct descriptions without redundant references to the Lattice manufacturing network.

## 2026-08-17 — Made buyer draft routes hydration-safe

- Deferred browser-local RFQ draft, quote-draft, and deleted-quote reads until after hydration so `/requests/new` and `/quotes` have deterministic initial server and client renders.
- Preserved local draft restoration, continuation lists, and discard behavior after the client mounts. The legacy `/simple-quote` source has been retired and has no active route component to update.

## 2026-08-17 — Applied local company-access schema and provisioned Lattice Admin

- Applied the current Prisma schema to the local `lattice_os` PostgreSQL database, including durable customer-company memberships and workspace roles.
- Provisioned `William Paik <will@latticeos.co>` as the sole `LATTICE_ADMIN` account.
- Deferred the first Greno Industries Customer Admin account until its email address is confirmed. Production schema deployment remains a separate, explicitly targeted rollout.

## 2026-08-17 — Provisioned the first customer company

- Created Greno Industries in the local PostgreSQL workspace with `Carmen Pascuito Jr <cpascuito@grenoindustries.com>` as its `CUSTOMER_ADMIN`.
- Customer users provisioned under Greno Industries now share access to that company's RFQs, quotes, orders, and submitted files; supplier access remains operator-only.

## 2026-08-17 — Added authenticated workflow regression coverage

- Added a focused `npm run test:auth-workflows` suite covering company-scoped RFQ submission, checkout/order conversion, direct-URL ownership, local submitted-file authorization, route authorization, and operator-only supplier actions.
- Updated affected dashboard, notifications, request API, and How It Works fixtures to reflect company-scoped visibility and current documented capacity values. Development dashboard scenarios retain their intentionally local fixture behavior; production data remains company-scoped.
- Refreshed the QC plan and feature map to document company-scoped ownership rather than the superseded exact-email rule. The suite uses mocked storage, payment, and document-byte boundaries; live Stripe, R2/S3, Resend, and browser-automation validation remain separate production-integration work.

## 2026-08-18 — Re-ran application QC after side-task fixes

- Verified the side-task hydration, account accessibility, company-access, equipment-filter, QC-table, and dead-code changes in source and focused tests.
- Re-ran typecheck, lint, the full test suite, auth-workflow tests, focused changed-area tests, the production build, and the dead-code check.
- Recorded the single remaining failing How It Works capacity snapshot, two archived equipment-code lint warnings, React test-update warnings, production-integration gates, and browser-evidence limits in `docs/qc-report-2026-08-18.md`.

## 2026-08-18 — Removed archived equipment catalog code

- Deleted the unused card-first equipment catalog, including its retired section navigation, filter state, image-row UI, and supporting helpers.
- Kept the active customer comparison catalog unchanged and restored a clean lint run by removing the archived code's unstable `useMemo` dependency and unused component warning.

## 2026-08-18 — Applied staging Neon schema

- Verified the separate `lattice-staging` Neon project and applied the current Prisma schema to its `neondb` database through the staging connection only.
- Production was not targeted or changed.

## 2026-08-18 — Stabilized React test environment

- Configured the Vitest setup globally for React `act` support so component tests do not emit environment warnings when flushing updates.

## 2026-08-18 — Simplified the admin customer profile

- Converted Business details fields on `/admin/customers/[companyId]` to a single label-and-input row layout on desktop, with a compact stacked layout on smaller screens.
- Removed the Overseas fabrication shops card from the customer profile view and added regression coverage for both changes.
- Replaced the desktop two-column profile layout with stacked full-width Business details and Business users rows, and removed the summary metrics strip and header status/tier badge.
- Reordered the profile so Access management appears before Business details, and made the Business details form a collapsed-on-load disclosure toggle.

## 2026-08-18 — Enforced administrator-issued temporary password changes

- Added `mustChangePassword` and `temporaryPasswordExpiresAt` to `User`. New or reset administrator-issued passwords expire after 72 hours and direct password and Google sign-ins to `/account/set-password`.
- Blocked normal workspace server access and proxy navigation while the forced change remains active; the completion route validates the requirement/expiry, saves the new salted credentials, records `TEMPORARY_PASSWORD_CHANGED`, refreshes the signed session, and clears the lockout.
- User-chosen recovery-link and administrator-defined custom passwords clear the forced-change state.
- Verification: Prisma client generation, local schema push, typecheck, focused auth/customer-access tests, lint, and diff validation passed.

## 2026-08-18 — Added verified customer email changes

- Added pending user email state plus hashed, single-use `EmailVerificationToken` records that expire after 24 hours.
- Lattice Admin can request a customer-email change from the company user-management view. The current email remains the sign-in identity until the new inbox confirms its link; confirmation changes the email, clears the pending state, invalidates old sessions, writes audit events, and sends a security notice to the former address.
- Reuses Resend when configured and writes a local development outbox when it is not.

## 2026-08-18 — Added Lattice Admin customer support view

- Added an explicit Admin-only `View customer workspace` action for provisioned users. It replaces the current browser session with a signed, company-scoped customer support session while retaining the original admin identity only for the exit path.
- Customer support view carries a persistent sidebar notice and an `Exit to admin` action that restores the Lattice Admin session; it is intentionally not a per-tab multi-login mechanism.
- Verification: typecheck, focused authentication/customer-management tests, lint, production build, and diff validation passed. The broader app-shell test file has four pre-existing failures caused by its uncommitted session-user/navigation expectation changes; those changes were preserved.
# 2026-08-18 - Clerk Development Integration

- Linked the existing Lattice Next.js project to the Clerk development application and installed `@clerk/nextjs`.
- Added Clerk provider, sign-in/sign-up routes, Clerk middleware, and the required Next.js proxy matcher.
- Reworked Lattice session hydration to authenticate through Clerk and link the Clerk user ID to an existing provisioned Prisma user on first verified sign-in; unprovisioned Clerk identities receive no Lattice workspace session.
- Preserved Lattice-owned company and role authorization, and added server layouts that keep `/admin` limited to the Prisma Lattice Admin role and `/supplier` limited to supplier roles.
- Added `User.clerkUserId`; customer add/reset/custom-password/forced-temporary-password operations now synchronize passwords with Clerk.
- Deferred production cutover until the schema is applied, the Clerk Production instance is configured, and its production keys are added to Vercel.

# 2026-08-18 - Prepared safe Clerk user migration

- Added `npm run migrate:clerk-users`, an idempotent operator script that matches existing Prisma users to Clerk Production users by email, sets the immutable Lattice user ID as Clerk's external ID, and writes the returned Clerk ID back to `User.clerkUserId`.
- The script requires an explicit Production environment file and `--confirm`; without it, it only reports the planned create/link operations. It never prints credentials or old password hashes.
- Existing password hashes remain intentionally non-transferable. Migrated users sign in with a matching Google account or use Clerk's recovery flow to choose a new password.

## 2026-08-18 — Added deployment-gated production migration runner

- Added a Vercel-only build runner that does nothing unless `LATTICE_RUN_CLERK_USER_MIGRATION=true` is set explicitly in the Production environment.
- When enabled, it applies the Prisma schema and runs the idempotent Clerk user migration using Vercel's own Production database and Clerk credentials; it refuses local/non-production execution and requires an `sk_live_` key.
- The flag must be removed immediately after the successful one-time deployment so future deployments cannot migrate newly created database users implicitly.

## 2026-08-18 — Added migration duplicate preflight

- The Vercel-only runner now checks the exact identity columns behind Prisma's additive unique-constraint warning (`Company.customerId`, `User.clerkUserId`, and `User.pendingEmail`) before applying the schema.
- It proceeds with Prisma's explicit additive-constraint confirmation only when all three duplicate checks return clean; any duplicate group stops the deployment before a schema or user-account change.
- Newly introduced columns that are not yet present in Production are treated as clean for the duplicate check; the subsequent Prisma schema step is responsible for adding them.

## 2026-08-18 — Repaired local Clerk test-account sign-in

- Applied the current Prisma schema to the local `lattice_os` development database, including the `User.clerkUserId` identity link.
- Created or linked the three existing local development identities in the Clerk development instance and issued replacement local-only passwords, because legacy password hashes cannot be transferred to Clerk.
- Verified that the Lattice Admin and both customer test users are now linked to Clerk. No production database or production Clerk account was changed.

## 2026-08-18 — Kept failed Clerk SSO callbacks in the login flow

- Replaced the single `/login` route with an optional catch-all login route so Clerk can render its `/login/sso-callback` path instead of letting it fall through to the authenticated workspace 404.

## 2026-08-18 — Synced Clerk display names into Lattice users

- Lattice now refreshes a linked, provisioned user’s display name from Clerk during session hydration, with safe fallbacks to the Clerk username or email prefix when a full name is unavailable.
- The dashboard now uses the signed-in Clerk display name immediately while a matching Lattice profile is not yet available.
- The global sidebar account card now uses the same Clerk identity fallback, including its email and initials.
- Account Settings now keeps its original Lattice design for a signed-in Clerk identity that has not yet been linked to a Lattice workspace record, storing that user’s settings under their Clerk identity.

## 2026-08-18 — Connected native account-name editing to Clerk

- The native Account Settings name form now updates the current Clerk identity through an authenticated server action, synchronizes a linked Lattice `User` record, and refreshes the account sidebar/dashboard identity.
- Stale browser-stored name and email values no longer override the server-provided authenticated identity after a page reload.

## 2026-08-18 — Added admin customer-company provisioning

- Added a Lattice Admin-only Create customer company workflow on `/admin/customers` that collects company details and the first Customer Admin, creates the Company and customer membership, then provisions the matching Clerk identity.
- The workflow displays a one-time temporary password for secure handoff, forces a personal password change within 72 hours, and compensates by removing the newly created Company/User/Clerk records if provisioning cannot complete.

## 2026-08-18 — Expanded the materials catalog at wide desktop sizes

- Removed the fixed catalog-width cap so the Materials heading and family grid fill the customer workspace, with a fourth column added only at the `2xl` breakpoint.

## 2026-08-18 — Made account settings identity metadata operational

- Replaced seeded account-created and email-verified dates with timestamps supplied by the signed-in Clerk identity. The email-verification date is read from Clerk's user payload because the server SDK exposes verification status but omits that timestamp.
- Removed historical card-checkout copy and the non-operational tax-exempt-reseller claim from the customer account screen. Checkout continues to default to a taxable order.
- Verification: TypeScript typecheck and focused Account Settings component tests passed.

## 2026-08-18 — Protected Clerk client-trust challenges from the workspace shell

- Updated the Proxy and Lattice session resolver to require Clerk's fully authenticated state rather than accepting a provisional user ID.
- Nested Clerk sign-in/sign-up challenge routes now render outside the Lattice workspace shell, so a client-trust prompt cannot show a prior account's navigation or profile.
- Verification: focused nested-login AppShell test, typecheck, and lint passed.

## 2026-08-18 — Resilient Clerk password-setup handoff

- Reworked the forced-password route to distinguish a signed-out session, an unprovisioned Clerk identity, an expired temporary password, and an account whose password is already set. Each state now has a customer-safe recovery screen instead of redirecting through a blank or ambiguous page.
- Kept first completed Clerk sign-in reconciliation with a pre-provisioned Lattice user (matched by verified primary email) in a shared resolver, including durable `clerkUserId` linking and profile-name synchronization.
- Rendered `/account/set-password` without the Lattice workspace shell, matching the isolation applied to Clerk’s nested login and verification screens.
- The ready-to-configure password screen now greets the authenticated, provisioned user by name, making the account-specific security context explicit before they enter a new password.
- Added focused password-setup and AppShell coverage. `npm run typecheck` and `npm run lint` pass. The broad AppShell test file retains four pre-existing failures caused by tests that omit the now-required session-user fixture.
