# Completed Work Log

## 2026-10-15 — Add model removal to the OpenCascade demo

- Added an admin-only demo control that clears the current CAD model, filename, geometry metrics, and conversion time so another local STEP/IGES file can be opened cleanly.
- Verification: targeted typecheck/lint and live viewer QA confirmed the remove-and-reload flow; deployed with the admin demo.

## 2026-10-15 — Add browser-based OpenCascade CAD viewer demo

Added `/admin/cad-viewer`, linked from the admin sidebar and gated through both the admin workspace and page-role authorization. The demo provides local STEP/STP and IGES/IGS selection, a synthetic 20 mm STEP cube, an OpenCascade WebAssembly import worker, and a Three.js viewer with fit/standard views/wireframe, orbit controls, triangle count, and millimeter bounding-box output. Files stay in the browser; the page does not read or attach RFQ data and does not call Autodesk. Runtime assets are copied from pinned `occt-import-js` 0.0.23 on install/build and its LGPL and OCCT license texts are linked in the UI. Targeted typecheck and lint passed; direct STEP importer check produced 1 mesh, 140 triangles and 20 × 20 × 20 mm bounds; local admin page loaded the sample and rendered controls. This remains a demo, not an APS viewer replacement.

## 2026-10-10 — Material dropdown design and UX review

Reviewed the live material dropdown in the in-app browser at `/requests/new`, including family browsing, searches for 304 and 6061, and no-results behavior; supplemented with source review. The selected material remained SS 304. Feedback: require an intentional material choice for new parts instead of silently defaulting SS 304; consolidate equivalent aliases into searchable canonical choices; retain distinct conditions such as T6/T651; reduce always-visible reference-code density; improve family access when reopening the menu auto-scrolls deep into an expanded group; add an unlisted-material recovery action; and label the search field/restore focus after Escape. The current typography, selected-value hierarchy, pinned search, and family grouping provide a strong base. Desktop review only; no application implementation or submitted RFQ changes.

## 2026-10-08 — Documentation cleanup

- Removed obsolete prototype audit and implementation-planning documents.
- Reworded the active project context, durable decisions, and historical work-log entries so the documentation describes Lattice OS directly.
- Left legacy-value compatibility code unchanged; it remains an implementation concern rather than product documentation.

## 2026-10-07

- Shortened the invitation header tagline to “Qualified manufacturing capacity” and updated the email expectation and onboarding docs. Recommended a shorter introduction for review; the current introduction remains unchanged. PDF creation and attachment wiring remain planned for later.
- Updated the invitation header to match the reference: removed the diamond icon and moved the LATTICE wordmark and right-aligned tagline inside the bordered email card. Updated the preview expectation and onboarding documentation.
- Added a thin divider and the requested one-page “How Lattice works” guide attachment sentence directly below the invitation CTA in both HTML and plain-text email. The PDF file and delivery attachment wiring remain outstanding and are called out in the feature map.
- Replaced the individual sender sign-off with “We’re excited to have you on board. The Lattice Team” in both email formats and the safe preview; updated the test expectations and operator docs.
- Restored the customer invitation CTA using a graphite button with white text and added the requested welcome closing. Updated the plain-text email, invitation tests, feature map, and onboarding playbook; the other removed guidance sections remain absent.
- Updated the customer invitation copy and layout per the requested template revision: use an invitation subject and concise Lattice capacity proposition, retain the sign-in email/optional temporary credential and signature, and remove the sign-in note, CTA, guide section, onboarding steps, and help sentence. Updated the invitation email expectations and feature map.
- Shortened the customer invitation introduction by about half while keeping Lattice's core offer explicit: connecting domestic shops to qualified global CNC and fabrication partners for overflow and out-of-capability work. Updated the corresponding copy expectation.
- Replaced the customer invitation email banner with the selected panoramic factory and shipping/receiving image, reducing the right-side warehouse scale while preserving the left-side warehouses and open yard.
- Rewrote the customer invitation introduction using the product description in the README, project context, and onboarding playbook. The new copy explains Lattice's managed global manufacturing capacity for domestic shop overflow without implying the invitee's company already uses Lattice. Updated the invitation HTML/text and playbook; added the ImageGen manufacturing-campus banner and product-focused header line to the email template.
- Fixed the customer invitation email HTML preview so conditional credential content renders instead of exposing raw template code. The email resource preview now shows the existing-sign-in invitation used when linking an established identity. Added an admin-only, non-submitting preview of the actual initial password setup screen at `/account/set-password?preview=1`; documented both preview surfaces in the feature map.
- Deployed the current local worktree to Vercel Production as `dpl_BvgER6v3j9A3nrti7P2e3FNXP4op`; Vercel reports Ready and aliased it to `https://latticeos.co`. The remote production build compiled, passed TypeScript/build generation, and skipped the one-time Clerk migration; no schema changes were required. Added `tmp/` and `design-exports/` to `.vercelignore` so local audit material and design exports are not uploaded. This deploy came from uncommitted local work; the changes are not yet committed or pushed to GitHub.
- Added a safe customer-provisioning path for linking an exact, verified existing Clerk identity without changing its password. The invitation now explains how to sign in with the existing method; its resend action sends those instructions again without issuing or changing a password. Updated the onboarding playbook, feature map, and durable decision record.
- Verification: TypeScript typecheck and `git diff --check` passed.
- Provisioned the requested Lattice Screenshot Test company and linked its Customer Admin to the existing verified Clerk identity; confirmed the local user has no generated password hash and no temporary-password expiry. The invitation was recorded as failed because local `.env.local` has no `RESEND_API_KEY`; no email was sent. The customer profile is open in the browser.
- Mapped Path 2 (direct Lattice Admin invitation) as a seven-step customer journey, documenting the visible surfaces, access rules, current behavior, and remaining release validation. Corrected the playbook's stale statement that invitation delivery was not yet built.
- Verification: `git diff --check` passed.
- Improved the guided address onboarding step: after a Customer Admin saves shipping details, the billing form now preserves existing billing values and fills blank fields from the saved shipping address for customer review. Updated the onboarding playbook, app feature map, project context, and priorities to reflect the current behavior and remaining address-autocomplete work.
- Verification: `git diff --check` and `npm run typecheck` passed.

## 2026-08-21

- Replaced the first-login address task embedded at the bottom of Account Settings with a focused shipping-then-billing modal. The provisioned Customer Admin can now choose `Skip for now`; a nullable Company timestamp persists that shared deferral, permits dashboard access, and still allows that Customer Admin to complete incomplete addresses later through Account Settings. Applied the nullable `Company.addressOnboardingDeferredAt` schema change to Production. Reset only the shared shipping/billing address fields and onboarding deferral for the controlled `willclawpaik@gmail.com` test company; no RFQs, password, invitation, billing-contact, or company data was changed. Verification: 11 focused tests, TypeScript, ESLint, and a Production build pass locally; deployed to Vercel Production at `latticeos.co` (deployment `dpl_9so3kgkCdteSneTib6Cu5zeypUos`).
- Fixed the first-customer address-onboarding production error. The server now lets only the provisioned Customer Admin complete an incomplete shipping/billing setup, including Lattice-prefilled company values, while preserving Lattice Admin-only control after both addresses are complete and for company-name changes. Fixed the forced-password handoff to preserve the active Clerk browser session instead of using a retired Lattice cookie or revoking the active session. Added Guided Address Onboarding and Autocomplete to the product pipeline for dedicated shipping/billing steps, review/confirmation, and provider-backed suggestions. Verification: focused account/password tests, TypeScript, ESLint, and a Production build pass locally; deployed to Vercel Production at `latticeos.co` (deployment `dpl_G27H99HAsxJe4ry7GELeyyit3G13`).
- Verified that all four private R2/S3 variables are configured in Vercel Production. Confirmed the corrected Production Neon connection is valid and that the deployed database already contains the complete `CustomerInvitation` enum, table, columns, and indexes; no schema mutation was necessary. Redeployed the current Ready Production build so `latticeos.co` now runs with the corrected `DATABASE_URL`.
- Deferred in-app card payment from the first customer cohort and added Production Card Payments to the product pipeline. The future work covers live Stripe configuration, webhook reconciliation, and controlled payment/refund-or-void validation before deliberate customer enablement.
- Implemented the first-cohort invitation delivery workflow. Lattice Admin provisioning and customer-user addition now send the approved branded Resend invitation after Company/User/Clerk creation; successful server actions return delivery status rather than the plaintext password. Added the Admin-only issue-new-password-and-resend control, which replaces the Clerk/Lattice password, revokes prior invitation records, and sends a fresh email.
- Added the `CustomerInvitation` Prisma audit model for recipient, user/company ownership, expiry, Resend provider ID, sent/failed/revoked timestamps, and safe failure category. It intentionally has no password or rendered-email field. Added unit coverage for sent, missing-configuration, and rejected-recipient outcomes, and corrected Vitest path aliases for workspaces whose paths contain spaces. Verification: focused invitation, local-storage, route, and login tests (13 tests), TypeScript, and ESLint pass.

## 2026-08-20

- Added Cloudflare R2 production file storage via the S3-compatible API. CAD, drawing, supplier-quote, and customer-PO uploads now use the private `S3_BUCKET` in production, while local development continues using gitignored `.data/uploads`. Existing app-level file authorization remains in front of every download; the bucket is never exposed publicly. Production fails closed if its required R2 variables are absent. Verification: TypeScript typecheck and focused local-file storage tests passed.
- Created a Neon Production recovery branch, then compared the live direct Production database connection against `prisma/schema.prisma` with Prisma's read-only schema diff. It reported no difference, so no production schema mutation was needed or performed.
- Updated the customer-invitation template with the approved welcome copy and a secondary `See how Lattice works` link to the public service explainer, while retaining login as the single primary CTA.
- Linked the local repository to the Lattice OS Clerk Development instance, pulled its ignored local Clerk credentials into `.env.local`, and restarted the customer-mode development server. Clerk diagnostics pass and a clean local browser now renders the intended Clerk sign-in form instead of the unclaimed keyless-instance prompt.
- Added the OIDC `select_account` prompt to Clerk’s Google sign-in flow, preventing silent reuse of an unintended Google account and allowing the user to select the provisioned development Lattice Admin identity. Type checking passes; the focused Vitest run is currently blocked by an existing unresolved `@/components/public-entry` alias in the test runner.
- Added the approved first-cohort customer-invitation HTML/text template and a Lattice Admin-only safe preview at `/admin/resources/customer-invitation-email`. The preview uses sample credentials and cannot send email; automatic provisioning delivery remains deliberately separate.
- Verified the Resend sender domain by delivering a smoke-test message from `Lattice OS <support@latticeos.co>` to the support inbox. Confirmed Vercel has `RESEND_API_KEY` in Production and Preview and the four email-related runtime variables in Production: `RESEND_API_KEY`, `WAITLIST_EMAIL_FROM`, `WAITLIST_EMAIL_APP_NAME`, and `APP_BASE_URL`. A fresh Production deployment is still required before recently added variables can be read by the deployed app.
- Expanded the first-customer playbook with the concrete invitation implementation sequence, selected `willclawpaik@gmail.com` as the controlled end-to-end test inbox, and separated durable object-storage, production identity/database access, and card-payment release work into explicit setup and validation steps.

## 2026-08-19

- Recorded the approved initial invitation policy: `Lattice OS <support@latticeos.co>` sender/reply-to, `Your Lattice OS account is ready` subject, reply-only help, William Paik as first-cohort support owner with a typical 1–8-hour response window, and a clear shipping-then-billing address gate before the dashboard. Resend domain/API setup and pilot inboxes remain the external prerequisites.
- Repaired the local Account Settings runtime by regenerating the missing Prisma client, configuring the separate `lattice-development` Neon database through ignored `.env.local`, applying the current schema to that new development database, and restarting the customer-mode server. Browser verification confirms `/account/settings?onboarding=addresses` now renders the shipping/billing setup instead of the Prisma runtime error.
- Added the invitation-workflow operationalization plan to the first-customer playbook: target experience, phased delivery work, completion criteria, and the explicit decisions/actions required from William for Resend, sender/copy, support coverage, scheduling, address timing, and pilot recipients.
- Updated the first-cohort onboarding policy to send the sign-in email and one-time temporary password together in the branded invitation, as an explicitly limited-risk choice for empty new workspaces. Preserved the 72-hour expiry, forced password change, no-plaintext-retention requirement, and later activation-link hardening path.
- Refined the first-customer onboarding playbook with the proposed branded `support@latticeos.co` invitation and activation journey. Recorded the security recommendation to use an expiring activation link (or a separately handed-off temporary password until then), clarified RFQ versus quote terminology, documented the current pre-workspace address gate and a safer first-RFQ confirmation alternative, and added the invitation/scheduling-link work to the roadmap.
- Added a founder-led first-customer onboarding playbook for a two-wave cohort of ten domestic machine shops. It covers Amogy relationship/conflict boundaries, production release gates, qualification, Lattice Admin provisioning, live first-login/address setup, concierge first RFQ, order updates, cohort cadence, scorecard, and outreach/checklist templates.
- Hardened Account Settings identity status against Clerk API failures: the UI now distinguishes verified-at date, verified-without-date, not verified, and temporarily unavailable instead of presenting an empty timestamp as verified. Added a production Stripe saved-card setup guard that avoids creating a Checkout session with a localhost return URL when no canonical app URL is configured.
- Recorded the decision to make saved cards company-owned before launch, and added the future customer-roadmap item for card-specific permissions, named-user/role assignment, and auditable access changes.
- Recorded initial account-control decisions: Lattice Admin-only membership management, optional MFA, no customer purchase orders, default-unavailable tax exemption, profile-photo upload with emoji fallback, and future Customer Admin team-management plus credit/PO roadmap items.
- Verification: focused Account Settings component tests and TypeScript type checking passed.
- Separated the static public-site root layout from the authenticated workspace layout. Public pages now avoid unnecessary Clerk/session lookups, while protected routes retain the same role-aware shell and password-change guard. The dual public/customer `/how-it-works` route remains request-aware by design.
- Added `How it works` to the authenticated customer sidebar. Signed-in users now see the existing `/how-it-works` explanation within the customer portal and can begin an RFQ from its closing action, while public visitors retain the standalone page.

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

## 2026-10-08

- Defined the customer invitation-to-workspace experience in `docs/customer-invitation-join-experience.md`, covering professional tone, the current first-cohort journey, screen and email copy direction, visual/interaction guidance, recovery states, phased delivery, and acceptance criteria.
- Updated `TODO.md` to use the experience brief as the implementation direction before controlled end-to-end invitation validation. No application behavior changed.

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

- Built the owned Lattice app foundation from early product research.
- Added the Next.js App Router app shell, RFQ creation route, operator request queue/detail, buyer quotes/orders, catalogs, placeholder analytics/projects, and API persistence skeleton.
- Added Prisma schema, Docker/Postgres development setup, request model/persistence/repository helpers, catalog data, RFQ option data, and initial Vitest coverage.
- Added product research notes and the initial owned-code implementation plan.
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

## 2026-08-19 — Hardened operational account settings

- Replaced account-settings placeholder password state with Clerk’s password-change flow, including current-password confirmation when applicable and Clerk re-verification guidance for Google-only accounts.
- Persisted account photo uploads in Clerk and emoji avatar choices in Clerk user metadata; the browser-only clipboard option remains unavailable.
- Connected account role, profile image, and company-management authority to the active Clerk/workspace identity. Established company defaults and company name are Lattice Admin-only, with an address-onboarding exception for a newly created company with no defaults.
- Removed customer-facing controls that implied unfinished saved-card, tax-exemption, purchase-order, and self-service team-management workflows. Account settings now states the company-wide card migration and future Customer Admin management work explicitly.
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
- Clerk now sends every completed sign-in to a bare server-side account check before resolving a workspace route, eliminating the customer-app flash for users who still need to set their initial password.
- Simplified the normal password-setup card by removing the redundant “Choose your password” heading; the personalized greeting and account-specific instruction remain, while recovery states retain their headings.
- Replaced the ambiguous temporary-password save failure with specific user-safe outcomes for expiry, password-policy validation, setup availability, and service failures. Failed setup attempts write only a category to the auth audit log; password values and raw Clerk errors are never persisted.
- Narrowed Clerk password-policy detection to Clerk's stable validation codes, so unrelated backend failures are no longer incorrectly shown as a password-length problem. Password-policy guidance now explains that Clerk can reject insecure or compromised passwords in addition to short passwords.
- Aligned every Lattice password form and server-side validation with the current Clerk policy: passwords require at least eight characters, subject to Clerk's compromised-password protection.
- Changed unauthenticated protected-route redirects to Lattice's `/login` route instead of Clerk's hosted `accounts.latticeos.co` sign-in domain, while retaining the requested internal path as redirect context.
- Copied the local Autodesk Platform Services credentials into Vercel Development, Preview, and Production, corrected quoted-value handling before use, and deployed production so live CAD translation can initialize.
- Added focused password-setup and AppShell coverage. `npm run typecheck` and `npm run lint` pass. The broad AppShell test file retains four pre-existing failures caused by tests that omit the now-required session-user fixture.

## 2026-08-18 — Removed blank RFQ submission transition

- Changed successful RFQ submission to replace `/requests/new` directly with the new quote-detail route, rather than clearing the live request-form state while client navigation was still pending.
- Verification: focused request-form tests and TypeScript typecheck passed.

## 2026-08-18 — Added new-customer address onboarding

- After an initial password is completed, new customer accounts now return through `/account/continue`, which sends users without complete shipping and billing addresses to the existing Account Settings address step before their customer workspace home.
- Address onboarding opens the shipping form first, pre-fills the billing form from the saved shipping destination, and then continues to `/dashboard` after billing is saved. The settings remain user-scoped; a future company-wide defaults policy can promote them when desired.
- Verification: focused request-form, continuation, password-setup, and Account Settings tests (45 total), TypeScript typecheck, lint, and diff validation passed.

## 2026-08-18 — Disabled customer team-member management

- Kept the Account Settings `Team account members` tab visible for product continuity, but rendered it greyed out and non-interactive so customers cannot access the unimplemented membership-management screen.
- The Lattice Admin remains the only role authorized to administer company membership.
- Verification: focused Account Settings tests, TypeScript typecheck, lint, and diff validation passed.

## 2026-08-19 — Synced in-review RFQ shipping changes

- The quote-detail shipping card had correctly rendered the RFQ's submission-time delivery snapshot, but its `Change` link previously edited only the saved account default. That made an address update appear to have no effect on the current RFQ.
- For `SUBMITTED`, `NEEDS_INFO`, and supplier-review RFQs, the address editor now saves the user default, securely updates the owned RFQ snapshot, and returns to the quote detail. Issued quote and order snapshots remain unchanged until checkout.
- Verification: TypeScript typecheck, focused quote-detail/account-settings/server-action tests (50 total), lint, and diff validation passed.

## 2026-08-19 — Filled incomplete quote shipping cards

- Quote details now fill a missing RFQ delivery snapshot from the signed-in customer's saved shipping address, so newly saved shipping details are visible even for a legacy/incomplete RFQ.
- The existing address-change flow remains the authoritative update path: saving from quote detail writes the full address to both the account default and the editable RFQ snapshot.
- Verification: TypeScript typecheck, focused quote-detail/account-settings/server-action tests (51 total), lint, and diff validation passed.
# 2026-08-19

- Moved customer shipping, billing-address, and billing-contact defaults from browser/local fallback behavior to database-only shared `Company` fields. Personal phone data remains user-scoped in `AccountDefaults`.
- Added the Account Settings note that shipping, billing, and billing-contact updates are shared with everyone at the company. Failed saves now leave the prior server values intact rather than appearing saved locally.
- Added a one-time legacy-default adoption path for otherwise empty companies, then clear the old user-scoped shared fields on later writes to avoid a second source of truth.
- Verification: focused Account Settings tests (18), ESLint on the changed settings files, and Prisma client generation passed.

- Made customer sign-in email addresses read-only in Account Settings for the initial release. Removed the customer `Manage email` editor and added an accessible Lattice support email-change request link; the Lattice Admin's verified email-change workflow remains the only supported change path.
- Removed clipboard-based profile-photo import from customer Account Settings; customers can still choose a file or an emoji/preset avatar.
- Recorded `support@latticeos.co` as the configured Google Workspace receiving alias for customer support and email-change requests. Automated application email remains pending Resend and verified sender-domain setup.
- Added company-wide account management and integrations to the planned product pipeline: a future Customer Admin workspace for company profile/defaults, team and role administration, invitations, shared operating settings, and approved integrations with auditable access.

## 2026-10-07 — Admin workspace redesign (option 1)

- Applied the approved graphite navigation, ivory canvas, and cobalt action palette to `/admin` using a route-scoped CSS module. Kept the official Lattice diamond mark and uppercase wordmark. Customer routes never mount the theme.
- Refined the admin sidebar, breadcrumbs, account card, tables, form focus states, and RFQ drawer styling across the existing admin surfaces.
- Added actual quote-operation counts to the admin home; moved customer drafts into an expandable section beneath the searchable, status-filtered RFQ queue. No persistence, authorization, or mutation behavior changed.
- Verification: TypeScript and focused ESLint passed; 34 existing shell/customer-management/order-management tests passed. Browser checks covered quote filtering, RFQ drawer, customer management, and navigation back into the unthemed customer dashboard.

## 2026-10-07 — Customer directory and company-profile design exploration

- Inspected the rendered `/admin/customers` directory and a company detail page, plus `Company`/`User` Prisma schemas, customer-profile projection, user-management controls, and RFQ/order history.
- Generated three paired directory/profile concepts with built-in imagegen: tabbed directory/profile, split workspace, and account overview. Saved all images, exact prompts, schema observations, and implementation constraints under `design-exports/admin-customers/`.
- Used fictional companies and contacts in concepts. Preserved Lattice Admin-only membership management as an implementation constraint and documented generated helper/status copy requiring correction. No application behavior or database changes were made.

## 2026-10-07 — Implemented customer design option 1

- Replaced the stacked customer-management page with a company-first directory, Companies/Waiting list tabs, and a focused company/first-admin provisioning dialog. Refined company row hierarchy and responsive cards; fixed Active filtering to exclude Inactive accounts.
- Added Overview/Users/RFQs & orders profile tabs, read-only business details with inline editing, compact business-user cards, and a chronological RFQ/order ledger linked to the existing record routes.
- Moved user role, password/invitation, verified-email, removal, and named-user support actions behind per-user menus and focused native dialogs with keyboard navigation, focus containment, and Escape dismissal. Kept all existing server authorization and persistence.
- Company saves now display inline feedback without a profile redirect. Controlled form fields retain edits after failures; successful provisioning exposes the profile link and prevents resubmitting the same created company. Existing logo and customer workspace retained.
- Verification: browser checks of desktop directory/overview, user action menu/editor, history tabs, waiting-list tab, and mobile profile/provisioning dialog. Focused component/shell/authorization regression tests, TypeScript, ESLint, and diff checks run during the session. No live membership, invitation-email, password, support-session, or company changes were submitted during browser checks.

## 2026-10-07 — Quote submissions schema and design exploration

- Inspected the live admin quote queue and RFQ response drawer, Prisma Request/part/file/supplier/customer-quote relations, queue status grouping, and issuance action behavior.
- Generated three schema-grounded concepts with built-in imagegen: contextual review queue, operational workflow board, and quotation preparation workbench. Saved all images, exact prompts, schema analysis, and implementation constraints in `design-exports/admin-quotes/`.
- Documented the distinction between supplier quote receipt and customer quote issuance, RFQ-scoped file/attachment relations, optional ownership/due dates, and the current single line-price snapshot workflow. Flagged generated status wording, logo, dates, and preview/version affordances requiring deliberate mapping before implementation.
- No application code, database data, customer workspace, or feature behavior changes were made.

## 2026-10-07 — Implemented quote review queue and quotation workbench

- Replaced coarse requested/received groups with an RFQ review table, Active/Drafts/Archive views, stage/owner filters, explicit operational labels, due/owner fields, package counts, and stored customer quote summaries. Added a contextual inspector for requirements, completeness, shared files, supplier responses/evidence, customer quotes, and status activity.
- Replaced the large quote modal with an inline preparation workbench, preserving supplier uploads, vendor selection, decision forms, quote field names, admin authorization, issuance and version persistence. Added compact commercial fields, reactive totals/lead time/validity, explicit billed-at-actual shipping display, quote-version history, pending submission feedback, numeric input constraints, and warnings for leaving unsent edits. Issued quotes remain read-only until explicit Edit quote.
- Removed positional CAD/drawing-to-part presentation: schema files and supplier attachments remain RFQ-scoped. Workbench URLs and supplier upload return URLs preserve the quote-preparation view. Retained the exact Lattice logo and customer workspace.
- TypeScript and focused ESLint passed. Captured the implemented queue/workbench previews. No automated tests requested or run, and no customer-facing quote/decision/upload mutation submitted.
# 2026-10-07 — Invitation attachment first draft

- Created `output/pdf/lattice-how-it-works-draft.pdf`, a one-page customer overview grounded in the live `/how-it-works` page and its source. Covers Lattice's role, qualified manufacturing capacity in China, four steps from RFQ to shipment, and a suitable first job.
- Used the official Lattice mark and a neutral graphite/ivory layout. Omitted the origin story, equipment catalogs, supplier certification lists, and account setup instructions to keep the invitation attachment focused.
- Added the reproducible ReportLab builder at `scripts/build-lattice-overview-pdf.py`. Confirmed a single page and inspected the final rendered PDF for readability and clipping. This draft is available for review; invitation delivery behavior is unchanged.

## 2026-10-07 — Rebuilt invitation one-pager

- Created `output/pdf/lattice-invitation-overview.pdf` as a fresh benefit-led invitation attachment: customer relationship, expanded quoting capabilities, variable capacity, supplier qualification, production workflow and a first-project invitation.
- Used the approved warehouse illustration unchanged, the official Lattice mark, and a new two-column editorial layout. Added a reproducible builder at `scripts/build-lattice-invitation-one-pager.py`; retained the initial draft for comparison.
- Verified one page and inspected the final rendered layout. No invitation sending or application behavior changed.

## 2026-10-07 — Invitation attachment horizontal journey

- Applied option 1 to `output/pdf/lattice-invitation-overview.pdf`: recreated the public page's flowing four-step line as vector artwork beneath the approved warehouse banner, with labels and explanations.
- Reduced banner height by cropping excess sky and moved customer benefits into three columns beneath the journey, followed by qualification and the first-project invitation. Updated the reproducible builder.
- Confirmed the PDF remains one page and visually inspected the final render for text clipping, spacing and alignment. No application or invitation delivery behavior changed.

## 2026-10-07 — Invitation one-pager annotated copy edits

- Removed the Manufacturing overview header label and applied all four process-copy revisions in the attachment and builder: upload files versus specify requirements, partner-provided quote, supplier coordination against the production plan, and pre-shipment inspection/material records for customer review.
- Confirmed the updated PDF remains one page and visually inspected the final render. No application behavior changed.

## 2026-10-07 — Partner capacity in invitation overview

- Updated the quote step to state that manufacturing partner quotes reflect project requirements and their capacity. Rebuilt the one-page PDF and visually checked text fit.

## 2026-10-07 — Invitation overview network statistics

- Added 335 documented CNC machines, 109 explicitly listed 5-axis CNC machines (subset), and 590+ supplier-reported people across partner companies to the invitation PDF. Recomputed equipment counts from the current normalized catalog and checked the partner company staffing pages against `docs/vendor-sources/network-scale.md`.
- Labeled the figures as partner-network scale, with job fit and availability confirmed per quote; avoided implying Lattice owns the equipment or employs the partner workforce. Retained one page, adjusted the header/banner footprint, and inspected the rendered layout. No application behavior changed.

## 2026-10-07 — Simplified invitation overview ending

- Removed the annotated qualification section and first-project invitation box from the PDF and its builder. Redistributed the freed space into a taller warehouse banner, larger workflow/benefit text, and more section spacing.
- Confirmed the removed copy is absent and the PDF remains one page; inspected the final rendered layout. No app or email delivery behavior changed.

## 2026-10-07 — Reordered invitation overview sections

- Swapped the network statistics and customer-benefits sections: benefits now follow the banner, followed by the four-step journey and network statistics at the bottom. Added a divider beneath the statistics and adjusted spacing.
- Rebuilt the PDF, confirmed one page, and visually inspected the final layout. No application behavior changed.

## 2026-10-07 — Removed capacity benefit from invitation overview

- Removed the annotated “Use capacity job by job” item and expanded the remaining two benefit columns across the page.
- Confirmed one page and visually inspected the rebuilt PDF.

## 2026-10-07 — Invitation PDF feedback refinements

- Clarified that the 109 listed 5-axis machines are included in the 335 CNC machine total; changed the quality step to invite review of inspection and material records against requirements before shipment.
- Rewrote the two benefits to use the available column space, and removed the general footnote while specifying supplier-reported partner personnel directly under the 590+ figure.
- Confirmed all revised text and one-page output, then inspected the final render.

## 2026-10-07 — Removed annotated sentence from invitation overview

- Removed “Lattice helps validate the production path for each project before you commit” from the expanded-capacity benefit, rebuilt the PDF, and confirmed the sentence is absent and the page remains one page.

## 2026-10-07 — Updated overflow benefit copy

- Replaced the customer-relationship benefit with the requested pipeline-full, reject-work/long-lead-times explanation and overflow routing statement. Confirmed one-page output and visually checked the updated copy.

## 2026-10-07 — Refined pipeline benefit copy

- Updated the pipeline-full benefit to the revised phrasing about rejecting work or bidding excessive lead times, then routing overflow through Lattice. Confirmed one-page PDF and visually inspected the rendered text.

## 2026-10-07 — Refined benefit wording and network-stat qualification

- Changed the pipeline benefit to “excessively long lead times” and qualified the 590+ personnel count as reported by two partners, preserving the existing three-column statistics row.
- Confirmed the updated copy and one-page render.

## 2026-10-07 — Removed phrase from pipeline benefit

- Removed “are forced to” from the full-pipeline sentence as marked, rebuilt the one-page PDF, and visually checked the updated copy.

## 2026-10-07 — Consolidated CNC network statistics

- Removed the standalone 109 5-axis statistic and added that figure to the 335 documented CNC machines caption. Rebalanced the network snapshot as two centered statistics: CNC equipment and partner-reported personnel.
- Confirmed one-page output and visually inspected the final layout.

## 2026-10-07 — Aligned network stats row

- Aligned the two network-stat columns with the left and right content guides used by the benefits section; checked the one-page render.
# 2026-10-07 — Attach overview PDF to customer invitations

- Saved the approved one-pager as `public/email/lattice-invitation-overview.pdf` for project use, retaining its editable source PDF under `output/pdf/`.
- Updated customer invitation delivery to include the PDF as a Base64 attachment in the Resend request, matching the email copy that tells invitees the guide is attached. Updated the operator feature map.
- Did not send a real invitation email. Controlled end-to-end delivery validation remains a separate release check.


## 2026-10-08 — Cross-computer project handoff

- Updated the README, project context, decisions, TODO, onboarding playbook, and feature map so the next agent can distinguish completed invitation-PDF work from the remaining controlled delivery check.
- Recorded the approved PDF asset path, editable output and builder, Resend attachment behavior, current admin customer/quote work, and the concrete post-deployment invitation validation.
- Added `/tmp/` to `.gitignore` so generated PDF QA scratch files stay local and are not included in the project push. Pushed the project updates to `origin/main` as commit `2c0ed03`; this push does not confirm a Vercel deployment.

## 2026-10-08 — Autodesk APS app ownership transfer

- Confirmed Autodesk completed the ownership transfer for the existing `Lattice CAD Preview` app in the `Lattice OS Dev` developer hub. The app now lists `will@latticeos.co` as Owner.
- Recorded the owner and transfer status in `docs/autodesk-aps-cad-preview.md`. The existing app and its credentials remain in use; APS variables are already configured in Vercel Development, Preview, and Production.
- Removed completed credential creation and Vercel configuration steps from the APS TODO. Upload translation and Autodesk Viewer smoke tests remain outstanding.
- Removed `paik.e.william@gmail.com` from the `Lattice OS Dev` APS hub. Verified Autodesk's success notice and that `will@latticeos.co` remains the sole listed Hub Admin. This action did not delete the personal Autodesk account.

## 2026-10-08 — Customer welcome and contextual tour research

- Researched Hark, Linear, Slack, and Superhuman using public product/help sources; visually inspected Hark public entry and Linear public demo. Recorded limits on inaccessible first-account sequences and video evidence.
- Added `docs/customer-onboarding-research-and-design.md` with the recommended optional four-stop tour, full journey and copy, motion/color specifications, mobile/accessibility/recovery behavior, feature tradeoffs, and measurable cohort criteria.
- Matched tour targets to the actual customer navigation and identified Help/replay as proposed new functionality. Updated the earlier brief, project context, and TODO to preserve the user's premium/refined direction and tour-completion endpoint.
- Documentation only; no application changes, invitations, deployments, or tests.

## 2026-10-08 — Interactive customer onboarding initial draft

- Built the full invitation, sign-in, password, shipping, billing, welcome, four-stop tour, and empty workspace sequence in the admin-only `/admin/resources/customer-onboarding` preview. Added an Admin Resources link.
- Added selectable storyboard stops, expanded view, sample new/existing identity variants, expired invitation guidance, local address review, skip/replay, reduced-motion CSS, and keyboard tour dismissal/focus. The simulated workspace uses current customer navigation plus proposed Help.
- Added a standalone Vite entry in `design-exports/customer-onboarding` using the same React component and scoped CSS, with generated assets under gitignored `outputs`. Live account/authentication, addresses, and durable tour progress are not connected.
- Verified TypeScript, targeted ESLint, standalone production build, and diff whitespace. Browser checks covered the full screen sequence, all four stops, finish/replay/Escape skip, and a 390px narrow layout. Corrected focus targeting, pointer alignment, and narrow tour positioning during review.
- Updated project context, TODO, feature map, and preview build instructions. No emails, customer mutations, or deployments were performed.

## 2026-10-08 — Restored local Lattice Admin sign-in configuration

- Diagnosed the false not-provisioned screen for `will@latticeos.co`: the Lattice OS 2 checkout had no `.env.local`, database URL, or Clerk keys and was running a temporary keyless instance.
- Restored the existing development database and Clerk Development configuration from the sibling local checkout into gitignored `.env.local`; restarted the local server on port 3000. No secrets were printed or committed.
- Verified through Prisma and the configured Clerk API that the existing admin membership is linked to the verified email and has completed password setup. The browser now renders the configured Lattice OS sign-in; the user must sign in again because the old temporary-instance session is no longer applicable. No credential reset or membership change was made.
- Added new-computer local sign-in configuration instructions to README.


## 2026-10-08 — Onboarding tour over the actual customer workspace

- Replaced the simplified workspace mock in preview steps 6–8 with the actual customer `AppShell` and shared `CustomerDashboardView`. Extracted the existing dashboard presentation without changing its live data/filtering contract; the onboarding frame supplies empty sample data.
- Added the admin-only `/customer-onboarding-workspace` frame outside the workspace route group so customer styles and responsive behavior remain independent of the surrounding admin interface. The four-stop tour measures and highlights the actual desktop/sidebar or mobile controls. Help remains a proposed, preview-only entry.
- Intercepted preview links and sign-out and disabled notification fetching/sidebar personalization to keep demo actions isolated. Skip, finish, and Help replay retain the same real workspace underneath.
- Updated the feature map, project context, priorities, and standalone README. Standalone review now requires the running local Next.js app and an authenticated admin for the embedded workspace.
- TypeScript and targeted ESLint checks pass. Browser inspection showed the actual empty dashboard, all four anchored desktop stops, finish/Help replay, and the compact tour at a 390px viewport. Standalone Vite build succeeds. No automated tests were run.


## 2026-10-08 — Refined onboarding transitions

- Added Motion presence transitions to the onboarding draft: setup content fades out over 180ms and reveals over 380ms with a 6px upward settle; the welcome/workspace arrival takes 500ms. Branding, story, form frame, and support remain steady between setup screens.
- Tour bubbles fade out over 150ms and reveal over 300ms with a 4px settle; highlights crossfade over 300ms. The underlying actual workspace stays mounted during welcome/tour/finish. Finishing or skipping fades the overlay away over 350ms.
- Outgoing content is inert/hidden from assistive technology, and incoming headings receive focus after reveal. Reduced-motion preferences set animation durations and transforms to zero.
- Updated the motion specification, feature map, and project context. The changes apply to the review draft and its standalone build; live onboarding persistence remains pending.
- TypeScript, targeted ESLint, and the standalone Vite build pass. Browser inspection confirmed setup/address changes, welcome arrival, tour-step changes, heading focus, and skip handoff. No automated tests were run.


## 2026-10-08 — Synchronized welcome arrival and cleaned popup corners

- Fixed step 6 revealing the welcome before the workspace loaded. The frame reports readiness after document load and font readiness; the entire workspace/welcome composition stays hidden and inert until ready, then shares one 500ms fade. Added a readiness refresh for re-entry and ignored outgoing-frame messages outside the workspace steps.
- Removed the artwork header’s independent corner radius and clipped it through the welcome card’s rounded boundary, eliminating the white edges caused by overlapping curves.
- Updated the motion specification, feature map, and project context. Browser inspection confirmed step 6 displays the loaded workspace with clean popup corners.
- TypeScript, targeted ESLint, and the standalone Vite build pass. No automated tests were run.


## 2026-10-08 — Onboarding address fields

- Added an optional Address 2 field beneath Street address in both shipping and billing, with a building/suite/office placeholder.
- Replaced State / region text inputs with matching native dropdowns containing all 50 US states alphabetically, storing postal abbreviations in local preview state. Shipping-to-billing copy includes Address 2 and state.
- Updated the feature map. These changes apply to the onboarding review draft; address persistence remains pending.
- TypeScript, targeted ESLint, and standalone Vite build pass. Browser inspection confirmed the new shipping fields and all 50 state options, plus the billing handoff. No automated tests were run.


## 2026-10-08 — Onboarding country dropdown

- Replaced country text inputs with dropdowns limited to United States and Canada in both shipping and billing.
- Region dropdowns show all 50 US states or Canada’s 13 provinces/territories and use the appropriate label. Changing country clears the prior region; shipping-to-billing copy preserves country and region.
- Updated the feature map; changes remain local to the onboarding review draft.
- TypeScript, targeted ESLint, and standalone Vite build pass. Browser inspection confirmed exactly two country choices and the Canadian region switch. No automated tests were run.

## 2026-10-08 — Customer experience audit

- Audited the local customer workspace through the existing Lattice Admin customer bridge, including dashboard/actions, notifications, RFQ draft/configuration/reorder, quote/checkout, order search/detail/help, quote and invoice downloads, materials, equipment, capabilities, quality guide, how-it-works, and account editor controls.
- Saved the feature matrix, reproduction details, prioritized development work, and explicit testing limits in `docs/audits/customer-experience-2026-10-08.md`. Updated TODO and linked the findings from the feature map; no application behavior was changed.
- Confirmed transient-only order-support success, inaccessible order/quality documents, expired-quote checkout, first-cohort purchasing policy mismatches, and truncated Action Center counts. Source review also identified role-only draft-file authorization, unscoped browser drafts, positional file/part association, and ignored checkout fields.
- Typecheck passes. Full suite: 315 passed / 14 failed across 75 files (72 passing, 3 failing). Lint: 9 errors / 1,183 warnings, including a helper misidentified as a Hook and generated onboarding output included in lint.
- The configured development database lacks `Company.addressOnboardingDeferredAt`, forcing demo fallback. Production customer-role behavior, real uploads/APS, database saves, mobile layout, invitation delivery, and payment operations were not validated; file selection and viewport emulation were limited by browser tooling. No real messages, payments, new orders, credentials, or migrations were performed.

## 2026-10-08 — Customer audit implementation and approved onboarding deployment

- Implemented the customer-approved defaults and annotation changes: optional RFQ quality approval, 15-weekday quote expiration, card-only policy and ownership/amount safeguards, durable checkout/compliance snapshots, shipment holds/document approval, support/clarification history, company-shared/private drafts with deletion markers, explicit file-to-part association, complete Action Center, stable order references and durable annual invoice snapshots. Lifecycle emails have a durable queue; admin retries are implemented; monitoring remains follow-up work.
- Integrated the approved real customer welcome and four-step tour with saved membership progress, interruption/resume and Help/replay; preserved Clerk/password/address setup. Admin and support sessions do not change customer onboarding progress.
- Repaired missing Development schema; independently reviewed Production diff and applied additions inside a transaction. Both final diffs are empty. No existing customer data was deleted.
- Authenticated Vercel CLI, confirmed lattice project/team, built a Production deployment, smoke-tested login 200 and unauthenticated draft denial 403, then promoted `dpl_C2ntGzvTWs3Fnx8r4RdiDPqpzH89` to latticeos.co. Public login 200 and domain deployment identity confirmed.
- Validation: 351/351 tests across 81 files, typecheck/lint/local production build/Vercel build pass. Eleven additional draft tests cover company isolation, invalid sessions/packages, concurrent deletion guards and stale-browser resurrection. Dead-code audit still reports an older unused login file, five exports and unlisted server-only imports.
- Separate checkout and implementation reports document remaining customer-role/mobile/upload/invitation/payment tests. Local browser confirmed RFQ checkbox and expired quote renewal message, and saved RFQ screenshot.
- Stripe connector is unconnected. Browser showed an unactivated New business live account and sandbox Tax Get started; Lattice Production uses a live publishable key whose ownership is not yet established. User business verification/attestations, correct account mapping, live tax registrations and controlled payment/refund tests remain necessary. Kept card checkout disabled; no charge, refund, registration or customer message was made.

- Stripe follow-up after user corrected Chrome profile: Nexus Manufacturing Technologies, Inc. has active Payments/Payouts and no active account tasks. Earlier New business activation warning came from the wrong profile and does not apply. Correct live Tax shows Get started; Tax configuration and runtime-key mapping/testing remain the blockers.

- Added admin-only lifecycle email retry, durable network-failure attempt/status recording and Customer Admin recipients for quality approvals; seven isolated tests pass. User confirms New York-only existing registration. Correct Stripe Tax setup has registration/automatic collection Not Started and a digital-services default needing an appropriate manufactured-goods override. No paid/tax-registration mutation performed.

- Fixed failed delivery to one approver preventing queue creation for the remaining company admins; added regression coverage. Stripe collecting-locations page became blank after navigation and one reload; no registration/paid-plan mutation was made. Original business-activation request is withdrawn for the correct Nexus profile.

- Final application release: pushed/fast-forwarded main to `d9ee924f223c66d1ba1799158b48fe9b10b8f99b`; Vercel Git Production deployment `dpl_B2YnUGqkNVau3QQBBBgkMj3yjk73` Ready and assigned latticeos.co/www.latticeos.co. Final public login 200 and unauthenticated draft API 403 verified. 351 tests pass; code, tests and memory are committed/pushed. Unrelated pre-existing APS doc changes and Bubble doc deletions were preserved unstaged. Temporary Production environment file removed after schema work.

## 2026-10-09 — Stripe tax setup and hosted checkout preparation

Connected the Stripe plugin to the confirmed Nexus live account. Recorded the user-confirmed New York registration, corrected the digital-services tax default to tangible goods with tax-exclusive pricing, and added delayed-payment success to the existing Lattice webhook subscription. Prepared Stripe-hosted automatic-tax checkout and trusted subtotal/shipping/tax reconciliation, including paid-tax order/invoice display, ownership checks, quote-version checks, optimistic database writes, and ignoring unrelated webhook events. Added admin-only merchant readiness diagnostics and expected account configuration. Purchasing stays disabled until genuine sandbox/runtime/webhook validation; no real card was charged. Sandbox connection instructions were provided using Stripe's session management link. Validation/deployment results are recorded below when complete.

Validation: typecheck and lint pass; 363/363 tests in 84 files pass. Local production build passed before final UI/diagnostic/test refinements; the Git Production deployment will validate the final source build. Added expected live Nexus account ID to Vercel Production as a non-secret Config value. Checkout-enable flag remains absent/false.

Final concurrency review: late failure/expiration webhooks now update only the matching still-quoted session, so they cannot mark a concurrently purchased order as failed.

Release verification (2026-10-09): final application source `4851469` is Production Ready as `dpl_7TVwe45FHTL286T1GkSrESYA49VA`, https://lattice-6tcmzecot-willpaikstacks-projects.vercel.app, aliased to latticeos.co. Build passed in 53 seconds. Login returns 200; unauthenticated configuration access returns 403; unsigned webhook POST returns 400 (Missing Stripe signature). Full suite passed 363 tests/84 files; after the late-failure concurrency fix, typecheck, targeted lint, and 10 affected payment/repository tests passed. An intermediate follow-up build failed on an unsupported wrapper method; the guarded single-record update corrected it before final deployment. Purchasing remains disabled; signed delivery, actual sandbox payments/refunds, runtime merchant verification under an admin session, and genuine customer/mobile verification remain outstanding.

## Test mode connection and tax checks — 2026-10-09

The user connected Nexus's existing shared Test mode environment. The plugin now lists the same account ID (`acct_1TcAE25pzNAaqmdk`) with separate `livemode=true` and `livemode=false` entries; every test operation used `livemode=false`. Test mode initially had active Tax settings but a digital-services default, no registrations and no webhook endpoints. Added test NY state-sales-tax registration `taxreg_1UOboy5pzNAaqmdkdnvpgcX4` and tangible-goods/tax-exclusive defaults.

Stripe API tax checks passed for $100 tangible goods plus $10 shipping: NY ZIP 10016 returned $9.76 tax, $119.76 total, with 8.875% standard-rated breakdown (`taxcalc_1UObpP5pzNAaqmdkltYBxDoQ`); PA ZIP 15222 returned $0 tax and $110 total with reason `not_collecting` (`taxcalc_1UObpQ5pzNAaqmdkazvkZxkd`). These are synthetic test-mode calculations, not live tax determinations or completed customer checkout tests. No charge/refund or customer record was created.

Local `.env.local` has no Stripe secret key, test publishable key, webhook secret or expected merchant ID configured. The user was asked to place only Nexus test credentials directly into that gitignored file, without sharing keys in chat. Actual app checkout/payment/refund/webhook tests remain blocked on those runtime credentials and a local test webhook. Plugin OAuth does not configure the app's SDK credentials. Live purchasing stays disabled.

## 2026-10-09 — Test credentials and first hosted payment audit

William entered Nexus test keys in VS Code but the buffer was unsaved and both Stripe assignments used an em dash instead of an equals sign. Saved the file and corrected only those separators without exposing key values. Authenticated the local SDK to expected account acct_1TcAE25pzNAaqmdk; payments enabled, Tax active, test NY registration active. Obtained a Stripe CLI signing secret into gitignored .env.local, enabled checkout locally only, and started a Test mode listener forwarding to localhost:3000/api/stripe/webhook. Actual signed Stripe fixture events and the application payment events received HTTP 200.

Using a synthetic quote stored exclusively in .data/mock/requests.json, hosted Checkout showed $100 parts + $10 shipping + $9.76 tax = $119.76. Declined card and failed 3DS displayed errors and did not purchase the quote; successful 3DS produced PAID/PURCHASED with the same amount and tax, returning to the order page. PaymentIntent pi_3UOczw5pzNAaqmdk1ESmhZPx, completed event evt_1UOd1E5pzNAaqmdkUAB46xWN. A full test refund re_3UOczw5pzNAaqmdk1IlZ0B7M succeeded for 11976 cents. No real charge or refund occurred.

Fixed healthy-development-database P2025 failures for local-only synthetic checkout/finalization while retaining real-record conflict guards; added regression coverage. Fixed retry replaying an expired Stripe idempotency session; added regression coverage. Replaced hard-coded customer order shipping address with the saved delivery snapshot and removed the fabricated billing-address row. Mock fixture invoice rendering now bypasses durable invoice issuance, as existing demo invoices do. Stripe displayed Link bank funding despite card payment types; disabled Link in Test mode default configuration pmc_1TcAEY5pzNAaqmdkIblE0bfn. Live Link settings remain to be reviewed before card-only launch.

Remaining: Stripe refund succeeds but Lattice does not yet sync/display refunded payment status or accounting adjustments; original paid order remains unchanged. Need develop full/partial refund reconciliation and its order/credit-note policy before live launch. Also pending signed Production delivery/admin merchant readiness, customer-role/mobile flows, app invoice verification, payment without return-page dependence, duplicate/late events, cancellation/concurrent quote/revision tests, and hosted UI recheck after disabling Link. Live purchasing remains disabled. Validation: 365 tests in 84 files, typecheck and targeted lint pass. Local test credentials/signing secret and synthetic data are gitignored; unrelated working-tree changes preserved.

Synthetic invoice preview verified after aligning the test fixture line-item quantity/unit price with its $100 quote subtotal: $100 subtotal, $10 shipping, $9.76 tax, $119.76 paid, $0 due, and the saved New York ship-to address. This mock PDF bypasses immutable database issuance; production invoice issuance/credit-note reconciliation remains to be validated. The fixture inherited DDU quote terms while checkout/order copy claims landed/DDP delivery; remove hard-coded import/duties claims or enforce the agreed supported quote terms before launch.

## 2026-10-09 — Refund reconciliation and final delivery terms

Added Stripe refund reconciliation against the order-owned PaymentIntent and Checkout Session. Current paginated Stripe refund objects determine successful, pending/requires-action, and failed totals; charge.refunded and refund.created/updated/failed refresh the ledger. Duplicate events are no-ops; a later bank failure can reverse a previously successful refund amount. Optimistic database conflicts retry instead of overwriting an order. The customer order shows refunded/partially refunded status and separate pending/failed amounts. Original captured payment, accepted order and immutable sale invoice remain unchanged; accounting credit notes and production cancellation are separate work.

Initial card checkout requires finalized DDP quote terms, enforced on the server and explained beside the disabled customer button. Existing DDU/DAP quotes are not rewritten. Orders display saved import terms and only claim included duties for DDP.

Actual synthetic Pennsylvania browser checkout: $100 parts + $10 shipping + $0 tax = $110; canceled checkout returned without an order, retry expired the old session and created a new one. Card 4242 succeeded. Signed Stripe payment and refund callbacks returned 200. Partial $50 and final $60 refunds displayed Partially refunded/$50 and Refunded/$110 in the customer order. PaymentIntent pi_3UOhaT5pzNAaqmdk0AgqH8q7; refunds re_3UOhaT5pzNAaqmdk0Bc1Q8lN and re_3UOhaT5pzNAaqmdk0cNHtCQl. All operations were Test mode with synthetic local-only fixtures. NY duplicate completed and late expiry replay checks preserved the purchased order without additional purchase events.

Disabled Link in live default payment configuration pmc_1TcAEY5pzNAaqmdkGy7NQpfe because its bank funding conflicts with the user-approved card-only release; verified Link off, cards on through the plugin. Test hosted checkout no longer offers Link bank funding. No real charge/refund was made. Live checkout remains disabled pending Production readiness/signed delivery and remaining customer-role/mobile, webhook-only, concurrency/revised-quote and accounting validation.

Validation: 370 tests/84 files passed after asynchronous refund handling, typecheck and targeted lint passed; subsequently added the refund-conflict regression and all 16 affected refund/repository tests passed. Previous production source 8fadcec is Ready and verified aliased to latticeos.co (dpl_Hy9269oxrZwNkRxdNA8zuSU4wYGX).

Production follow-through: source 33c4258 built successfully (dpl_Ga1TEQQZ8pQ5tcdFWVVM6YER9qiA). Signed in with the existing Google account as Lattice Admin. Production /api/stripe/configuration returned 503; merchant runtime credentials/permissions cannot yet be verified. Added allowlisted authentication/permission diagnostic codes and configuration-presence booleans, never Stripe error text or credential values. Live webhook we_1U6Clz5pzNAaqmdkeMK2TAvx now subscribes to charge.refunded and refund.created/updated/failed while retaining all existing events. Live purchasing remains disabled.

Production diagnosis confirmed under the authenticated admin browser: /api/stripe/configuration returns STRIPE_AUTHENTICATION_FAILED with secret/account/webhook variables present. Stripe rejects the deployed secret key; this is not the local test-key connection or missing NY registration. Source 075d653 is Ready (dpl_8hXKP7cvduwNCS67fTELwKyh34Qe), and the diagnostic is visible on latticeos.co. Opened secure Vercel project environment settings for William to replace Production STRIPE_SECRET_KEY with a valid live Nexus credential, without sharing it in chat. Remaining launch work cannot proceed past merchant verification until that credential is valid. Login 200, anonymous configuration 403 and unsigned webhook 400 remain correct. Final full suite: 372 tests/84 files pass; typecheck and targeted lint pass.

Additional read-only Production observation: the two existing Impeller RFQs in the operator queue display unavailable CAD/drawing references. This does not establish a failure of new uploads; inspect/recover those legacy attachment references and verify a fresh production upload before customer rollout. No customer record or file was changed.

## 2026-10-09 — Controlled customer onboarding rehearsal attempt

Opened the documented controlled test company/user (Apple / `willclawpaik@gmail.com`) in the authenticated Production admin workspace. The account is active and has no RFQs or orders. Started the admin Reset & resend invitation workflow; Production returned “Temporary password expiry is unavailable for this customer user,” and the profile continued to show the old password-issued date. The documented test mailbox was not present in the signed-in Chrome Google account list, so email delivery, attachment receipt, and credential state could not be verified. Because the reset request may have changed the Clerk password before delivery failed, treat the test identity as indeterminate and reconcile its Clerk/DB credential and invitation state before another login attempt. No address, RFQ, file, payment, or order data was created. Customer login, password change, address setup, RFQ/file durability and privacy, cross-company access, and reset/old-password rejection remain unproven; see TODO for the recovery sequence.

## 2026-10-09 — Invitation reset expiry repair

Confirmed the reset helper saved the rotated credential and new expiry, but returned the pre-update user object. Invitation delivery therefore rejected activated users with no old expiry or used a stale expiry on repeated resends. Changed the helper to return the persisted updated user row; no schema change is required. Added regression coverage for activated-user reset, refreshed resend expiry, preserved existing-sign-in credentials, and absence of plaintext passwords in the result. Validation: all 375 tests in 85 files passed, typecheck and targeted lint passed. The earlier failed controlled reset did rotate the credential before delivery was attempted; a fresh successful resend is required to recover that account. Production deployment and controlled receipt/customer activation follow-through are pending.

Release verified: application commit `e7d5db5` is Production Ready as `dpl_CT4gRUFN4kh38GwFQK9X2GZKdY1a` (`lattice-dxgg3odc1-willpaikstacks-projects.vercel.app`), aliased to `latticeos.co`; remote build passed in 58 seconds. The customer-access script passed 28 tests in five files. Production login returns 200 and the authenticated admin customer profile loads after release. Fresh profile confirms password setup is required and expiry is Oct 12, proving the prior reset persisted before delivery failed. Prepared the controlled account's reset/resend dialog for operator handoff: Computer Use requires the human to execute password-changing actions and personal-password entry. Mailbox receipt/PDF attachment and customer activation still require this credential handoff; all remaining customer workflow checks remain pending. Other working-tree changes were preserved.

## 2026-10-09 — Genuine customer onboarding and RFQ proof

Recovered the controlled Apple account through successful operator reset/resend, verified actual Gmail receipt and SHA-matching invitation PDF, then used the genuine customer Chrome profile after operator personal-password setup. The missing address prompt was explained by the reused company's saved deferral. Explicit shipping/billing onboarding completed with autofill, required-ZIP rejection and persisted synthetic addresses. Submitted clearly marked noncommercial RFQ LQ-CMV1KWIX (`cmv1kwix8000006jkor2qk48u`) with CAD/drawing fixtures. Customer CAD and operator drawing downloads match source bytes; operator queue contains the same submission. Anonymous files return 401 and the RFQ redirects to login. A verified second-company support scope receives 404/File not found for the Apple RFQ/files, then exited to admin. No orders, payments, quotes or supplier outreach were performed. Updated TODO, feature map and dated proof audit to distinguish passed checks from clean-account, old-password, redeploy, mobile/tour and recovery gaps. Identified customer drawing-download and checkout-availability-copy gaps. Preserved unrelated edits/deletions.

Follow-through: the old emailed temporary password was rejected in an isolated Incognito login after personal-password setup. Production deployment a14955e / `dpl_3ykgU6kKzJXdchfrQK2r9hdpjDje` became Ready and aliased to latticeos.co; both proof uploads downloaded afterward with matching SHA-256 bytes. Genuine customer Help/replay, welcome, all four steps, refresh/resume at step two and completion persistence passed. Saved final customer and resumed-tour screenshots locally; updated remaining checks to clean-account first-run, genuine second login, mobile/accessibility, skip and recovery.

## 2026-10-09 — First-customer launch readiness plan

Reviewed shared project memory, latest onboarding/payment evidence and checkout/storage/email source. Created a ten-task ranked launch plan with proposed owners, completion tests, release sequencing and deferrable work. Distinguished demonstrated Production RFQ/onboarding behavior from remaining database-backed purchase, live Stripe, accounting, customer isolation/mobile and operating gates. Identified that PO-reference/upload fields are unavailable in card checkout. Asked whether the first customer needs PO credit terms and requested customer/job/date context; these remain unresolved. Linked the plan from TODO. No app behavior, credentials, customer data, deployments or purchasing flags changed; no new runtime tests were run for this documentation assessment. Preserved pre-existing working-tree changes.

## 2026-10-09 — Launch scope and Tuesday schedule confirmed

Updated launch plan, TODO, decisions and project context with William’s confirmed card-paid PO reference and Tuesday, October 13 onboarding target. Replaced pending purchasing clarification with concrete PO-number persistence scope, suggested Fri–Tue work sequence and Monday go/no-go review. Customer/job details remain unknown; distinguish Tuesday purchase capability from the date of an actual supplier-backed order. No app behavior or deployment changed.

## 2026-10-09 — Production Stripe credential update attempt

In William (LATTICE) Chrome profile, confirmed the replacement `STRIPE_SECRET_KEY` was saved in Vercel for Production. Redeployed current main source as `dpl_D9wkovFTeL16Q5tfvj7cjyB7gqEb`; Vercel reports Ready/current and assigns latticeos.co. The authenticated production readiness endpoint changed from `STRIPE_AUTHENTICATION_FAILED` to `STRIPE_PERMISSION_DENIED`. This indicates Stripe accepted the credential but denied at least one API operation required by readiness. Live checkout remains disabled. Reopened the Production secret editor for William to enter a live Nexus standard secret key; secret was not read or copied. No payment, key exposure to application data, checkout enablement, or customer operation occurred.

## 2026-10-09 — Production Stripe credential verified

William updated the Vercel Production `STRIPE_SECRET_KEY`. Created Production redeploy `dpl_85f4PGEqBd1k1UdmzDmxFRC44d3o`; Vercel reported Ready and assigned `latticeos.co`. The authenticated redacted `/api/stripe/configuration` diagnostic now reports `ready: true`, with the expected Nexus account match, payments enabled, active Tax, NY registration, and webhook secret configured. No key value was viewed or copied. Checkout remains disabled; actual signed webhook delivery and remaining payment/launch checks are still required before enabling production checkout.

## 2026-10-09 — Production Stripe webhook inspection

Inspected the Nexus Live event destination in Stripe Workbench. `Lattice OS production payments` is active at `https://latticeos.co/api/stripe/webhook` and subscribes to the nine configured checkout/payment/refund event types. The Event deliveries view currently lists no deliveries, so the Production signing secret has not yet been proven by an actual Live event. Per Stripe’s docs, test and live endpoints use different signing secrets; a test event cannot establish Live signature verification. No event was resent, no Stripe settings changed, and no payment was created. Next safe proof is the first real subscribed event in the controlled initial customer purchase; otherwise William must explicitly authorize a controlled live charge/refund test.

## 2026-10-09 — PO-reference checkout implementation and Task 3 preparation

Added optional customer PO-reference capture to card checkout, with a 100-character limit and control-character rejection. The checkout server action saves it before redirect/payment confirmation, includes it in hosted Checkout or inline PaymentIntent metadata, and preserves it through webhook finalization. The order's existing PO display and immutable invoice snapshot/PDF now receive the reference; the legacy invoice-issue path also defaults to the saved order PO. PO credit, AP email, and PO-file checkout remain disabled. Lifecycle quote emails now build links from `APP_BASE_URL`/`NEXT_PUBLIC_APP_URL`, allowing local/preview tests to target the matching environment.

Confirmed the configured local Stripe key authenticates as Nexus Test mode (`livemode=false`) and the separate Neon development database is reachable with no companies, RFQs, or invoices. No synthetic records, emails, or payments have been created. Focused tests, typecheck, targeted lint, the full 379-test suite, and optimized build pass. The database-backed RFQ-to-paid-order rehearsal remains outstanding; local `RESEND_API_KEY` is absent, so the user-authorized test quote receipt could not yet be verified. Updated the Notion tracker and launch docs. Production checkout remains disabled; no Live Stripe calls or customer-contact actions were performed.

## 2026-10-10 — Resend credential and test delivery check

Confirmed `RESEND_API_KEY` is present and non-empty in local `.env.local` without printing or copying its value. Restarted the local Next.js instance in customer data mode so it loads the current environment; the signed-in operator workspace is reachable. Left the existing sample draft untouched. Sent one explicitly labeled test-only delivery email from `support@latticeos.co` to the admin address using a stable idempotency key; Resend accepted it (HTTP 200, message ID `01a12356-2258-77d9-ad81-a5e03f2210ec`). This confirms provider acceptance, not inbox receipt. Updated the Notion launch tracker and readiness note. No customer RFQ, quote, payment, or order was created; the database-backed Test-mode purchase rehearsal and receipt confirmation remain open. Production checkout remains disabled.

## 2026-10-10 — First-customer closeout and safety hardening

Added authenticated download links for customer technical drawings in both quote-detail layouts and changed Account Settings to show card availability only when the server-side hosted-checkout gate and Stripe credential are configured. Updated production error handling so RFQ and admin customer-profile reads fail closed when Prisma is unavailable rather than returning local fallback records; added regression coverage for both paths. Drafted `docs/first-customer-operations-runbook.md` covering quote release, payment reconciliation, supplier/quality holds, failed-email review, refunds/cancellations, and outage response, with William-owned policies identified for approval. Targeted tests passed (40 tests/4 files); full suite passed (382 tests/86 files), typecheck, ESLint, and optimized build passed. Local account-settings browser smoke rendered correctly with the local Test checkout gate enabled. The development Neon DB remains empty of companies, requests, orders and invoices, so no DB-backed customer purchase was run. Production Vercel environment inspection was denied (403 for current connector scope; Vercel CLI is not installed), so no environment values were read or changed. Production checkout remains disabled; no production deployment, Live payment, refund, or customer outreach was performed.

## 2026-10-10 — Materials usability and credibility design audit

Audited the local customer Materials atlas, Aluminum and Stainless guides, polymer behavior/directory, and unlisted-material inquiry, with desktop/mobile sampling and shared-template/data review. Confirmed condition selection changes values/citations; calculated authored reference-text contrast and identified featured/directory naming/rating divergence, an undiscoverable inquiry entry, large imagery ahead of working data, and dense mobile rows. Saved the evidence, prioritized recommendations, scope limitations, proposed information hierarchy, and decision status in `docs/audits/materials-design-2026-10-10.md`. Generated and visually reviewed three raster alternatives using built-in ImageGen: refined atlas, recommended technical catalog, and comparison workbench. Images and exact prompts are in `docs/audits/materials-design-2026-10-10/`; recorded generated-copy/logo/condition-control limitations. Updated TODO with the proposed review step. No design was approved, product behavior changed, inquiry submitted, test transaction performed, or deployment created; feature map and durable decisions remain unchanged. No application tests run for documentation/concept-only work.

## 2026-10-10 — Reversible Materials first-page redesign

Implemented William's selected concept A as `MaterialFamilyAtlas`, mounted only by the Materials overview. Added left-side existing texture swatches, concise family descriptions, current counts/grade examples, Explore family affordances, the unlisted-material entry, and availability/reference notes. Preserved the original component untouched for a two-line import/JSX rollback; documented restoration in the implementation note. Sidebar, family guides, datasets, and RFQ/inquiry forms were not edited. Updated overview test expectations and shared feature map, context, decision, and TODO notes. Six existing tests across overview/family/inquiry suites passed, targeted ESLint and typecheck passed, and desktop/mobile browser review confirmed the layout and inquiry navigation without form submission. Saved actual app screenshots. No deployment or customer-data mutation; unrelated existing workspace changes remain untouched.

## 2026-10-10 — Local customer Action Center, greeting, and navigation fixes

- Added explicit continuation copy/labels to Action Center rows and direct anchors for clarification, expired quote renewal, overdue order activity and quality-document review. Quality documents link back to the Customer Admin approval control; order activity links to saved Order help.
- Added customer quote-renewal requests using existing `CustomerSupportRequest` records (`QUOTE_RENEWAL`) and an RFQ link in the admin support queue. Expired quote detail/checkout routes explain renewal and hide acceptance. Saved waiting state survives refresh and hands dashboard ownership to Lattice; a valid reissued quote restores review. No schema change or outbound email was introduced.
- Added isolated admin demo renewal storage in `.data/mock/quote-renewals.json`. Browser-tested one LOCAL DEMO ONLY request, confirmed it in the admin queue, and confirmed the Home action moved to waiting on Lattice. Real database-backed customer renewal/reissue remains an integration follow-up.
- Dashboard now greets with the first name. Sidebar navigation no longer waits for the 320 ms exit animation; existing content stays visible while the server loads the next route. Added immediate pending feedback, a 160 ms nonblank reveal and reduced-motion behavior.
- Moved How it works into the shared `(workspace)` layout without changing its URL or public/customer presentations. Draft synchronization gates only draft-dependent screens and no longer replaces the shell or unrelated pages. Checked Home → How it works and back locally with the existing signed-in admin session.
- Verification: 396 tests across 89 files pass; typecheck, full lint, optimized production build, and diff whitespace check pass. Updated date-sensitive quote fixtures and the async retry assertion. Regenerated stale Next route types after moving the explainer route.
- Local screenshots: `output/qa/local-dashboard-actions-2026-10-10.png`, `output/qa/local-quote-renewal-2026-10-10.png`, and `output/qa/local-renewal-support-2026-10-10.png`. Updated project context, decisions, TODO and feature map. Changes remain local; no deployment, production schema/data changes or customer emails. Existing unrelated working-tree changes were preserved.

## 2026-10-10 — Restore requested fade-in and remove navigation bar

Restored the original 320 ms opacity-zero-to-one destination fade with its original easing, retaining immediate route requests and reduced-motion support. Removed the blue one-third-width loading indicator added in the preceding local fix. The prior page remains visible while navigation is pending, and How it works retains the shared workspace layout. Updated feature map, project context and decision record. Validation: AppShell regression tests and targeted ESLint/diff checks passed; local browser navigation showed no added bar while waiting for the next page. Local-only change, not deployed.

## 2026-10-10 — Try a 640 ms page fade

Changed the shared page fade-in from 320 ms to 640 ms at William’s request. Updated project context and feature map. Local-only timing change; no tests rerun.

## 2026-10-10 — Set page fade to 2 seconds

Changed the shared page fade-in from 640 ms to 2 seconds at William’s request. Updated project context and feature map. Local-only timing change; no tests rerun.

## 2026-10-10 — Set page fade to 1 second

Changed the shared page fade-in from 2 seconds to 1 second at William’s request. Updated project context and feature map. Local-only timing change; no tests rerun.

## 2026-10-10 — Quotes and Orders loading skeletons

Implemented the approved loading design locally: three muted gray rows with a subtle CSS shimmer, persistent list headings, and placeholder summary cards for Orders. Added Next.js route loading boundaries and reused the Quotes skeleton during shared-draft synchronization, preserving the merge-before-mount requirement. Loaded content uses a single 1-second fade with the existing easing; shared timing is now in `src/lib/page-transition.ts`. Reduced-motion users receive static skeletons and immediate content, and assistive technology receives a loading status. Updated project context and the feature map.

Validation: targeted ESLint and full TypeScript checks passed. Reviewed components against the Vercel React best practices checklist for hooks, component structure, accessibility, and animation performance. No automated tests added/run or browser validation performed in this step. No deployment, schema change, or external service mutation.

## 2026-10-10 — Replace fabric-like steel swatches

Generated two new representative surface images using built-in ImageGen: darker machined alloy steel and brighter surface-ground tool steel. Saved versioned assets as `public/materials/alloy-steel-machined-v4.png` and `public/materials/tool-steel-ground-v4.png`, and applied them only through local overrides in `MaterialFamilyAtlas`. Original assets, original catalog component, family data/guides, and sidebar remain untouched. Exact prompts and rollback instructions are in `docs/audits/materials-design-2026-10-10/steel-swatch-prompts.md`. Browser verification confirmed both optimized images loaded and read as metal at card size; saved `steel-swatches-implemented.jpg`. Targeted ESLint and whitespace checks passed. No new tests for this reversible image-only change; no deployment.

## 2026-10-10 — Implement solid primary Request Quote button

Applied William’s selected design to the customer sidebar in AppShell: graphite fill, white label, plus/arrow icons, 46px height, 7px corners, subtle shadow/hover lift, visible keyboard focus, and reduced-motion support. Existing RFQ link and navigation handler retained. Updated decision and feature-map records. Targeted ESLint passed; inspected the live local dashboard and saved output/qa/sidebar-solid-primary-2026-10-10.png. No automated tests for this styling change; not deployed.

## 2026-10-10 — Soften sidebar Request Quote emphasis

Changed the fill from #171717 to #505050 charcoal, removed the trailing arrow, and removed shadow/hover lift. Kept the plus, white label, height, keyboard focus, and navigation. Updated current decision/feature-map entries. Targeted ESLint passed and local browser inspection confirmed the styling; screenshot saved as output/qa/sidebar-soft-charcoal-2026-10-10.png. No automated tests or deployment for this styling adjustment.

## 2026-10-10 — Black sidebar RFQ hover

Updated the sidebar Request Quote hover fill and border to black at William’s request; the resting charcoal color remains. Updated the feature map. Styling-only change; no tests run or deployment.

## 2026-10-10 — Complete material-card surface refresh

Generated and applied eight further swatches using built-in ImageGen: aluminum, stainless steel, brass, copper, titanium, precision alloys, magnesium/zinc, and engineering polymer. Versioned v4 assets are saved in `public/materials/`; exact prompts, saved paths, and rollback instructions are in `docs/audits/materials-design-2026-10-10/remaining-swatch-prompts.md`. Local atlas overrides preserve all prior files and the archived original catalog. Inconel/Incoloy and mild steel remain on their existing images; approved alloy/tool steel images are retained. Browser inspection confirmed all 12 images loaded, the requested exclusions were unchanged, and the new surfaces read correctly at card size; saved `all-swatches-implemented.jpg`. Targeted ESLint and whitespace checks passed; no new tests for this reversible image-only update. Sidebar, family guides, material data, and other unrelated work were not edited. No deployment.

## 2026-10-10 — Remove glare from three metal swatches

Used built-in ImageGen editing to remove the strong reflected stripes from alloy steel, stainless steel, and precision alloys while preserving their gray metallic textures and machining marks. Saved v5 matte assets in `public/materials/` and switched only those three atlas paths; v4 files remain for rollback. Exact prompt and asset paths are in `docs/audits/materials-design-2026-10-10/glare-reduction.md`. Browser review verified all three new images loaded and the glare was removed at card size; saved `glare-reduced-implemented.jpg`. Targeted ESLint and whitespace checks passed. No new tests for this reversible image-only adjustment; other cards/sidebar/guides unchanged and no deployment.


## 2026-10-10 — Match Inspection & Certificates content width

Matched the documentation page’s horizontal padding, 1320px outer container, and desktop article grid to How it works. Removed the separate 740px article cap. Sidebar, content, and vertical spacing remain unchanged. Live browser measurements confirmed both articles at 879px wide with the same left edge at the current viewport. Targeted ESLint passed; screenshot saved as `output/qa/inspection-width-2026-10-10.jpg`. Updated the feature map. Reversible styling-only change; no automated tests or deployment.


## 2026-10-10 — Rename customer workflow navigation

Changed the customer sidebar resource link from “How it works” to “How Lattice works” at William’s request. Kept its route and appearance unchanged and updated existing navigation test expectations and the feature map.

## 2026-10-10 — Make Open items clicks visibly target Action Center

Added a small client interaction wrapper around the shared dashboard presentation. The Open items card now briefly highlights the Action Center in amber, transfers focus for keyboard/assistive-technology users, and scrolls it into view when needed. Repeated clicks restart the highlight, including when the current URL already ends with #action-center; reduced motion avoids animated scrolling/fading. Other dashboard links retain their existing navigation. Updated the feature map. Targeted ESLint and full TypeScript checks passed. Local browser click confirmed focus and highlight; screenshot saved to output/qa/action-center-highlight-2026-10-10.png. No automated tests run or deployment.

Validation: browser confirmed the renamed link still points to `/how-it-works`; saved `output/qa/how-lattice-works-label-2026-10-10.jpg`. AppShell tests: 26 passed, with one unrelated failure from the older Request Quote button style expectation.

## 2026-10-10 — Request Quote form skeleton

Implemented the approved upload-area and field skeleton for `/requests/new`, sharing the existing shimmer styles and form heading. Wired it into the route loading boundary and shared-draft gate. The loaded form body uses the shared 1-second reveal, with the parent route fade disabled to avoid stacked fades. Reduced-motion users receive static placeholders and immediate content. Existing draft merge-before-mount behavior is retained. Updated existing draft-gate assertions for the new heading/status without running automated tests. Targeted ESLint and full TypeScript checks passed. Local browser navigation showed the form skeleton and preserved sidebar; evidence saved to output/qa/request-form-loading-2026-10-10.png. Updated project context and feature map. No deployment.

## 2026-10-10 — Request Quote workflow audit fixes

Added gray unique IDs to draft rows (saved quote number or full draft/request ID). Replaced draft row/Continue anchors with Next Link, keyed RequestForm by draft/reorder identity, and restarted draft synchronization on persisted pageshow restores to avoid stale loading after Back. Centralized the nine part-file formats and drawing extensions; shared labels/pickers and client/server guards now enforce supported CAD files, nonempty bytes and 200 MiB CAD limit. Draft storage and request uploads accept separate supported drawings. An authenticated read-only APS formats call returned 200 with all nine formats in SVF2; no CAD bytes uploaded to APS. Local browser continued the demo pump-cover draft and Back restored the clean upload page; saved output/qa/request-draft-id-and-back-2026-10-10.png. Targeted ESLint and full TypeScript passed before the final simple submission guard; that guard passed targeted lint. No automated tests run. Shared-draft availability warning was observed and remains a follow-up; browser drafts remained usable. Not deployed.

## 2026-10-10 — Diagnose and fix shared-draft availability warning

Read-only development database check confirmed CustomerRequestDraft is reachable. Continuing the synthetic pump-cover RFQ saves a demo_draft_* entry in browser storage; the provider posted every local entry, but the server only accepts local_draft_* IDs and rejects the whole batch when a demo entry is present. Added shared-draft-policy to exclude known demo_/fixture_ IDs from database saves and deletes, preserving the local preview and leaving all genuine draft/server validation unchanged. Successful GET now clears a stale failure flag. Added regression coverage for mixed demo/genuine batches, local preservation, synthetic deletion, and restored-load recovery. All 17 targeted policy/provider/API tests, targeted lint and full TypeScript passed. Reloaded local page, continued the pump-cover draft, checked no warning after sync debounce, and returned with Back; warning remained absent. Screenshot: output/qa/shared-draft-warning-fixed-2026-10-10.png. Updated TODO, project context and feature map. No deployment or database schema change.

## 2026-10-10 — Request quote configuration audit

Audited the customer RFQ builder at `/requests/new` from source and the existing customer browser-audit notes. Recorded three findings: hidden default process/date values are submitted without customer review, the progress indicator promises Review/Submit stages that do not exist, and disabled submission can leave readiness requirements unclear. Chrome was signed out, so this pass does not claim fresh visual/customer-role or mobile verification. No application behavior changed. See `docs/audits/request-quote-configuration-2026-10-10.md`.

## 2026-10-10 — Make RFQ draft completion operational

Replaced the three existence checks that yielded 60% for typical started drafts with the actual required-field/file readiness checklist. Saved browser/shared initialState drives completion, including all parts, finish-specific details, stored CAD bytes, drawing-required flags and optional drawing bytes when selected. Server draft fallback restores request data. Submission button readiness uses the same calculation; incomplete multi-part packages cannot round to 100%. Added numeric progressbar accessibility and five regression cases; updated the old 40% test to 0% for a draft with no part file. All 28 completion/request-form tests, targeted lint and full TypeScript passed. Local browser inspected recalculated draft rows. No deployment.


## 2026-10-11 — Local PostgreSQL SSL warning repair

Changed the gitignored local DATABASE_URL from sslmode=require to sslmode=verify-full to explicitly preserve certificate and hostname verification and remove the pg-connection-string warning appearing in the Next.js development overlay. A direct PostgreSQL connection and SELECT 1 passed without the warning. Restarted the detached local development server. No application code, schema, or production configuration changed.


## 2026-10-11 — Part configuration browser and source audit

Audited the existing authenticated local RFQ configuration draft on desktop and at a temporary 390 × 844 viewport. Confirmed local solid CAD rendering, material/inspection selector behavior, mobile clipping (299px card with 402px content), and tolerance-modal focus escaping to the background form. Reviewed hidden process/date/default-material assumptions, skipped Review/Submit stages, submission pending/repeat-click risk, and readiness/compatibility/design opportunities. Saved desktop/mobile screenshots under output/qa and detailed findings in docs/audits/part-configuration-2026-10-11.md. Restored the desktop viewport and closed menus/dialogs. No field/file/RFQ changes, submission, application code changes, deployment, or automated tests.


## 2026-10-11 — Implement approved RFQ part configuration fixes

Implemented the six requested audit fixes: responsive part cards with smaller mobile padding, shrinkable grids and wrapping dropdown labels; blank material for new parts while preserving saved explicit choices; Upload/Configure/Submit progress without Review; pending/repeat-click protection plus stable user/company-scoped submission identities and database uniqueness recovery; shared focus containment/background inertness/restoration for ISO, drawing, and deletion dialogs; and a linked per-part readiness checklist that expands collapsed parts and focuses missing controls. Provided a per-part process/request-level delivery-date example separately without implementing that proposal.

Validation: 47 targeted Vitest cases pass across request form, request API, and request repository (including new retry, identity scope, local concurrency, database uniqueness race, focus, and checklist navigation cases). Full TypeScript and targeted ESLint pass. Authenticated existing draft inspected at 320 × 844 and 390 × 844; part form sections have no horizontal overflow and submit remains reachable. ISO dialog initially focuses its close button, Tab stays inside, Escape restores the opening button. Saved mobile/checklist/desktop screenshots under output/qa; restored desktop viewport and page position. Existing draft fields/files retained, no RFQ submitted, no deployment or schema migration. Updated operator feature map, project context, decisions, and follow-up priorities.
## 2026-10-12 — Quote configuration competitor audit

Inspected the authenticated local Lattice RFQ configuration and William's four Chrome tabs for Xometry, Hubs/Protolabs Network, Fictiv and Protolabs. Compared actual configuration controls, export/restricted handling, prototype/commercial intent, engineering identity, certificates, delivery/origin, bulk editing, price breaks and manufacturing feedback. Hubs' initially empty upload page was explored using its built-in CNC sample, creating the unsubmitted sample quote 46NFXPPJK-V1; no user CAD was uploaded. Protolabs' empty new-quote page was supplemented with existing expired CNC quote 1104-984 and its Manufacturing Analysis. Fictiv's existing sheet-metal part was inspected without changing its process or specifications. No classifications selected, configurations saved with changed values, Lattice RFQ submitted or orders placed. Restored the original vendor pages.

Saved detailed recommendations and evidence limits in `docs/audits/quote-configuration-competitors-2026-10-12.md`, with local screenshots in `output/qa/quote-competitors-2026-10-12/`. Recommendations prioritize pre-upload eligibility/restricted-data screening (including storage and Autodesk translation), explicit end use, visible process/date, part/revision identity, inserts, CoC/traceability and compatibility. Reviewed official eCFR/BIS references for the file-handling/classification rationale; do not treat UI declarations as regulatory clearance or prototype status as a customs exemption. Added the audit to TODO for product review; kept existing source-inspection/build-and-hold exclusions and the three-step progress decision. No application feature, schema, environment or deployment changed; no automated tests ran for this read-only audit.

## 2026-10-12 — Implement manufacturing requirements and restricted-work intake

Implemented William's selected competitor-audit follow-ups: per-part CNC Milling/CNC Turning/Sheet Metal Fabrication (Milling default), material/process-aware finish menus with shared server enforcement, customer part number and CAD/drawing revisions, prior-file references/revisions/timestamps on replacement/removal, and Autodesk-derived reference CAD envelope with mm/in display. Added explicit, unselected restrictions and Prototype/Commercial/Mixed-other declarations; mixed-other requires explanation. Current overseas policy refuses declared restricted work and blocks new file storage/APS translation/submission for unconfirmed/unsure/obsolete declarations. Shared historical draft metadata remains syncable; legacy requests are shown as undeclared rather than certified. Admin inspector/workbench displays declarations and part engineering data; quote/supplier preparation uses each part's process and saved drawing revision. Prior-file downloads are company-scoped, and pending prior uploads must save before replacement.

Added optional Request.intakeDeclaration and RequestLineItem.manufacturingDetails JSON columns using the additive SQL in scripts/rfq-manufacturing-schema-2026-10-12.sql on the configured local-development database, regenerated Prisma Client and restarted the detached local server. A real PostgreSQL/Prisma JSON round-trip passed inside an intentionally rolled-back transaction; no synthetic RFQ remained. Production was not changed. Research/implementation scope and all question-only feature examples are documented in docs/rfq-intake-requirements-2026-10-12.md. Finish rules use Protolabs Network's published conservative service matrix; custom substrates and supplier availability remain operator review. The hidden 14-day due-date behavior was explained and retained pending separate approval. CoC/traceability, country-picker, supplier certification, NDA, drawing-deviation, detailed critical-feature and marking controls remain proposals. Updated feature map, project context, decisions and TODO.

Validation: final rerun has 130 targeted tests across 12 files passing; full TypeScript and targeted ESLint pass. Browser confirmed the real current CAD envelope and mm/in conversion, the three process choices, revision fields, filtered stainless finish menu, successful shared-draft synchronization and no form-section horizontal overflow at 390px. The current eligibility/end-use choices were already selected in the browser by the user; the agent did not classify the customer's files. Browser inspection changed only display units temporarily and opened/closed menus, then restored mm, the original viewport and page position. Screenshots saved under output/qa/rfq-manufacturing-2026-10-12. No RFQ submitted, no customer part specification edited, no deployment.

Concurrent upload/submission and Viewer asset-preload edits appeared during the final checks. Preserved those edits, confirmed the direct-storage prepare/complete endpoints keep eligibility enforcement, and updated repeated-submission checks to await asynchronous submission and saved-preview checks to assert the stable restored-viewer path. The final 130-case rerun, TypeScript and targeted lint pass.


## 2026-10-12 — CAD preview speed stage 1

Implemented the approved first stage: shared Autodesk Viewer asset preloading while files upload/translate, and fitted geometry display before Measure/Explode/Section extensions finish. Remote RFQ CAD/drawing uploads now use company-scoped, 15-minute presigned PUTs with exact length/type/key/name metadata and HEAD-verified completion. The browser sends file bytes once to private storage; the CAD API authorizes and validates the saved object, then streams it to Autodesk without buffering the entire model. Submission waits/retries pending file saves and sends references only. Local development retains filesystem uploads. Drawing files now share the existing 200 MiB CAD ceiling. Authorized remote downloads redirect to five-minute signed GETs so large CAD/PDF downloads also avoid Vercel payload limits; stored reference validation uses HEAD.

Added a read-first CORS configuration helper that merges a dedicated exact-origin bucket rule and preserves unrelated rules, plus setup/release instructions in the APS guide. Updated README, project context, decisions, TODO and operator feature map. Added the AWS SDK S3 presigner dependency. Preserved the existing unrelated workspace edits. Translation reuse, token caching and completion notifications remain outside this stage.

Validation: all 81 targeted Vitest cases across 12 files pass, including a synthetic 8 MiB direct upload, submission during an unfinished upload without retransmission, exact-length signatures, incomplete-save denial, company ownership, eligibility gates, streaming without full-file buffering, signed downloads and geometry display while tools remain pending. Full TypeScript, targeted ESLint and the optimized Next.js production build pass. The build was run directly without the deployment migration/bootstrap wrapper. No database schema, account settings, customer RFQs, bucket configuration, or deployment changed. This computer has local storage enabled and no S3/R2 credentials, so live bucket CORS, signed browser PUTs, real APS streaming and measured latency improvement remain deployment checks documented in the guide.


## 2026-10-12 — Export intake popup flow

- Inspected the live Xometry popup in the user’s Chrome tab and the supplied screenshot. Replaced Lattice’s inline export questionnaire with a staged selection modal, prominent radio cards, removable file rows, expandable batches, Back/Close, and Continue.
- Initial, added and replacement CAD batches stay local until explicit unrestricted confirmation. No answer is preselected. Restricted/unsure declarations explain the stop and can be saved without uploading staged files. Existing drafts retain a compact declaration summary/change action. Intended use remains on configuration and reaches existing admin metadata. Server storage/APS/submission gates are retained.
- Reused the focus containment/restoration hook, provided Escape/backdrop close and a scrollable body with a fixed footer. Extracted drawing URL memoization into a dedicated hook to preserve its lifetime under the React compiler after staging callbacks were added. Corrected quote-name generation for multi-file additions/replacements.
- Updated existing request-form fixtures to explicitly confirm staged batches. No automated tests were run for this request. Full TypeScript and targeted ESLint passed. Live localhost inspection confirmed the unselected dialog, disabled Continue and local staged file list; no staged fixture was uploaded and no RFQ submitted. Desktop evidence: `output/qa/export-intake-2026-10-12/export-restrictions-desktop.png`. Local changes only; no deployment.

## 2026-10-12 — Export dialog Yes/No copy refinement

- Removed the customer’s Unsure selection and require Yes or No, with no default for new file batches. Legacy unsure declarations reopen without a selected answer and remain blocked by existing server guards.
- Replaced country-centered intro, choice and refusal copy with Xometry-inspired U.S. regulatory categories, retaining CUI, U.S.-only and other restricted handling coverage. Yes still refuses uploads; No explicitly confirms the absence of restricted requirements. No automatic EAR99 clearance statement was introduced.
- Updated the existing UI fixture and durable product notes/feature map. TypeScript and targeted ESLint passed; no automated tests run. Live browser showed exactly two unchecked choices and disabled Continue. Screenshot: `output/qa/export-intake-2026-10-12/export-restrictions-yes-no.png`. No customer files were uploaded or declarations selected by the agent.


## 2026-10-12 — Export controls reference link

Added the customer-requested sentence, “Certain parts may be subject to various US regulations,” and linked “Learn more about export controls” to the supplied State Department DDTC ITAR landing URL. The link opens in a new tab with noopener/noreferrer and visible keyboard focus. Updated the operator feature map. No automated tests run for this copy/link change.


## 2026-10-12 — Quality approval control on Configure only

Moved visibility of “Require quality approval before shipment” to the Configure stage (CAD present and export eligibility confirmed). The initial Upload page no longer shows this checkbox; its saved value and submission behavior are preserved. Updated the feature map. No automated tests run for this display-only change.


## 2026-10-12 — Export dialog Continue styling and gating

Changed enabled Continue to the platform’s black primary style. Only No enables it (and a new batch must still contain a file); Yes and unanswered states keep the faded, disabled Continue label. Removed Save & stop from this dialog and updated decisions/intake requirements/feature map. No automated tests run.


## 2026-10-12 — Earlier Autodesk viewer preload

Moved the initial public viewer asset warm-up to valid CAD staging, overlapping the export declaration popup. The call is asynchronous and uses the existing shared promise/retry behavior; it does not upload files or start translation. No → Continue already starts asynchronous CAD save/translation during configuration, so that pipeline is retained. Updated the APS guide, context, decisions and feature map. No automated tests run for this request.


## 2026-10-12 — Advance CAD processing during export declaration

- Implemented the explicitly requested speculative CAD upload/APS translation on valid file selection, alongside viewer asset preloading. Added a CAD-only advance processing intent accepted only for unconfirmed/current-policy declarations; actual customer eligibility remains unanswered until No → Continue.
- Reused File-keyed upload and preview promises when confirmed parts enter configuration. Failed speculative uploads/preview requests can retry; no duplicate upload/translation is created for the same pending File. Auth, company-scoped storage access, CAD type/size validation, drawing restrictions and RFQ submission eligibility remain enforced.
- Replaced the inaccurate on-device-only popup note with disclosure that upload/translation start while answering and Yes cannot undo transmission. Back/removal discard UI references; already-started cloud jobs are not canceled or erased. Updated the existing UI fixture, APS guide, feature map, context, decisions and intake notes. This supersedes prior privacy gate assumptions; legal eligibility/liability was not established.
- Full TypeScript and targeted ESLint passed. No automated tests or live CAD translation timing measurement were run. Local code only, no deployment.


## 2026-10-12 — Remove popup processing sentence

Removed the selected “CAD files upload and begin processing…” note beneath the CAD file list. Processing and continuation behavior are unchanged. Updated decisions, operator feature map, APS guide and intake notes. Targeted ESLint passed; no automated tests run for this copy-only change.


## 2026-10-12 — Refresh translation status during step 1

- Traced CAD staging → draft persistence → APS start; translation already starts before No/Continue. Local server logs showed successful CAD start responses. The displayed queued state was a hardcoded cached start result and Configure previously waited five seconds before its first status poll.
- Added two-second, non-overlapping status checks while the popup is open and an immediate fresh status read when attaching the preview to configured parts. Configure polls immediately/every two seconds with stable dependencies; unrelated renders do not restart polling. Kept a single upload/translation per File and retained running jobs across temporary status/network errors. Added no-store on browser status fetch, status endpoint and upstream manifest reads.
- Updated status tests and existing form fixtures. A form check confirms translation POST occurs while the dialog is still mounted and only one translation POST occurs after Continue; current progress replaces queued. All 38 targeted tests passed across form, status helper, APS service and preview route. Full TypeScript and targeted ESLint passed. No fresh live customer file was uploaded by the agent; actual Autodesk queue/conversion time was not benchmarked. Updated feature map, APS guide and project context.

## 2026-10-12 — Live sample CAD timing verification

Uploaded the user-provided A10201.SLDPRT in three isolated localhost tabs and waited 27.5, 20.1 and 60.0 seconds before Configure. Confirmed one translation-start POST per upload during the unanswered popup and status polling before Continue. Two directly observed Autodesk jobs finished at approximately 40.0 and 42.3 seconds after selection, explaining why a 20-second wait still showed real 99% processing. A 60-second wait bypassed translation waiting, but browser model download/viewer initialization still ran after Continue; final geometry and CAD envelope were visually verified. No application code changes or new speed guarantee. Detailed findings and sampled provider status evidence are in `docs/cad-popup-timing-verification-2026-10-12.md` and `output/qa/cad-timing-2026-10-12/`. Three trial drafts were uniquely labeled and archived; no RFQ submitted, no other drafts altered, no cloud files/jobs deleted.


## 2026-10-12 — Prepare and preserve the actual CAD model behind the popup

Implemented first-file model warm-up after translation succeeds, using a sized invisible/inert parking area and a stable portal container. Configure takes over the same mounted Autodesk viewer and canvases, while ResizeObserver refits to the card; precomputed envelope metadata reaches the configured part. Cancellation, removal/replacement, part deletion and form unmount release unused viewer/container resources. Other batch files use the normal path. Cloud job cancellation and content-based translation reuse were not added.

Verified with the user-provided A10201.SLDPRT: a fully loaded viewer existed behind the still-open popup, and the same instance ID `_r_2_` and two canvases were reused after Continue. Its width changed from 600 to approximately 351 pixels; visible handoff was observed at 0.295 seconds including automation overhead. This is a local warm-model observation; translation time is unchanged. Evidence is saved in `output/qa/cad-model-preload-2026-10-12/viewer-handoff.json`. All 37 targeted tests passed across prepared-host lifecycle, viewer, form and status helper, including preservation without remount and disposal on cancellation. Full TypeScript and targeted ESLint passed. No RFQ was submitted. Updated feature map, APS guide, context, decisions and TODO.

The isolated prepared-viewer test draft was renamed and archived through the normal UI after verification. No other drafts were changed. Development hot reload reset the temporary form after the measured handoff; the saved draft was reopened for the final screenshot and cleanup. The preserved-instance handoff evidence was recorded before that reload. Targeted tests were rerun after cleanup-related code changes: all 37 passed.

## 2026-10-12 — APS account allowance inspection

Used the requested William/Lattice Chrome profile, which was already authenticated, to inspect Lattice OS Dev and the Lattice CAD Preview application. Confirmed the configured local client ID matches that visible application without printing credentials. Hub analytics is available. The linked Autodesk team is William paik - 3614; the work account’s account-home role is User, Products and services shows no assigned products, and Subscriptions and contracts exposes no plan details. Therefore the team’s actual APS free/paid entitlement, remaining translation allowance and token balance are unverified; the published API rate must not be presented as a verified account-specific monthly quota. Requested identification of the subscription/token owner account. No account permissions, subscription, billing plan or credentials were changed.

## 2026-10-12 — Compact quote intake dropdowns

- Replaced Configure’s large intended-use radio card with the shared compact dropdown in the same location; Prototype/Commercial/Mixed-other values, no default, conditional explanation and persistence remain.
- Moved export restrictions into a separate dropdown below the quote name, replacing the Change link/modal editing path. Selections record the current policy through the existing declaration handler; restricted work continues to block configuration/submission. The initial CAD-selection popup remains.
- Updated the feature map and intake reference. No schema/deployment changes. Tests were not run (not requested).

## 2026-10-12 — Intended-use second page in CAD intake popup

- Added a second popup page after the unrestricted answer. Prototype/Commercial/Mixed-other choice is required; mixed requires details. Existing quote choices are retained for additional/replacement batches, and the Configure dropdown stays editable.
- Continue saves intended use with the restriction declaration through existing draft/admin persistence. Back returns to the first popup page with answers retained; question focus moves on page changes.
- The page change is local to the dialog: staged CAD files, upload promises, translation polling and prepared viewer hosts stay mounted and active until final Continue. No new translation request or cancellation is introduced by switching pages.
- Applied the React best-practices review for state isolation, focus and derived validity. No tests run (not requested), deployment or schema changes.

## 2026-10-12 — Prototype/commercial copy and removal of Mixed-other

- Updated both popup and Configure dropdown descriptions to the customer-provided Prototype/Commercial reference wording, retaining the current design.
- Removed Mixed/other and the explanation control from both entry points. Client readiness and server submission require Prototype or Commercial; legacy submitted mixed metadata remains readable, while mixed drafts prompt for a new choice. Selecting a supported use clears obsolete mixed notes.
- Autodesk processing lifecycle is unchanged. Documentation updated; tests not run (not requested).

## 2026-10-12 — Intended-use explanatory copy

- Confirmed Prototype/Commercial option descriptions match the supplied reference. Updated the second popup page’s introductory sentence to “This classification is required for us to determine accurate pricing and any import considerations.”
- Retained the existing layout and Autodesk processing behavior. No tests run (copy-only change; not requested).

## 2026-10-12 — Separate quote and part containers (reversible layout trial)

- Quote name, restrictions and intended use now occupy their own card. Each existing part card sits below as a separate sibling; additional upload/quality/submission controls have their own card. Upload-only layout retains its existing container.
- Set `separatePartContainers = false` in `src/components/request-form.tsx` to restore the prior shared quote/part card presentation. Part components retain their keys and data/preview behavior.
- Updated the feature map. No tests run (not requested).

## 2026-10-12 — Compact quote header summary controls

- Restyled quote-wide dropdowns with slim rectangular triggers and an intended-use icon tile, inspired by the supplied Fictiv screenshot. Header places quote name at left and controls at right, stacking on small screens.
- Added an opt-in compact presentation to CustomSelect; other form dropdowns retain their existing style. Popup answers remain the stored values, with no repeated confirmation requirement; controls provide occasional correction.
- Reviewed React state/focus behavior using the React best-practices skill. Updated feature map; no tests run (not requested).

## 2026-10-12 — Quote header column layout

- Stacked quote name, export restrictions and intended use vertically at all screen widths, retaining compact dropdown styling. No tests run (not requested).

## 2026-10-12 — Quote details single row

- Placed quote name and both compact dropdowns on one row with shrinking columns and wrapped text. Supersedes the column layout. Tests not run (not requested).

## 2026-10-12 — Narrow quote dropdowns and align intended-use arrow

- Restricted quote-header dropdown widths to 240px (restrictions) and 192px (intended use), shrinking when necessary. Compact trigger text takes remaining space, placing the arrow immediately before the intended-use icon tile. Tests not run (not requested).


## 2026-10-12 — Autodesk account and upload capacity audit

Inspected the logged-in Chrome APS hub and Autodesk Account. Lattice OS Dev contains the single Lattice CAD Preview application. October 5–12 analytics show 20 simple translations, zero complex translations and 379 basic calls. Confirmed the work login's billing team role is User with no assigned products/accessible subscription; remaining allowance and actual Free/Paid tier cannot be established from these views. Read the current official rate sheet in Chrome: Free allowance is 60 simple jobs, 20 complex jobs and 300,000 basic calls/month; paid equivalents are $1/simple job, $4.50/complex job and $3/300,000 basic calls. Data Management has no monthly upload quota in that rate sheet, distinct from conversion and individual-file constraints. Source recheck confirms 200 MiB per CAD/drawing in Lattice, with no per-RFQ aggregate cap. Saved evidence, caveats, production-path uncertainty and primary sources in docs/audits/autodesk-upload-limits-2026-10-12.md. No files uploaded, account/configuration changes, purchases, deployment, or tests during this read-only investigation.

## 2026-10-12 — Remove part identity fields and update competitor comparison

- Removed Customer part number, CAD revision and Drawing revision controls from Configure. Historical metadata/replacement history remain stored; no migration or destructive data change.
- Added `docs/audits/quote-configuration-update-2026-10-12.md`, comparing current implementation with the earlier observed competitor features and prioritizing delivery, save state, documentation and manual engineering review. Competitor pages were not freshly inspected.
- Updated feature map. Tests not run (not requested).

## 2026-10-12 — Equipment page audit and design proposals

- Reviewed the local customer Equipment page, Materials overview, shared customer style, equipment source/projection/catalog code and prior decisions. Researched IBM Carbon table guidance, NN/G workplace table patterns and manufacturer specification presentation.
- Identified headline/result count disagreement (162 vs 150), a mixed-unit numeric-substring set aggregate, conflated tolerance/accuracy claims, ambiguous envelope headings, redundant filters/introduction, truncation and mobile-reading concerns.
- Prepared three interactive design proposals: recommended Technical directory, Materials-aligned Process atlas, and Specification workbench. Used selected existing catalog examples, explicit claim bases and local-only preview interactions. No generated machine imagery was needed.
- Saved the audit and proposed follow-through in `docs/audits/equipment-design-2026-10-12.md`; recorded the review step in TODO. No application implementation, supplier-data mutation, approved product decision or deployment. Feature map stays unchanged because behavior is unchanged. Application tests were not run for this proposal-only work; preview syntax and browser interactions were checked.

## 2026-10-12 — Optional per-part target ship date

- Reduced Manufacturing notes top padding from 32px to 12px and removed its extra 20px label margin. Added a blank-by-default optional date input immediately below notes. Copy distinguishes preferred shipment from arrival and confirms availability in the quote.
- Persisted targetShipDate in local/shared draft snapshots and RequestLineItem manufacturing JSON; reorder prefill and admin part review include it. Server checks date format/calendar validity; no database migration needed.
- This user-approved date control supersedes the proposed expandable lead-time duration design; it is per-part. Existing legacy request dueDate metadata is not used as the new field’s default. Updated feature map. Tests not run (not requested).

## 2026-10-12 — Lattice target-date calendar redesign

- Replaced the native date picker with a custom single-month calendar matching the trigger’s measured width, neutral/charcoal Lattice theme, month/year controls, Today/Clear actions and understated current/outside-month dates.
- Popover portals outside the part card to prevent overflow clipping, updates position on scroll/resize, and opens above when necessary. Arrow/Home/End/PageUp/PageDown navigation, Escape, outside dismissal and focus return are implemented. Date storage/validation remain unchanged.
- Reviewed Apple picker guidance, Uber Base Web datepicker and Airbnb react-dates as design references; retained project styling and added no package dependency. Applied React best-practices review. Tests not run (not requested).

## 2026-10-12 — New Equipment explorer alongside the existing catalog

- Built `/equipment-explorer` below How Lattice works without changing `/equipment` or its source records. Added a responsive technical directory/card layout, six process groups, 150-record counts, composed search/configuration/evidence filters, pagination, source disclosures and existing RFQ links.
- Added a server-only safe projection, stable opaque equipment references and source-qualified labels. Checked original PDF headings and selected axis classifications; documented scoped corrections and remaining source-audit limitations in `docs/audits/equipment-explorer-implementation-2026-10-12.md`. No synthetic machine photos, invented availability or automatic part-fit claims.
- Verified 24 focused tests, saved-sidebar placement, typecheck and scoped lint; inspected desktop/mobile behavior and evidence disclosure. Broader sidebar run had one existing Request Quote styling expectation failure (26/27 passed), unrelated to the explorer. Updated feature map, project context, decisions and TODO. Local implementation only; no deployment.

## 2026-10-13 — Comparative audit of Equipment and Equipment explorer

- Inspected both live pages, equivalent Hermle C400 details, original-page mobile behavior and catalog source logic. Original compact rows were 71px versus 168px for the explorer at the same desktop viewport.
- Confirmed original 162/150 count disagreement, mixed-unit 664-set aggregate, misleading universal specification headings, omitted rotary envelope in expanded Hermle details, redundant filters and mobile horizontal scrolling.
- Recommended combining the original desktop density with the explorer's source-qualified values, process navigation and mobile cards; identified the explorer's repeated evidence text and generic missing-spec cells as further improvements. Saved `docs/audits/equipment-comparison-2026-10-13.md`.
- Feedback only. No application implementation, deployment, tests or approved product-direction change; feature map remains unchanged.

## 2026-10-13 — Certificate of Conformance RFQ choice

- Added optional Certificate of Conformance (CoC) to shared quality-documentation options, preserving Standard Inspection and independent MTR selection. Existing option-label persistence carries CoC through draft, submission and admin review without a schema change.
- Added CoC to the quality-documentation guide, distinguishing finished-part conformity from raw-material test reports and separately requested heat/lot linkage. No new supplier certification/traceability promise or inserts feature.
- Updated feature map; tests not run (not requested).

## 2026-10-13 — Searchable quality-documentation selector

- Added typing/search inside the quality-documentation selection box. Filters options by label/key, preserves selected chips, supports arrow/Enter/Escape controls and displays an empty-result message. Query clears when closed; Standard Inspection remains included. No persistence changes.
- Updated feature map. Tests not run (not requested).

## 2026-10-13 — Custom Inspection inline hint

- Added “(add details to manufacturing notes section)” beside Custom Inspection in the quality-documentation dropdown, matching drawing-required hint typography and allowing wrapping. Tests not run (copy-only change; not requested).

## 2026-10-13 — Remove Previous files from quote configuration

- Removed previous-file history from customer configuration and admin inspection. CAD/drawing replacement and drawing removal no longer archive the prior file or wait for its save. Restored drafts/reorders and new submissions clear history; the submission route no longer promotes old files.
- Updated intake requirements, feature map and durable project memory. Existing submitted records and physical storage objects were not purged; no migration or deployment.
- Focused checks: two form regression cases passed for CAD replacement with legacy history and drawing removal; eleven request route checks passed, including ignoring unavailable/unowned deleted-history references. Typecheck, targeted lint and diff whitespace checks passed. Read-only inspection of the open local draft confirmed Previous files is absent. No customer quote was submitted through the browser.

## 2026-10-13 — Minimal CAD dimensions in preview header

- Removed the envelope card below the viewer. Dimensions now sit beside CAD FILE PREVIEW in small muted text with compact mm/in selection. Model-unit/reference caveats moved to a tooltip; no pending metadata filler is shown. Header wraps when needed.
- CAD metadata extraction/persistence remain unchanged. Updated feature map. Tests not run (not requested).

## 2026-10-13 — Quality dropdown outside-click dismissal

- Changed quality-documentation dismissal to capture-phase pointerdown/click listeners, so mouse/touch/outside clicks close the dropdown even when another control stops propagation. Closing clears search; selected documents remain intact. Tests not run (not requested).

## 2026-10-13 — Hide quality search while closed

- Quality-documentation search no longer shows a placeholder or occupies layout space when closed. Opening reveals/focuses the blank search input; selected chips remain. Escape restores the dropdown button. No tests run (not requested).

## 2026-10-13 — Nonblocking drawing-required configuration

- Removed automatic drawing-dialog opening for quality-documentation and drawing-required engineering flags. Added small inline reminders at the drawing upload and quality selector, with an explicit Upload a drawing action. Selections remain removable.
- Removed the drawing dialog’s upload-before-close rule; Done/backdrop/Escape close it without clearing specifications. Existing required-drawing readiness/checklist and submit guards remain. Filename-only references do not satisfy required drawing bytes.
- Updated feature map. Tests not run (not requested).

## 2026-10-13 — Material picker UX audit and design alternatives

- Audited current desktop picker in browser and source, retaining the customer’s material choice. Confirmed grade/UNS search and empty-result behavior, duplicate-looking SS 304 alias, and focus loss on Escape. Catalog/search/accessibility/placement findings are in `docs/audits/material-picker-2026-10-13.md`.
- Used built-in imagegen to propose A search-first dropdown (recommended), B family browser and C selection drawer. Saved final concepts under `output/design/material-picker-2026-10-13/`; no application behavior changed. No automated/mobile tests ran.

## 2026-10-13 — Move shipment approval into quality configuration

- Moved the existing order-wide Require quality approval before shipment control from the submission/upload card to immediately below Quality documentation in the first line-item card. Shows once to avoid duplicated linked controls; copy explicitly states entire-order scope.
- Retained existing draft/submission/admin approval behavior and disabled edits during submission. Updated feature map. Tests not run (not requested).

## 2026-10-13 — Material search and explicit alias consolidation

- Implemented token-based and normalized spacing/punctuation search, including reordered family/grade terms and compact aliases. Exact identity matches rank first.
- Consolidated five explicit duplicate name pairs in the RFQ picker: SS 304 → 304 Stainless Steel; SS 316 → 316 Stainless Steel; Brass C360 → Brass 360; Copper C110 → Copper 110; Bronze C932 → Bronze 932. Aliases remain searchable; old stored values display the canonical choice without rewriting history. Distinct grades/tempers and ambiguous polymer aliases remain separate.
- No-results copy now reads “No materials found - email support@latticeos.co for procurement support,” with a mailto link.
- Family browsing recommendations only: one open family at a time, fixed search row, bounded grade scrolling; no filters. No change to Escape focus behavior at user request.
- Local changes only; no tests run (not requested), schema changes or deployment.

## 2026-10-13 — Reversible search-first material picker (concept A)

- Implemented `SearchFirstMaterialSelect` with focused search, quick family filters/additional-family control, result count, concise grade/UNS rows and selected checkmark. Reuses existing normalized search and canonical aliases without changing catalog data.
- Added empty-result reset and existing `/materials/inquiry` link in a separate tab so the draft stays open. Anchored portal matches input width, flips above when needed and repositions on scroll/resize. Arrow/Home/End/Enter controls and Escape/selection focus restoration are included.
- Preserved the full original picker as `LegacyMaterialSelect`. Set `useSearchFirstMaterialPicker = false` in `src/components/request-form.tsx` to revert presentation.
- Applied React best-practices review for memoized filtering, isolated state and listener cleanup. Updated feature map and project context. Tests not run (not requested); no deployment/schema change.

## 2026-10-13 — App-wide enabled-button pointer cursor

- Added shared pointer cursor styles for enabled buttons, button inputs and role=button controls, with not-allowed styling for disabled/aria-disabled buttons. Applies to the intake Continue action when enabled.
- Searched existing source cursor overrides; explicit default styles were limited to disabled controls. Updated feature map.
- Live browser check passed after the stylesheet refreshed: all four enabled controls in the current intake popup (including Continue) report pointer; a separate fresh upload page had seven visible buttons with zero cursor mismatches, including disabled Previous using not-allowed. No pending upload/declaration was changed.

## 2026-10-13 — Additional-part configuration handoff

- Confirmed additional drop-zone intake shares stageCadFiles with initial uploads: draft upload and APS job start during the popup; staged polling/preload continue across both questions and cached promises are reused on confirmation.
- Added explicit expanded-card reveal after confirmation. New batches scroll/focus the first newly added part header; replacements/initial targeted uploads reveal their target. This avoids focus returning only to the lower upload/checklist area. No material prerequisite was added; readiness affects submission only.
- Updated feature map. Tests not run (not requested); no deployment/schema change.

## 2026-10-13 — Hidden RFQ requirement audit

- Traced Buyer company is required to legacy hidden client state plus mandatory model validation; admin API path does not replace buyer company from account context. Also found hidden hardcoded requester identity, required/invented dueDate, hidden customerPo note injection, hidden partName readiness and redundant project-level process checks.
- Recorded removed fields that are not blockers and backend drawing/document/tolerance validation parity gaps in `docs/audits/rfq-hidden-requirements-2026-10-13.md`. No app/draft changes or submission performed.

## 2026-10-13 — Remove obsolete RFQ intake state and requirements

- Removed hidden requesterName/customerPo/dueDate/partName state, hardcoded/default values, PO-note injection, and request-level process readiness from RequestForm and prefill. Legacy keys are ignored when restoring drafts and omitted from newly saved intake snapshots.
- Request model accepts absent requesterName/dueDate/process/partName fields. Filename-derived labels provide operational part descriptions; aggregate process remains derived from per-part manufacturing choices. Optional blank dueDate persists as null.
- User also requested historical-value deletion; asked for exact environment and record scope before preparing that destructive operation. No historical records purged yet. Buyer/company ownership remains a separate unresolved issue from the prior audit. Tests not run (not requested).

## 2026-10-13 — Purge authorized development/local legacy values

- User specified all development records and all records on this machine. Ran `scripts/purge-development-rfq-values.mjs`, guarded to the inspected `.env.local` development endpoint. Development database contained zero Request/RequestLineItem rows and 18 shared draft records; four shared drafts required value cleanup. A second pass changed zero shared drafts.
- Cleaned all 11 records in `.data/mock/requests.json`. `.data/requests.json` was absent. Request/order objects and uploads retained; legacy requesterName, dueDate, request-level process, partName and hidden customerPo/note injection values removed or blanked for storage compatibility. Per-part process, optional targetShipDate, buyer/company ownership and actual purchasing PO fields are retained.
- Added a reusable cleaner at browser draft read/write/sync and shared-draft API save boundaries to prevent reintroduction. Development browser cleanup covers all app draft storage keys on the current origin. Active in-app browser confirmed one scanned store, zero remaining changes, zero unreadable stores; other browser profiles/origins apply the same cleanup when the updated local app loads. Closed profiles were not directly inspected.
- No Production database changes, schema migration or file deletion. No automated tests run.

## 2026-10-13 — Fix Quotes RangeError after legacy date purge

- Runtime logs identified `BuyerQuotes`/`QuoteTable` calling Intl.DateTimeFormat with an empty removed dueDate, causing RangeError: Invalid time value. Removed the obsolete due-date formatter/display from the buyer Quotes table.
- This was a regression from the preceding cleanup; record timestamps and optional target shipment dates are unrelated and retained. Updated feature map.
- Live browser confirmed `/quotes` renders draft and quoted rows after the fix without the error overlay. Saved `output/qa/quotes-range-error-2026-10-13/quotes-restored.png`. No RFQ mutation/submission or automated tests.

## 2026-10-13 — Fix remaining Buyer company submission blocker

- Identified the remaining model assertion requiring buyerCompany and the form default/restore/payload path for this deleted input. Removed both; intake snapshots no longer carry buyerCompany.
- Request API derives customer company display data on the server and retains the authenticated company ID and missing-membership guard. Admin submissions use an unassigned company context. Persistence omits the company relation for an unassigned RFQ instead of creating a blank Company. Existing ownership and company records retained.
- Reviewed affected source paths and updated feature map/context/decision. No actual RFQ submitted and no automated tests run.

## 2026-10-13 — Fix second/later CAD viewer initialization race

- Live draft inspection found first viewer ready with canvas and second viewer loading without a canvas. Inspected the deployed Autodesk 7.108.0 SDK: concurrent Initializer auth callbacks share tokenRefreshInterval; later callbacks can update the token without resolving their initialization callback.
- Introduced one shared SDK runtime initialization promise and kept per-part GuiViewer3D/model creation separate. Added startup/token error handling, a 30-second initialization timeout, and mounted guards for model errors. Popup translation/preloading unchanged.
- Live browser confirmed both existing line-item viewers have a canvas and state ready after the fix. A third upload was not performed; the same shared startup path applies to later parts. No RFQ submitted or automated tests run.

## 2026-10-13 — Implement compact quote deletion dialog (option A)

- Replaced BuyerQuotes window.confirm with an app-styled compact portal dialog for in-progress/received quotes and draft discard. Includes trash icon, title, permanent-deletion explanation, quote name/reference, outlined Cancel and charcoal destructive action.
- Reused dialog focus containment/restoration and background inert behavior; added scroll lock, Escape/backdrop cancellation, pending-action disabling, a synchronous duplicate-click guard, and inline deletion errors. A false server deletion result now reports failure instead of hiding the quote.
- Updated operator feature map. No quote records deleted and no automated tests run.

## 2026-10-13 — Restore previous material dropdown design

- User requested reversal of the concept-A material dropdown. Set the existing reversible toggle to false so all RFQ part cards use LegacyMaterialSelect again. Preserved the alternate component and material data/validation.
- Updated project context and feature map. No automated tests run.


## 2026-10-13 — Make admin Quote Submissions saves recoverable and validated

- Quote issuance and Request information/No quote now return structured success/error results. Client submit handlers retain controlled and uncontrolled inputs after failure, display inline alerts, block concurrent saves synchronously, and refresh the same RFQ after success rather than redirecting to the root queue. Quote success clears unsent-edit state and exits explicit reissue editing.
- Server checks require explicit non-negative per-part currency with at most two decimals, positive whole-number optional lead times, valid dates/shipping selections and supported integer totals. Empty prices no longer become zero; explicit zero remains supported. Optional shipping/lead time and the existing single supplier-backed line-price model remain unchanged. Inactive/archived issuance/decisions are refused; the inactive workbench shows read-only RFQ package, supplier evidence and quote history.
- Added action/UI regression coverage for validation, failure retention/retry, pending saves, inactive records, customer decisions, correct totals/validity, authorization and safe errors. Added an isolated repository test verifying initial issuance and revised-version persistence without rewriting the earlier quote.
- Verification: 45 focused action/UI/repository tests passed; changed-file lint passed. Local authenticated browser confirmed demo RFQ preparation, disabled issuance before pricing, $125 parts + $25 shipping = $150 total, 7 manufacturing days + 5 shipping days = 12 overall days. Temporary demo edits were discarded by returning to the queue; no live quote/decision was issued, customer email sent or deployment performed.
- Broader checks: typecheck reports pre-existing optional-process/removed legacy-intake field errors in request API/form tests; the persistence test has a pre-existing expected-metadata mismatch for targetShipDate. No changed quote-file type errors remain. Genuine database-backed customer issuance/PDF and supplier upload validation remain follow-up work.

## 2026-10-13 — Implement approved part-removal dialog

- Restyled RemoveLineItemConfirmationModal to the approved compact mockup: centered trash badge, Remove this part? heading, explanation, part name/line number, divider and outlined Cancel/black Remove part actions.
- Mounted at document.body through a portal; reused focus containment/restoration/background inert logic, added scroll lock and backdrop/Escape cancellation. Part-removal logic unchanged.
- Updated feature map. No parts removed and no automated tests run.

## 2026-10-13 — Guard intended-use mismatches on additional CAD

- Added quoteEndUse to the upload declaration dialog. Choosing a different valid use displays a separate-quote notice, disables Continue and offers Request a new quote in a new tab. The customer may correct the selection or cancel.
- Added a confirm-handler guard before any project/part state mutation. Existing quote use is retained; first/legacy unclassified quotes can establish use. Translation/preloading remains active during the popup; rejected CAD is not appended.
- Updated feature map and decision. No automated tests run. Authentication investigation from the preceding interruption is still unresolved.

## 2026-10-13 — Synchronize admin RFQs with submission database and add operational detail review

- Replaced administrative database/local/browser merging with database-only non-demo RFQ reads. Added the missing `/admin/quotes/[requestId]` page and direct queue links; old review query URLs redirect there while quotation/decision workbench links remain. Missing database requests return not-found; read failures have a retryable error state. Queue/detail refresh on focus and every 30 seconds while visible, excluding workbench edits.
- Strict database persistence now applies to submission/idempotency, quote issuance, customer decisions and supplier-evidence metadata. Failed writes no longer report a local administrative save. Submission errors return safe 503 recovery text. Explicit local test/mock repository paths remain available outside these entry points.
- Detail review uses deterministic saved part ordering and `UploadedFile.lineItemIndex`, never file-array position. Shows each part's CAD/drawing files, original private downloads, material/finish/tolerance, quantities, inspection documentation, manufacturing/special notes, target shipment preference and saved model envelope/units. Request declarations, quality approval, contact/delivery snapshot and operator/supplier context are visible. Missing legacy associations stay shared; missing company membership remains Unassigned company. Removed name-guessed broken customer shortcuts.
- Added lazy saved-CAD readiness/viewer handling and PDF.js drawing rendering with page/zoom controls, authorized byte loading, cancellation and accessible text. The packaged worker is locally served with versioned URL and standalone file tracing. PDF byte loading repaired the live browser's streaming-reader failure; the restrictive file-response sandbox is retained. Image drawings render directly; unsupported native formats retain download fallback. File responses use private/no-store caching.
- Verification: 80 focused tests across 12 suites pass, covering database-only failures, persistence/versioning, schema mapping, part/file identity, detail routing/authorization, PDF controls, submission service errors, private downloads and existing quote actions. Changed-file lint and diff whitespace checks pass. Current production source has no type errors from these changes; full typecheck remains blocked by pre-existing removed-field fixtures in request-form.test.tsx and request-form-completion.test.ts. A production/release build is not claimed.
- Authenticated browser confirmed the queue matches the configured Development database's one RFQ; opening its direct detail works, both saved CAD models render, the existing uploaded PDF attachment renders in-page, part switching shows the correct selected requirements, and 390px review has no horizontal overflow. Saved proof under output/qa/admin-rfq-detail-2026-10-13/. A temporarily ended session was restored before verification; no access check was bypassed. No RFQ record mutation/quote/decision/email/deployment was performed.
- Prepared three interactive synthetic detail design alternatives (Part review, All-part dossier, Tabbed workbench); the functional baseline remains independent of final design selection. Updated feature map, context, decisions, TODO and docs/audits/admin-rfq-detail-2026-10-13.md with the schema contract and remaining release checks.

## 2026-10-13 — Prepare shared Git and Production release

- Verified origin/main and Vercel willpaikstacks-projects/lattice as release targets. Reconciled removed intake-field fixtures, current material selections, declaration steps, deletion dialogs, and drawing-readiness expectations in regression coverage. Local typecheck and production build pass; final regression/lint checks run before publication.
- Applied only the two idempotent additive JSONB columns from scripts/rfq-manufacturing-schema-2026-10-12.sql to the inspected Vercel Production database and verified both exist. No historical-value purge or customer record mutation.
- Production private-storage browser preflight lacked a valid CORS response. Stage the release with a one-time build command running the existing exact-origin CORS configuration script inside Vercel; protected storage secrets remain on Vercel.
- Local QA captures stay off Git/deployment uploads because they can contain customer CAD/account details. Production promotion and final deployment evidence are recorded in a follow-up entry.

## 2026-10-13 — Publish Git and Vercel release

- Promoted Ready Production deployment `dpl_31kujdnkXEq4S3nwWfkmQ4CaX8ZT` (`https://lattice-qs66bw54f-willpaikstacks-projects.vercel.app`), source commit `71b21df`, to the Production aliases. Vercel build duration: 2m 7s.
- Repaired deployment blockers: synchronized the pnpm lockfile with the added dependencies and aligned S3 client/signer dependency types. Local typecheck, lint, production build and 110 suites/529 tests pass; focused storage regressions pass after dependency alignment. Remote production compilation/typecheck/build pass. Dead-code audit still reports existing unused modules/exports and server-only dependency declarations; it is not clean.
- Applied the two additive manufacturing JSONB columns to the inspected Production database. Configured the private R2 bucket CORS through the signed-in Cloudflare Dashboard after the existing object-storage credentials denied bucket-settings API access. Verified 204 preflight for all three exact Production origins and 403 denial for an unrelated origin; public bucket access remains disabled. No uploaded object, historical purge, customer RFQ mutation, quote issuance, payment or email was created by these release checks.
- Staged deployment smoke checks: login returns 200 and contains the sign-in page without application-error output; Equipment explorer redirects unauthenticated access (307); requests API refuses anonymous access (401). Full authenticated browser upload/APS and customer transaction checks remain outstanding. Local QA captures remain excluded from Git and deployment uploads.
- Shared context, TODO, feature map and CAD deployment guide updated for the release.

## 2026-10-13 — Audit hosted integration readiness in isolated Vercel Preview

- Prepared branch `codex/hosted-readiness-2026-10-13` and Ready Preview `dpl_2gXESm84dTeJVYz7BLjgypqQDzmD` at lattice-hosted-test.vercel.app with separate development Neon/Clerk, private lattice-preview-test R2, separate APS translation bucket and Stripe Test mode. Branch-only secrets, object-only R2 credential expiring October 20, no outbound email, no Live charge or Production mutation. The temporary Preview share link was revoked.
- Normal signed PUT/CORS worked but completion failed for both STEP sizes and a >5 MB PDF because R2 lacked the expected metadata. Explicit synthetic metadata preparation allowed independent downstream testing; no normal end-to-end pass is claimed.
- Verified hosted database RFQ/idempotency, actual admin quotation, scoped original downloads/quote PDFs, APS translation, native Stripe sandbox payment ($92.54), authenticated genuine event replay/duplicates, one paid order, PDF-triggered durable invoice, partial/full Test refunds with immutable original invoice, customer order/refund UI and small quality-document persistence/private access, Customer Admin approval and added-document approval invalidation.
- Confirmed release blockers: cross-company private data in redirected admin quotes/customers/orders/order-detail bodies; role-only APS derivative/token access; fabricated file metadata and missing required drawing accepted by submit; malformed shared draft accepted/crashes Quotes; protected Preview blocks provider webhook delivery; >5 MB quality upload returns 413. Source review found filesystem vendor edits and dependency advisories. UI also shows invented initial manufacturing activity and generic quality-validation errors.
- Created docs/audits/hosted-readiness-2026-10-13.md and sanitized evidence; updated shared README/context/TODO/feature-map readiness notes. Full report distinguishes defects, prepared/replay passes, source gaps, intentionally deferred features and unverified launch/operating gates. Application code was not changed; Live purchasing remains disabled.

## 2026-10-13 — Fix and release all reported P0 privacy/upload defects

- Application patch db347a6 replaces unreliable presigned-query upload metadata with private server-written expected-upload records. Actual R2 small/large STEP and >5 MB PDF uploads complete normally (201), persist through submission (201), and download with matching original hashes. Wrong-length PUT and cross-company completion are denied; internal records cannot be downloaded as attachments.
- Added page-level authorization before private queries on the unguarded administrative pages, preserving existing layout/action/route guards. Raw redirected response checks cover customer, second-company and anonymous access across 12 admin routes; foreign data absent. Authorized operator queue/detail access remains working. Tests distinguish caller-owned workspace data and echoed input URL identifiers from private foreign query results.
- Added authoritative private CAD ownership/source records, scoped status/thumbnail/token checks, unique APS object IDs and SDK initialization for authorized mounted-model groups. Real APS token checks: permitted model manifests/thumbnails 200, other model 401; two authorized models both 200 and unrelated model 401; another company cannot obtain either single/group access. Authorized original-file recovery preserves customer access and denies foreign access. Legacy unregistered models fail closed and eligible originals can regenerate safely; original-file download fallback remains.
- Verification: 557 tests / 113 suites, typecheck and optimized build pass; lint has no errors (four warnings in ignored QA scripts). Ready isolated Preview dpl_DaNBCUE4PKuWEVx6u2655TdCtqJ1 passed hosted data/provider tests. Staged Production dpl_EmQHJHnZtE1ohen8tAMbuyagnTek built successfully, passed authenticated Vercel/anonymous-app checks, and was promoted to latticeos.co; public login 200, admin redirects 307 and protected APIs 401. No Production customer/storage fixture, email or Live payment was created; Live checkout stays disabled. No migration/new production secret/CORS change.
- Native browser verification remained blocked because the Mac was locked; unlock was requested. No fresh file-picker/WebGL rendering certification is claimed. An extra P1 adversarial submission probe timed out and is not a passing validation test; subsequent model-access controls still deny foreign access. Other P1/P2 gates remain open.
- Updated shared context, TODO, decisions, feature map, original-audit supersession note, APS guide and docs/audits/p0-remediation-2026-10-13.md with sanitized retest evidence. Sync Git main to the released application patch; documentation-only successor commits do not change tested application behavior.


## 2026-10-14 — P0 browser retest follow-through

- Reopened the isolated hosted Preview after the Mac was unlocked; verified customer admin-route redirect in a real browser and saved operator CAD part switching/rendering.
- Corrected the QA geometry fixture: the hand-written STEP produced empty geometry. CAD-library exported rounded solids rendered with the existing private, resource-scoped token flow; both remain inaccessible to another company. No app patch or scope broadening required.
- Connected Chrome upload is awaiting file-URL access in the precise browser profile. No browser upload success is claimed yet. Updated P0 report and project memory with this current limitation and a dated-content hydration follow-up.


## 2026-10-14 — P0 native upload retests completed

- Completed Chrome’s normal Mac file-picker uploads after cancelling extension interception; the remaining window accepted a 7 MB solid STEP, 32 KB solid STEP and 5.2 MB drawing PDF. Viewed both PDF pages and saved specifications.
- Configured, reloaded and resumed a synthetic two-part draft; both private CAD models rendered with dimensions and saved drawing/material choices. Submitted the RFQ from the browser, verified SUBMITTED/two parts/three files, and compared all saved download hashes with the selected originals (identical).
- Both browser-created models return customer token 200 and foreign-company 404. Updated the P0 report, sanitized browser evidence, feature map and project memory. No app code, security permission, Production test data, email or payment changed in this follow-through. P1/P2 rollout gaps remain open.

## 2026-10-14 — P1 implementation, hosted verification pending

Implemented strict RFQ file/part/drawing validation; versioned shared-draft repair/quarantine and safe browser-cache reads; order/admin-scoped 25 MB direct quality uploads with atomic shipment recheck, attachment deduplication and approval invalidation; durable vendor overrides in Postgres; patched applicable dependencies and standardized npm. Configured the existing Stripe Test webhook with supported Vercel automation ingress and rotated the previously logged automation bypass value. Local 575-test/type/build checks pass; hosted retests and release remain pending. No Production customer mutations or Live payments performed.

## 2026-10-14 — P1 hosted verification and Production release

- Completed six confirmed P1 repairs F4–F7/R1–R2, including company-scoped malformed browser-draft recovery archives.
- Passed 576 automated tests/117 suites, typecheck, lint, optimized build and 48 customer-access tests/7 suites; repaired two stale paths in the customer-access command.
- Hosted tests reject incomplete submissions; repair/quarantine legacy drafts; upload 5/25 MB private quality documents with approval reset, duplicate safety and hash/ownership proof; native browser 5 MB upload also passed.
- Genuine Stripe Test provider delivery saved PURCHASED/PAID while the buyer browser was signed out; invalid signatures and duplicate deliveries were checked, one invoice persisted, and the full synthetic Test refund reached the app. No Live charge or customer email.
- Vendor edit persisted across independent Preview deployments; restored the synthetic baseline. The additive vendor schema was verified in the Production staged build.
- Promoted `dpl_LKRxRX56KSzo6DE1vZmomPPFqezZ` to latticeos.co after Production smoke checks. Application commits `a96a704`/`e3d8d39`; npm/Node24 contract, runtime audit zero advisories, unpatched development-only glob advisory documented. Live checkout disabled; P2/operational rollout gates remain.
- Updated shared memory, feature map and sanitized P1 audit/evidence.

## 2026-10-14 — Admin/customer separation review

Reviewed server role guards, company/file ownership and customer browser payloads; 45 focused tests pass. Found remaining internal supplier data serialization in customer Quotes and Orders despite deployed P0 admin-page guards. Recorded evidence and remediation requirements in `docs/audits/admin-customer-separation-2026-10-14.md`. No application or deployment changes; complete isolation is not certified.

## 2026-10-14 — Materials footer notes

Moved the catalog-coverage/RFQ availability note from the top banner to the footer directly above the reference-properties note. Both paragraphs inherit the existing footer font, 13px size, 20px line height and muted color; removed the banner icon/background. Local browser accessibility confirms both notes follow the family cards; targeted ESLint passes. Updated the feature map. No deployment.

## 2026-10-14 — Authorized workflow reset for operator audit

Cleared local/deployed workflow tables and verified preserved accounts/setup unchanged; removed 9 development and 3 Production RFQs, 23/1 drafts, local invoices/quotes/history and 48 active local uploads. Empty fallback JSON prevents demo reseeding. Cleared old local Chrome draft/deleted-quote caches; confirmed local/Production admin and customer Quotes empty and databases still zero after navigation. Restricted recovery artifacts are ignored outside app storage. Completed physical cleanup through the existing Cloudflare session (four Production R2 objects; verified bucket empty) and APS API (14 unique manifests/six sources; all known models 404; local APS source bucket empty). Cleared one Production waiting-list lead. Accounts/setup/configuration preserved. No action pending in the current browser profile; other profiles/devices need draft-cache cleanup before use. See `docs/audits/workflow-reset-2026-10-14.md`. No code deployment, external payment or email.

## 2026-10-14 — Apple Production Customer Member provisioned; invitation failed

At the user’s explicit request, added William Paik (paik.e.william@gmail.com) as CUSTOMER_MEMBER under Apple using the Production admin workflow. User explicitly authorized the standard invitation email. Verified durable membership, Clerk linkage and correct company/role; Apple now has two users and Production six total. Invitation was rejected by the email provider and persisted FAILED/provider-rejected with no sentAt; password setup remains required, temporary credentials expire October 17. Resend’s Lattice account shows the sender domain verified but no current accepted email/log entry for this attempt. Do not claim delivered or repeat Add user. Diagnose Production email authorization/configuration/limits and use reset-and-resend after remediation. No password or secret recorded; local accounts unchanged.

## 2026-10-14 — Production invitation delivery restored and Apple member invite delivered

Verified the existing local Resend key authenticates and latticeos.co is verified. Updated the existing shared Preview/Production RESEND_API_KEY secret via Vercel’s stdin-based update; branch-scoped Preview configuration was retained. Redeployed the exact currently running Production source dpl_BXe3TNJrxeQuwkrdRatoBL3JbedJ as dpl_AgLKLPVpd66MFuzmRMLux8yBJhYE; remote build Ready and latticeos.co alias verified. No workspace source upload or app code change. Through the live admin workflow issued a replacement temporary credential/invitation for the existing Apple Customer Member paik.e.william@gmail.com, under explicit user authorization. Database confirms SENT with provider message ID; Resend API confirms delivered to that address, subject You’re invited to Lattice. The old failed invitation was revoked by the normal workflow. No duplicate account, other-user reset or password/secret output. User only needs normal first sign-in/password setup from the delivered invitation; temporary setup expires October 17. Sanitized evidence and screenshot under ignored output/qa.

## 2026-10-14 — Entire admin RFQ row opens detail page

Expanded the existing RFQ title link across its table row using a native anchor overlay and full-row keyboard focus outline. Company-profile shortcut remains independent. Five quote workflow tests, changed-component lint, typecheck and staged Production build passed. Released isolated HEAD-based checkout with only the two row-link source files changed, excluding the unrelated local Materials edit. Staged login/auth checks returned 200/307 using existing Vercel access; promoted dpl_4RjyCrfQcSjmNetykwiFPgqz5sm3 to latticeos.co. Live browser verified middle-of-row navigation to Impeller RFQ detail, Apple company shortcut and Enter activation to A4589 1 detail. No RFQ/customer mutation or email.

## 2026-10-14 — Removed admin quote side inspector

Removed the queue’s duplicate RFQ inspector component, selection highlight and responsive two-column layout; retained full-row RFQ links and pricing/detail workflows. Five quote tests, changed-component lint, typecheck and remote Production build passed. Promoted isolated release dpl_8fsneoxWEbvWYqsYnoQ5WGT2suhC after authenticated staged route check (anonymous app user redirects 307). Live browser confirms no RFQ inspector, full-width table (2688/2688 px at sampled viewport), and full-row Impeller navigation. Updated feature map/decision/context; screenshot in ignored output/qa/admin-quotes-table-only.png. No RFQ mutation or email.

## 2026-10-14 — Admin RFQ submission date and user columns

Replaced Due/owner and Customer quote with Eastern submission date/time including EST/EDT and the submitting user’s name. Added deterministic date formatting and company-scoped legacy name resolution for the admin view; new submissions now save authenticated session name/email rather than user-supplied identity. No form fields/schema migration or historical database mutation. All 37 targeted tests in five suites, lint, typecheck and remote build pass, including DST/submit-event/name isolation and identity-spoofing regression checks. Promoted isolated release dpl_53DPonoVfbvRSs1kMc6sYp4Cbcsy. Live browser shows A4140 4:32 PM EDT / Will Testpaik, A4589 4:20 PM EDT / Will ClawPaik, Impeller 4:16 PM EDT / Will ClawPaik; click on new date cell opens correct detail. Screenshot output/qa/admin-submission-columns.png is ignored. No live test RFQ or email created.

### 2026-10-14 — Production RFQ account audit, first account completed

Authorized synthetic Production audit started through genuine customer Google sessions. Submitted PW-1/PW-2/PW-3 as paik.e.william@gmail.com and reviewed all six parts as will@latticeos.co. Independent 210 comparisons pass for saved/admin requirements and indexed file metadata. Found customer per-part process presentation using the aggregate request process and an admin PDF preview failure despite a byte-identical, parseable original. Remaining nine submissions/three customer sign-ins and broader access/file checks pending; no repair or deployment claimed. See `docs/audits/rfq-account-audit-2026-10-14.md` and ignored QA evidence. Existing user RFQs were preserved.

### 2026-10-14 — Production RFQ audit, second account completed

User completed Google sign-in as willclawpaik@gmail.com. Submitted WC-1/WC-2/WC-3 through genuine customer UI, then verified all six parts as will@latticeos.co. WC 216 independent comparisons pass (426 combined with PW); all nine WC original CAD/PDF downloads match source bytes/hashes. Genuine Apple admin company sharing, foreign Greno RFQ 404 and admin-queue redirect pass. PDF preview failure reproduced. Found server drawing validation misreading “no drawing required” in free-text notes; recorded rejected attempt and successfully retried after an equivalent CAD-only phrase. Six of twelve RFQs now submitted/admin-reviewed. Two Greno sign-ins/six submissions and broader file/access checks remain; no app repair/deployment performed. Updated durable audit and TODO.

### 2026-10-14 — Production RFQ audit, third account completed

User completed Google sign-in as willpaik99@gmail.com. Submitted W99-1/W99-2/W99-3 through genuine customer UI, then reviewed all six parts as will@latticeos.co. W99 220 independent comparisons pass (646 combined across three accounts); all eleven W99 original CAD/PDF downloads match source bytes/hashes. Genuine Greno customer admin is denied the Apple RFQ, its directly addressed CAD original, and the admin queue. Existing PDF preview failure reproduces; no new submitted-data mismatch. Nine of twelve RFQs/18 parts now submitted/admin-reviewed. Final ahoyyer member login/three RFQs, broader member/file checks, and eight remaining PW original hashes remain. No app repair/deployment performed. Updated durable audit/TODO; explicit final-account plan is saved separately from evidence.


### 2026-10-14 — Four-account Production RFQ audit completed with findings

Completed the authorized twelve submissions through genuine customer Google sessions (three each from both Apple accounts and both Greno accounts), then reviewed all 24 parts as will@latticeos.co. All selected requirements/part associations match across 840 comparisons; all 39 original CAD/PDF downloads are byte-identical. The final six models lack previews/derived metadata after Autodesk 403; staged retries after user-reported credits still failed (24 derived checks unresolved). Three confirmed app defects and provider failure are documented without source repair/deployment. Member company-sharing/file access and cross-company/admin denials pass for the recorded paths; no complete security certification. Existing three user RFQs preserved, twelve QA records retained, final admin tab filtered to QA. Exact cross-computer field/note/file/hash ledger is saved in `docs/audits/rfq-account-submissions-2026-10-14.json`; full report in `docs/audits/rfq-account-audit-2026-10-14.md`.

## 2026-10-14 — Repair RFQ audit findings and identify Autodesk capacity blocker

Repaired and released per-part customer process display, PDF preview reads through the authenticated app origin, and false drawing validation from negated/free-text notes. Added structured drawing flags and correct flag restoration, legacy exact-line support, a saved-original admin CAD retry, and a clear APS capacity refusal. Production browser verification confirms correct mixed processes, working test PDFs and the provider refusal while originals remain available. Full suite passed at 588 tests before the final narrow prefill change; final focused regressions, lint/typecheck and hosted build pass. The provider body identifies `ProductAccessRequiresCapacity`; William confirmed added credits were Codex credits. Autodesk APS/Flex capacity restoration is required from the account owner; six models and persisted URN/dimension backfill remain outstanding. Release `dpl_FboVWTNXMVUuxkBmZ1oLvk9ijLDN`. Details: `docs/audits/rfq-audit-repairs-2026-10-14.md`.

## 2026-10-15 — RFQ export declaration advances on selection

Updated the CAD-selection popup so choosing the unrestricted option immediately advances to the Prototype/Commercial question; the export page no longer asks for a separate Continue click. Prototype/Commercial remains an explicit choice and Continue action before Configure. Choosing the restricted option stays on the refusal message. Updated the operator-facing feature map and the existing RFQ workflow test. Release check passed: all 31 request-form tests, typecheck, changed-file lint, `git diff --check`, and the production build. Deployment was not part of this check.

## 2026-10-15 — CAD demo adds common mesh and glTF previews

Extended the admin-only browser CAD demo to preview STL, OBJ, glTF, and GLB alongside STEP/IGES using Three.js loaders. Files remain local to the browser; STL/OBJ show unitless model dimensions, glTF/GLB meter dimensions are converted to millimeters, and unsupported external glTF sidecar assets produce an actionable error. Updated supported-format UI, validation, feature map and focused importer tests. Twelve focused tests pass; typecheck, changed-file lint, whitespace check and production build pass. Smoke-parsed STL, OBJ, embedded glTF and GLB triangle fixtures. Deployed to Production as `dpl_GsCiXoaDVpAMdknHWQf4kS6mDqUy` with aliases `latticeos.co` and `www.latticeos.co`. Live browser QA confirmed STL, OBJ, embedded glTF and GLB files render; glTF/GLB meter dimensions convert to millimeters. External glTF companion assets remain intentionally unsupported with a clear prompt to use a self-contained GLB. Screenshot: `/tmp/lattice-cad-viewer-formats.png`.


## 2026-10-15 — CAD demo lists accepted upload formats in the viewer

Added an always-visible accepted-file-types line directly below the CAD viewer controls, listing STEP/STP, IGES/IGS, STL, OBJ, glTF and GLB, plus the 50 MB per-model limit. Updated the operator feature map.

The final Production deployment `dpl_Fj6qCsSZR8nGjVVkaffQ8muYSEgS` was built from commit `3f03b97` with the current Vercel Production environment and promoted to `latticeos.co` on 2026-10-15. The earlier working-tree deployment was superseded by this commit-backed release. Vercel build, typecheck, all 31 request-form tests, targeted lint and diff checks passed. Browser reload confirmed the signed-in `/requests/new` route loads from the promoted deployment; no live RFQ was submitted and no customer CAD file was uploaded. The release contains the quote-request declaration flow, the admin CAD demo's additional import formats, and the materials catalog note relocation.
## 2026-10-15 — Expand customer CAD intake formats

Added STL, OBJ, glTF and GLB to the customer CAD file picker and shared server-side upload/submission validation. Existing 200 MiB upload limit remains. Automated tests cover all four accepted formats, picker extension values, and the unchanged drawing/unsupported-extension rules. Customer preview requests still use the existing Autodesk pipeline; routing the formats supported by the local demo through browser rendering remains follow-up work. The demo's 50 MiB cap is a separate browser-processing safeguard, not a Vercel or Autodesk limit; increasing it can multiply browser memory use and processing time and needs device/file-size testing.

## 2026-10-15 — Hybrid RFQ CAD viewer with 200 MiB local processing

Integrated the demo's shared OpenCascade/Three.js viewer into customer file selection, restored drafts, customer quote detail (on-demand View 3D), and admin RFQ review. STEP/STP, IGES/IGS, STL, OBJ and embedded glTF/GLB bypass APS translation/status/thumbnail calls, including older saved files with APS URNs. Accepted native SLDPRT/SAT/X_T/X_B/IPT remain on APS. As explicitly chosen by William, local failures keep originals and show a preview error with no Autodesk fallback. Local parsing and customer upload validation share the existing 200 MiB cap (UI label 200 MB); drawings already use the same cap. Workers serialize conversions, transfer typed geometry buffers, support cancellation/timeout, and skip costly optional edges on large meshes. Saved CAD streams through the existing authorized, private/no-store file route; cross-company access gates remain.

Verification: all 633 tests in 123 files pass; typecheck, changed-file lint and production build pass. Full repository lint still reports pre-existing/generated vendored OCCT errors; changed source files are clean. Browser rendered STEP, IGES, STL, OBJ, embedded glTF and GLB and an exact-200-MiB synthetic OBJ. That large fixture has one triangle plus padding and verifies the byte boundary, not realistic complex-model memory/performance. Customer glTF upload and saved-draft reopening render correctly with mm metadata. Unitless STL/OBJ do not persist invented mm dimensions. Routing/error tests verify no APS fallback and access-control tests deny foreign saved-file reads. No Production RFQ submission or provider conversion was made during these checks. Screenshot: `/tmp/lattice-hybrid-customer-preview.png`. Native APS live conversion remains dependent on restoring account capacity; representative complex-model/lower-memory device testing remains follow-up. Release status is recorded below after deployment.

Release: application commit `d84d68f` is Production Ready as `dpl_9ifRDmjCSFqabD7AVpEMDEs1i6rY` (`https://lattice-jgd38tg1e-willpaikstacks-projects.vercel.app`), promoted to `latticeos.co` on 2026-10-15. Hosted login/worker reads return 200 and the hosted OpenCascade worker bytes match the tested source. Authenticated Production verification reopened existing Impeller RFQ `rfq_1e49a08c7533f7cae2b897aeae5471ad49dc054b` from private storage in the local viewer; visible dimensions 254.08 × 254.08 × 127.00 mm match the prior saved envelope. Demo shows the new 200 MB cap. No request/customer records were edited. Production screenshot: `/tmp/lattice-hybrid-production-rfq.png`. Initial error-log scan found only three PostgreSQL SSL-mode deprecation warnings, no observed application failures; this was a short smoke-check window, not ongoing monitoring.

## 2026-10-15 — Quote configuration submission guard, delivery date and draft reassurance

Removed implicit RFQ form submission and moved the submit action to the explicit Request Quote click handler. Enter is blocked on that button, while dropdown selection and notes keep normal keyboard behavior. Added regression coverage for repeated Enter, implicit form submits, successful explicit clicks, payload dates and saved draft preservation. The mismatched intended-use warning now explains that current progress is saved as a draft and a new quote opens in another tab. Renamed the per-part ManufacturingDetails JSON field to targetDeliveryDate across form state, draft snapshots/restoration, server validation, persisted parts, admin review and quotation workbench. Updated label/calendar/help text to preferred arrival; legacy targetShipDate remains readable, new/blank delivery values take precedence, and old draft keys normalize on read. Added an idempotent SQL backfill and explicit-environment runner for submitted-part JSON; no new physical DB column is necessary for the existing manufacturingDetails JSON column. Local backfill found zero legacy part rows.

Browser QA: a ready synthetic local glTF draft remained unsubmitted after material-picker Enter selection and repeated Enter on Request Quote. The delivery calendar and Oct 29 selection work; the different-use part warning shows saved-progress/new-tab copy and blocks Continue. No live RFQ was submitted. Screenshot: /tmp/lattice-quote-progress-warning.png. Full-suite and release results are recorded below.

Release verification: all 638 tests in 123 files, typecheck, changed-file lint, whitespace checks and local/hosted builds pass. Application commit `c61b057` is Ready Production deployment `dpl_83fU1hTTyKAg29PuKtavqy6Q4dkq` (`https://lattice-p6z87kid6-willpaikstacks-projects.vercel.app`), promoted to latticeos.co on 2026-10-15. Hosted login returned 200. Production JSON backfill updated 28 part records; an independent per-record before/after deep comparison confirmed all date values and other manufacturing fields were preserved. A second migration updated zero rows, confirming idempotence. Persisted draft keys normalize lazily on read/write for browser/shared drafts. Authenticated admin verification shows Target delivery date (customer preference), retaining 2026-10-29 on existing RFQ rfq_92bed209fa39ff6aa4119880737c33ee492a6a37. Screenshot: /tmp/lattice-delivery-date-production.png. Initial deployed error-log scan returned zero records; this is a short smoke check, not an ongoing monitoring claim. No RFQs, customer records or emails were created by verification. Local synthetic draft material/date edits remain saved.

## 2026-10-15 — Customer quote activity copy

Updated the buyer quote activity timeline and derived customer notification feed to use conversational second-person copy, label customer actions as `You`, and name quote acceptance `Order placed`. The order detail says the accepted quote is ready to track; repository purchase handling confirms acceptance changes the request to `PURCHASED` and creates the order. Removed `Supplier pricing started` from the customer quote activity timeline and retained it as an internal lifecycle transition; submission copy now conveys review and supplier pricing collection without implying a separate wait step. Changed the activity subtitle to `Updates on your quote request` and updated the feature map and notification spec. Release verification and Vercel deployment results are recorded after completion.

Release verification: typecheck, changed-file ESLint, `git diff --check`, and local/hosted production builds pass; automated tests were not run. Vercel Production deployment `dpl_3ypg7rpL6vdMnSajiiovYEcG15k5` is Ready and aliased to `https://latticeos.co`. It was deployed directly from the working tree because the Vercel API connector lacked team-scope access; the authenticated Vercel CLI succeeded. The signed-in Production quote detail rendered the new `Updates on your quote request`, `Request submitted`, `You` attribution, and second-person submission copy, with no supplier-pricing event in the activity list. No RFQ or order data was changed.

## 2026-10-15 — Remove quote activity actor labels

Removed the redundant `You`/actor badge beneath each quote activity entry; the conversational descriptions still identify customer actions in the sentence. Updated the buyer quote feature map. Typecheck, changed-file ESLint, `git diff --check`, and local/hosted production builds pass; automated tests were not run. Production deployment `dpl_GBa91veZUAXKRWtRWPa3xpuMejjg` is Ready and aliased to `https://latticeos.co`. Reloaded the signed-in Production quote and confirmed the activity entries no longer have actor labels. No RFQ or order data was changed.

## 2026-10-15 — Make quote creation activity conditional

Changed the draft-created activity description to identify the quote by its customer-facing quote ID. It includes the remaining-details/submission reminder only while the request is still an unsubmitted draft; submitted and later-stage requests show only that the quote request was created. Applied the same behavior in the customer notifications feed and updated the feature map. Typecheck, changed-file ESLint, `git diff --check`, and local/hosted builds pass; automated tests were not run. Deployment result is recorded after release.

Release verification: deployment `dpl_45oPwHLd1aiUiAxc9rMMR5xppMn5` is Ready and aliased to Production at `https://latticeos.co`. Reloaded the signed-in quote detail and confirmed the submitted RFQ says `LQ-RFQ_73E7 was created.` with no submission reminder. Checks passed as listed above; no customer data was changed.

Release verification: neutral activity copy is deployed as `dpl_F77GTYgbyuckznd5ZU9dUGGyX9NM`, Ready and aliased to `https://latticeos.co`. Reloaded the signed-in Production quote page and confirmed the event descriptions contain no second-person language. Typecheck, focused lint, whitespace check, and local/hosted builds passed; automated tests were not run.


## 2026-10-15 — Local CAD viewer screenshot thumbnails

Added isometric 384px PNG capture immediately after local geometry renders. Intake waits for the saved original key before persisting the screenshot; saved customer/admin viewer openings also capture images. Quote lists, draft continuation and quote detail use the shared thumbnail component. Missing legacy images are generated serially from the authorized saved originals; duplicate queued views recheck storage before parsing, and geometry is disposed after capture. Available screenshots copy with draft-to-RFQ promotion. The new API authorizes against the original, bounds request bytes and decoded pixels, re-encodes PNGs with metadata stripped and serves private/no-store images. No schema migration or Autodesk call is required.

Verification: 34 targeted tests and 52 customer-access workflow tests pass, including foreign/anonymous read/write denial, invalid/oversized/origin rejection, real PNG normalization, draft promotion byte preservation and serial/cancelled thumbnail work. Local browser verification rendered the sample STEP model and its actual screenshot. Production verification and release details follow after deployment.

Release: application commit `9184b6c` is pushed to `origin/codex/opencascade-admin-demo` and deployed as Production Ready `dpl_7KiJXE2nff45dJoauEuw1GRD5Cbq` at `https://latticeos.co`. Hosted build and changed-file lint pass. Signed-in Production Quotes verification generated distinct actual images for A2341.STEP, QA-PW-2-P2.step and submitted QA-AH-3-P1.step. Each image loaded as 384px; after reload all three loaded directly from their private thumbnail URLs at revision 0 with zero active model canvases, confirming durable screenshot reuse and geometry cleanup. The only Production writes were derived screenshots; no RFQ fields, original files, orders or emails changed. Other legacy thumbnails generate as their rows are viewed. The temporary synthetic local verification route was removed before deployment.


## 2026-10-15 — Restore compact CAD viewer design and inspection tools

The local-renderer integration had reused the admin demo interface (440/560px canvas, text buttons and duplicate dimension footer) instead of preserving the existing Autodesk presentation. Restored the compact 320px rounded viewport, subtle light background, orientation cube synchronized with camera orbit, Home/standard views and bottom icon toolbar. Per William’s explicit follow-up, added local surface point-to-point Measure with mm/in conversion and unitless labels, independent-mesh Explode with adjustable separation, and X/Y/Z Section with adjustable position/reversal. Tool switches and Home clear temporary inspection state. Single-body explosion is disabled. Loading/error frames use the same size, and the existing private thumbnail capture still takes an isometric model-only screenshot before interactive tools.

Local browser verification used two synthetic 20mm bodies: standard views, point selection, a 15.863mm distance converting to 0.625in, body explosion and section clipping rendered correctly. A single unitless body disabled explosion and measured in model units without a physical-unit selector. The restored scene still captured a real 384px screenshot. These tools inspect tessellated surfaces; geometric feature snapping and capped solid sections are not implemented. The temporary synthetic verification page is removed before release. Final automated/release results follow below.

Pre-release checks: 36 focused viewer/thumbnail/storage regressions and 52 customer-access workflow tests pass. TypeScript, changed-file ESLint, whitespace checks and the local production build pass. Browser-only temporary fixtures were removed before the build; no customer RFQ, original file or purchase data was changed by local verification.

Release: application commit `1f7ddde` is pushed to `origin/codex/opencascade-admin-demo` and deployed as Ready Production `dpl_BqvyX7pr1XaBMXgcDwbrhSe5gmeB` at `https://latticeos.co`. Hosted build passes. Signed-in Production verification reopened the existing A2341 draft, measured the viewer DOM height at 320px, confirmed one model canvas and all three inspection controls, opened/reset Section, and observed no browser console errors. The single-body model correctly disables Explode. Draft configuration and its 48.26 × 35.26 × 48.26mm envelope remain visible; no RFQ was submitted. Screenshot capture continues through the existing private derived-image path. Native Autodesk previews retain their original implementation.

## 2026-10-15 — Confirm quote activity applies across customer accounts

Investigated the reported legacy Quote activity screenshot for willclawpaik@gmail.com. Fresh Production navigation to WC-3 (`rfq_8bf7c6a0beee28eca3c31d2629a020e4ec88f4fb`, matching the October 14 9:31 PM timestamp) shows the neutral creation/submission descriptions, updated subtitle and no actor labels. The shared buyer quote component and customer dashboard/notification helper already derive customer copy from status transitions instead of historical event descriptions, with no account-specific branch. Existing Production deployment `dpl_BqvyX7pr1XaBMXgcDwbrhSe5gmeB` includes this behavior. An older loaded page is a plausible explanation for the screenshot; the exact customer's browser session was not available for inspection.

Updated stale notification test expectations and a stale CAD-thumbnail assertion. Added regression coverage for two customer email identities, including the reported address, with deliberately obsolete stored event copy; verifies neutral timeline text, no Buyer/You labels and no post-submission reminder. All 28 focused tests pass. No workflow records or customer email were changed. Release confirmation follows.

Release confirmation: commit `a5b4497` pushed to Git and deployed as Ready Production `dpl_6fAL8Pazp3AzurHaUQBA4QMdJPXM`, aliased to `https://latticeos.co`. Hosted production build passes. Reloaded the reported WC-3 quote after deployment; neutral activity remains visible with no actor badges. Typecheck, focused ESLint and whitespace checks pass.

## 2026-10-15 — Match quote preparation to customer controls

Reused the customer TargetDatePicker for estimated delivery and quote expiration; added optional label, helper text, hidden form-field name and clear-button configuration while retaining customer-intake defaults. Replaced shipping speed/terms native selects with the shared customer CustomSelect, keeping option values, shipping lead-time calculations, dirty-state detection and named submission fields. Quote expiration retains the 15-business-day default, now editable with a calendar. Both issuance action and repository validate and preserve explicit expirations on/after the issue date instead of replacing them. Cancel-edit resets the new controlled shipping/delivery values to the saved quote. Feature map, project context and decision updated. Typecheck, focused ESLint and whitespace checks pass. Automated tests were not run. Local browser preview requires a separate development sign-in; no customer RFQ was issued or changed.

Release confirmation: app commit `92125a3` pushed to Git and deployed as Ready Production `dpl_2vpPnWpK1WU8pWmJpccyUw7YoVUQ`, aliased to latticeos.co. Hosted production build passes. Reloaded the requested admin RFQ page, opened Edit quote, both date calendars and shipping terms dropdown, then canceled editing without saving or sending a quote. A quote v1 was already present on reload (created outside this agent’s actions); it was preserved. Captured local UI evidence in output/qa (untracked).

## 2026-10-15 — Identify RFQ submitter in quote preparation

Added Submitted by to the quote preparation header alongside Customer, Reference and Process, using the saved requesterName rather than the signed-in operator. Archived RFQ details also display the name, with Name not recorded for missing historical values. Updated the operator feature map. No request data or schema changes.

Release confirmation: app commit `9f22779` pushed and deployed to latticeos.co as Ready Production `dpl_21H4wGGYoKcs9zED5juQYFxm9Rvn`. Typecheck, focused ESLint, whitespace checks and hosted production build pass; automated tests were not run. A separate read-only browser tab verified Submitted by Carmen Practice alongside Greno Industries on the requested RFQ. No quote fields or workflow data were changed.

## 2026-10-15 — Include submitter email in quote preparation

Added Email next to Submitted by in the admin quote preparation header and archived RFQ details, sourced from the RFQ requesterEmail. Missing legacy values display Email not recorded. Updated the feature map. User explicitly confirmed Git push and Vercel production deployment. No request data changes or emails sent.

Release confirmation: app commit `cc5834b` pushed to Git and deployed as Ready Production `dpl_634MfhULZNhGfN5v9fz5bBHaM3bW` at latticeos.co. Typecheck, focused ESLint, whitespace check and hosted production build pass. Automated tests were not run. A fresh read-only browser tab verified the saved requester email beside Carmen Practice in the requested RFQ header; screenshot evidence remains untracked in output/qa. No RFQ data changed.

## 2026-10-15 — Require complete quote preparation before issuance

Added a shared client/server quote preparation validator covering each unit price, each positive whole-number part lead time, explicit shipping cost, allowed shipping speed/terms, real delivery and expiration dates, expiration on/after issuance, and a nonblank customer note. The workbench disables Issue/Save updated quote and lists invalid/missing fields. Explicit form submission is guarded; the authenticated server action rejects incomplete or manipulated payloads before persisting or sending email. Customer note and lead-time inputs are controlled; cancel editing resets notes to saved values. Removed the generic note fallback and updated blank-shipping copy. Numeric amounts retain existing nonnegative/two-decimal/integer-storage limits. Typecheck, focused ESLint and whitespace checks pass; automated tests were not run. Feature map and decision updated.

Release confirmation: app commit `80a96ba` pushed and deployed as Ready Production `dpl_4X6bGuHxeqKpm5LA3tq6okaPmc58` at latticeos.co; hosted build passes. A separate browser tab verified the requested AH-2 RFQ starts with issuance disabled and a completion list. With all fields filled using transient verification values, issuance enables; clearing either part price, either part lead time, shipping cost or customer note disables it again. A whitespace-only note and expiration before the issue date are blocked. Missing terms/delivery were also shown as blockers while filling. Explicit shipping 0 is accepted. Closed the temporary tab without issuing, saving or emailing a quote; the user’s original tab and saved RFQ remain untouched. Screenshot evidence is untracked in output/qa.

## 2026-10-15 — Make account settings operational and audit propagation

Repaired direct profile-photo selection so it opens the preview/save dialog; added visible invalid/oversized-file feedback and durable image URLs, fixed unchanged-photo saves that could delete the image, and added initials restoration. Extracted shared photo/emoji/initials rendering for settings and the sidebar. Clerk's generated default image no longer masks an explicit preset. Real local browser upload/save/reload showed two loaded durable images; an emoji save/reload also appeared in both locations. The original slate/wave avatar was restored and verified through Clerk.

Account actions validate and save only the edited column group, resolve identity/company/permissions on the server, and refresh the shared layout. Personal names update Clerk and the linked User; phones remain user-scoped. William approved shared shipping/billing/AP default editing for Customer Admins and Lattice Admins, with company renaming remaining Lattice Admin-only. Members retain personal editing. Legacy user-owned company defaults are cleared after adoption. Support sessions cannot edit the operator's personal profile under a customer name or attribute the operator's avatar/identity dates to the customer. Fixed verified-without-timestamp display. Account Summary uses Company and omits currency.

Added Request.billingSnapshot JSONB and an explicit idempotent migration. New submissions, including old draft submissions, resolve current shipping and billing defaults on the server. Quote, checkout, order and invoice paths retain request-owned billing/contact/shipping snapshots; even blank legacy shipping fields no longer borrow later defaults. An in-review RFQ's explicit shipping editor starts from that RFQ and updates only its snapshot. Issued quotes no longer link a Change action to shared defaults. Existing Invoice snapshots remain unchanged. Historical billing was not previously recorded on RFQs; migration can only freeze current company billing for missing snapshots. Local database migration ran twice and found zero existing billing snapshots to backfill. Production migration/deployment remain pending.

Replaced direct password editing with an email-prefilled Reset password link. Repaired existing recovery to atomically claim the single-use token, update linked Clerk credentials/sign out other sessions, then synchronize local credentials/audit. Added policy/service error states. The browser reaches the recovery page with the correct visible email; no reset email was sent and no real password changed.

Verification: 121 focused tests in 13 files pass, including authenticated name writes/failures, stale-save protection, permissions/company boundaries, avatar persistence/failures, request API/persistence, quote/checkout/order snapshots, invoice billing, password policy/provider failures and token contention. The opt-in real PostgreSQL audit passes and confirms personal/shared persistence, another member's shared defaults, cross-company isolation, a completely unchanged old RFQ after all edits, fresh new RFQ snapshots, one-time legacy billing backfill/repeat-run preservation and full rollback; a post-transaction query confirms zero audit companies remain. Actual local phone form/action/database/reload also passes; original blank phone was restored and independently verified in PostgreSQL. Typecheck, changed-file ESLint, whitespace checks and final local production build pass. A driver concurrency-deprecation warning occurred in Prisma's relation reads during the database audit; assertions and rollback pass.

Full-suite checkpoint: 655 pass, 11 fail, 1 opt-in test skipped. All 11 failures reproduce against a clean starting-commit archive: seven admin quote-action expectations, two quote-workbench tests and two notification-copy tests reflect earlier unrelated changes. Final settings refinements are covered by the later focused run. No Production changes, customer RFQ/order edits or emails were made. Source and release limits: docs/audits/account-settings-2026-10-15.md. Browser evidence: /tmp/lattice-settings-photo-verified.jpg and /tmp/lattice-settings-final.jpg. Updated PROJECT_CONTEXT, DECISIONS, TODO and the feature map.

## 2026-10-15 — Release account settings and repair baseline tests

William authorized Production migration/deployment, hosted Apple Admin/Member verification, recovery for willclawpaik@gmail.com and repair of the 11 baseline failures. Reconciled commercial-input fixtures and required-field/zero-price/expiration/notification assertions; full suite now passes 677 tests with one opt-in DB test skipped. The earlier explicit PostgreSQL rollback audit passed. Typecheck and focused lint pass.

Production additive migration backfilled 15 billing snapshots; repeat run updated zero. Independent deep comparisons preserved every other Request field and all existing invoices (zero rows). Pushed source 6f05bfd and packaging 2cdac4f; hosted build passed and dpl_G4gNx6XcserXJMyV5rEheNFan6en was promoted to latticeos.co. Deployment uploads now exclude local audit/design outputs.

Genuine Apple Customer Admin UI plus Production reads verified personal/shared settings persistence, provider-backed photo reloads, emoji rendering in settings/sidebar and fresh RFQ snapshots. Submitted identifiable synthetic RFQ rfq_f18ce944786a6fcd3439d5c24ce09744b9cd3bb0 using the repository demo cube, with explicit no-manufacturing/no-outreach notes. Restored all original account/company settings and initials avatar. The new RFQ retains its audit snapshots after restoration; all 15 earlier RFQs remain unchanged except the authorized additive backfill. No quote issuance or purchase. Short-window deployment logs show zero HTTP 500+ responses; stderr contains only observed pg/Node deprecation warnings.

Requested authorized recovery email and confirmed persisted unconsumed token; inbox receipt and user-driven password completion remain unconfirmed. Credential-change browser policy requires user handoff. Genuine Member verification also awaits user sign-in as paik.e.william@gmail.com in the retained login tab. Updated audit report, project context, TODO and feature map to distinguish released behavior from those remaining checks. Local screenshots are /tmp/lattice-settings-production-photo.jpg, /tmp/lattice-settings-production-restored.jpg and /tmp/lattice-settings-production-rfq.jpg. Private baselines/proof remain ignored in .vercel.

## 2026-10-15 — Complete Member and password recovery handoffs

William confirmed signing into paik.e.william@gmail.com and receiving/completing the reset for willclawpaik@gmail.com. Genuine Production Member settings show Apple defaults with no shared-edit controls and enabled personal controls. A temporary phone save survives reload; original blank phone restored through the UI and independently confirmed in Production. The Member also sees the QA RFQ's preserved shipping/billing/AP snapshots after company-default restoration. Screenshot: /tmp/lattice-settings-production-member.jpg.

Production confirms the recovery token consumed at 8:28:19 PM Eastern before expiry, updated passwordChangedAt, mustChangePassword=false and PASSWORD_RESET_COMPLETED after Clerk accepted the credential update. William performed password entry/submission. A separate new-password sign-in was not independently exercised. Updated current audit/project/TODO/feature-map status to close the user handoffs. No application code changed or tests rerun; previous 677 passing tests remain the release checkpoint.

## 2026-10-15 — Improve account settings entry and recovery ownership

Implemented formatted phone input/read view with complete-number validation, stricter shared client/server billing-email syntax validation and disabled invalid saves. Bound signed-in recovery to the verified Clerk primary email; arbitrary query/form emails cannot choose another account and token completion checks signed-in ownership. Public signed-out mailbox-token recovery remains available. No recovery email sent or credential changed.

Added persisted Company/AccountDefaults billingSameAsShipping choice with matching checkbox in settings/onboarding. Enabling copies server-owned shipping; subsequent shared shipping edits update linked billing under serialized company transactions. Unchecking allows independent billing, and historical request/invoice snapshots remain unchanged. Added an explicit idempotent additive migration and applied to Development/Production without changing existing address values.

Added reusable shipping/billing fields with U.S. state/territory suggestions, authenticated city/ZIP lookup from bundled zipcodes data and explicit manual fallback. Selection fills city/state/ZIP together; street fields use browser address autofill, with no external street-search provider. Typecheck, focused lint and local build pass. Automated tests were not added or run. Release/hosted evidence follows.

## 2026-10-16 — Release account settings usability follow-up

Source 1d5877c pushed and deployed as Ready Production dpl_Bz8CdC7v4JduhdfPQZZ7uoRbRmir, promoted to latticeos.co. Hosted build passes. Genuine Member browser confirms formatted synthetic phone input, fixed signed-in recovery email despite a different URL email, postal suggestion retrieval/selection and unrestricted manual address entry. All transient edits canceled; no account/RFQ field, credential or email was changed. Evidence: /tmp/lattice-settings-phone-format.jpg, /tmp/lattice-settings-reset-bound.jpg and /tmp/lattice-settings-address-suggestions.jpg. Admin sign-in was pending at this checkpoint; completion is recorded below. No automated tests were run for this follow-up.

### Account settings Admin verification complete — 2026-10-16

Genuine willclawpaik@gmail.com Customer Admin checks pass. Preserved the user's current Erin Paik profile, picture, phone and company details. Invalid billing email disables Save; a valid plus-address enables it; all email drafts canceled. Saved same-as-shipping, confirmed its true Company flag and matching address fields in Production, and reloaded to see Same as shipping. Existing addresses already matched. Restored the original false preference through the UI and confirmed in database and after reload. Billing fields also show live postal suggestions. No distinct shipping value was changed to exercise the follow-on copy in Production; that remains implemented in the serialized server path.

Independent deep comparison preserves all 17 pre-check Request rows and every original shared address/AP contact/routing-note field; preference restored. Private proof stays ignored in .vercel. Zero HTTP 500+ records in the short observed deployment window. Evidence: /tmp/lattice-settings-invalid-email.jpg and /tmp/lattice-settings-linked-billing.jpg. No recovery message sent or credential changed. No automated tests run for this follow-up. Final settings inspection draft canceled; user can enable linked billing when desired. No remaining user handoff.

## 2026-10-16 — Remove embedded RFQ sidebar and make shop optional

Removed the Active RFQs navigation panel inside the quote preparation workbench and its layout column, obsolete styles and switch helper. Preserved global navigation, Review queue and the customer quote summary. Shop name now states optional and offers No shop selected instead of implicitly choosing the first vendor. Generic unassigned supplier metadata renders blank, and server issuance does not silently restore an earlier shop after a blank selection. No quote was issued, saved or emailed. Focused lint and typecheck pass; automated tests were not run. Release verification follows.

Release confirmation (2026-10-16): source a17ffd6/9a3b1fd pushed and released as Ready Production dpl_8SsFm13ehsEEd6BffUjSdNCCPhMo at latticeos.co. Final hosted check on A7476 confirms shop value empty, required=false, first option No shop selected, zero embedded RFQ queue nodes, and preserved global navigation/quote summary. Focused lint, typecheck and hosted build pass; automated tests were not run. No quote saved, issued or emailed. Screenshot: /tmp/lattice-quote-prep-final.jpg. Browser review caught and removed a second first-vendor fallback before final completion. An initial unpromoted workspace deployment was discarded; the release was built from a verified committed-source archive excluding unrelated uncommitted address-editor work. Those local changes and their memory-file updates remain intact.

## 2026-10-16 — Split submitted RFQs and issued customer quotes

Separated the admin Active queue into Submitted RFQs and Customer quotes issued tables with independent headings/counts/empty states. Both retain the existing RFQ/customer links, package/provenance columns and shared filters. Submitted/information-needed/supplier-ready statuses remain in the first table; QUOTED records move to the second. Updated the first summary metric to count only RFQs awaiting issuance; Drafts/Archive retain their views. No request records/statuses changed. Focused lint and typecheck pass; automated tests were not run. Release verification follows.

Release confirmation (2026-10-16): source 7cf4ad8 pushed, hosted build passed, and dpl_BxaCczsSFJSQ1jYSbCThyiv3BMFG promoted to latticeos.co. Built from a clean committed-source archive, excluding unrelated uncommitted address-editor changes. Genuine Admin browser confirms two Active tables: 15 Submitted RFQs (all currently SUBMITTED) and 2 Customer quotes issued (all QUOTED), with 17 unique RFQ detail links. Search WC-2 yields 0 submitted/1 issued; QUOTED stage yields 0/2. Archive and Drafts views render correctly; restored unfiltered Active. No requests/statuses changed, quotes issued or emails sent. Screenshot: /tmp/lattice-quote-tables-final.jpg. Typecheck, focused lint and hosted build pass; automated tests were not run.

## 2026-10-16 — Remove quote operations summary cards

Removed the top metric-card section from Quote submissions, its unused card definitions and icon imports. Queue controls and separate submitted/issued tables retain their counts. Shared metric styles used elsewhere are preserved. Focused lint/typecheck and release evidence follow; automated tests were not run. No request data changed.

Release confirmation (2026-10-16): source 4388798 pushed and deployed from a clean committed-source archive as Ready Production dpl_4LeAnUKpDHdxCMUbfgqoiisjfSZj, promoted to latticeos.co. Genuine Admin browser confirms zero Quote operations summary sections, retained filters/view tabs, and separate tables with 15 submitted and 2 issued records. Focused lint, typecheck and hosted build pass; automated tests were not run. No request data changed. Screenshot: /tmp/lattice-quote-no-cards.jpg. Unrelated address-editor changes remain local and untouched.

## 2026-10-16 — Add admin Users and rename Customers to Companies

Added the Lattice Admin-only /admin/users sidebar page, backed by all provisioned User rows without company/role exclusion. Includes searchable/filterable read-only name/email, role, company links, sign-in setup and creation dates. Server-only data access and page guards authorize before querying; explicit select/mapping excludes credentials/tokens/provider IDs from client data. Renamed existing Customers directory navigation, heading, create/search/filter/empty/footer labels, browser title and company-profile breadcrumb to Companies, retaining existing URLs. Production read-only baseline confirms six accounts across all three roles, including one unassigned admin. Typecheck and focused lint pass; React accessibility/data-flow checklist reviewed. Automated tests were not added or run. No user/company records changed or invitations sent. Release evidence follows.

Release confirmation (2026-10-16): source b6c8a9a pushed and deployed from a clean committed-source archive as Ready Production dpl_Hy9864p5ChTfLEqxviRUy8VdqpDH at latticeos.co. Hosted Admin view shows all six provisioned accounts, matching Production counts (1 Lattice Admin, 3 Customer Admins, 2 Customer Members). Verified email search, role filter (2 members), unassigned-company filter (1 Lattice Admin), empty search, Clear filters and restored full list. Sidebar clicks correctly open Companies/Users; Companies title, heading, breadcrumb and Create company copy are updated. Genuine Customer Admin willclawpaik@gmail.com direct /admin/users navigation redirects to its dashboard without rendering the directory. No invitations sent or account/company records changed. Typecheck, focused lint and hosted build pass; automated tests were not run. Screenshots: /tmp/lattice-admin-users-final.jpg and /tmp/lattice-admin-companies-final.jpg. Unrelated in-progress address-editor work is excluded and remains local.


## 2026-10-16 — Simplify quote queue and RFQ review

Removed the quote queue search box, stage filter and owner filter, including their state, filtering logic, unused styles and stale empty-state instructions. Active/Drafts/Archive tabs, sorting and separate submitted/issued tables remain. Removed Assigned owner from RFQ operator review and its unused hidden workbench input; server quote saves already preserve historical owner data. Updated intake next-action copy. Typecheck and focused lint pass; React component checklist reviewed. Automated tests were not added or run. Release evidence follows.


Release confirmation (2026-10-16): source 7e8be39 pushed and deployed from a clean committed-source archive as Ready Production dpl_6ZyaUqg3fftx5dGY78otbs7mVY5M, promoted to latticeos.co. Fresh genuine Admin browser confirms zero queue search/stage/owner controls, 15 submitted and 2 issued rows, working Drafts/Archive/Active tabs, and no Assigned owner in the RFQ operator review (Review status remains). Typecheck, focused lint and hosted build pass; automated tests were not run. Screenshots: /tmp/lattice-quote-queue-simplified.jpg and /tmp/lattice-rfq-review-no-owner.jpg. No RFQ data changed; unrelated address-editor work remains local and excluded.


## 2026-10-16 — U.S. street autocomplete and address contact phones

User chose U.S.-only address lookup and a separate phone per shipping/billing address. Implemented Geoapify through an authenticated same-origin POST route with a server-only key, fixed U.S. filter, five-result whitelist, timeout/no-store responses and key-safe failure handling. Shared account/onboarding address forms provide debounced keyboard-accessible street suggestions, selection autofill, separate unit/suite, full manual entry and bundled city/state/ZIP fallback. Added independently validated/formatted address phones to Company and standalone AccountDefaults; same-as-shipping copies phone atomically. New RFQs use the shipping contact phone and freeze the billing phone in their billing snapshot; explicit request shipping edits preserve/edit their own phone. Existing request/invoice snapshots are not backfilled. Applied four-column additive migration to Development and Production; hash baselines confirm every existing Request, Company and AccountDefaults field unchanged (Production: 17 requests, 3 companies). Geoapify key setup and deployment activation remain pending; source checks/release evidence follow. No automated tests added or run.


Release confirmation (2026-10-16): source 4076add pushed and released from an isolated committed-source archive as Ready Production dpl_GeUJbYyocdEVBPZRxkZuex57DKBV at latticeos.co. Typecheck, focused lint and hosted build pass; no automated tests run. Genuine Member in-review RFQ address editor shows separate formatted phone, Street address and Unit or suite fields. Public-address draft confirms missing-provider fallback, Enter address manually/Escape, and ZIP 10001 selection fills New York/NY without reopening the suggestions. Review draft canceled; original request values visibly restored and no address saves performed. Shared defaults remain read-only for the Member. Customer Admin billing-editor save/reload and real provider suggestion/keyboard selection checks remain pending; shared component/server paths are implemented but those hosted flows are not claimed verified. Production GEOAPIFY_API_KEY is not configured, so street-level suggestions are not activated. Setup instructions and activation follow-up are recorded in docs/address-autocomplete-setup.md and TODO.md. Short-window HTTP 500+ log scan returned zero records. Screenshot /tmp/lattice-us-address-entry.jpg shows the canceled review draft. Unrelated address-editor changes remain local and excluded.


## 2026-10-16 — Amazon-style state selector and lookup diagnosis

Inspected the live Amazon add-address state control: native select, Select placeholder and full state names. Replaced the Lattice state datalist/text input with a styled native dropdown, alphabetized full names, stored abbreviations, preserved legacy region options and wider state layout. Applies to shared shipping/billing/onboarding fields. Confirmed via Vercel environment metadata that GEOAPIFY_API_KEY remains absent in both Production and Preview; lookup cannot search any address until activation. Added explicit missing-configuration, credential, quota and temporary-failure reason codes/messages, distinct from successful no-match results. Provider diagnostics record HTTP status/reason only, never search data, key, response or URL. Manual entry stays available. Typecheck/focused lint and release evidence follow; no automated tests run. User asked to add the missing key; activation remains pending. No address data changed.


Release status (2026-10-16): source b5284a9 pushed and deployed from an isolated committed-source archive as Ready Production dpl_EbSTedh1nAxiAouQNDCJD9b8AYnc at latticeos.co. Typecheck, focused lint and hosted build pass; no automated tests run. User requested help provisioning the missing provider key. Opened Geoapify registration in the in-app browser for the owner to complete password creation, terms acceptance and any verification; retained it as a handoff. Provider activation and full hosted shipping/billing checks remain pending account setup. User’s existing settings draft was preserved. No account/request data changed.


## 2026-10-16 — Repair Google account choice after logout

Reproduced the reported Production behavior in the user’s Chrome tab: Continue with Google returned directly to the will@latticeos.co admin workspace. Confirmed the deployed page already passes oidcPrompt=select_account; inspected the live Clerk JS 6.39.0 bundle and found its social authenticateWithRedirect helper drops that value when creating the attempt. Replaced initial social buttons with direct Clerk attempt creation; Google’s returned authorization URL explicitly requests selection without a previous login hint and preserves state, PKCE, callback, scopes and consent. Microsoft uses its Clerk-provided redirect. Clerk’s built-in password UI, callback, recovery and MFA screens remain in use. Errors offer retry/password sign-in; duplicate social starts are blocked. Local Chrome confirms Choose an account and Use another account; six focused tests, typecheck and focused lint pass. React accessibility/hooks checklist reviewed. Production release verification follows.


Release confirmation (2026-10-16): source 0477bc6 pushed; the committed-source archive built successfully and Ready Production dpl_4JEVqWpwTsDC8VNKU5CYKtJ69Roa was promoted to latticeos.co. Live Chrome verified Account menu > Sign Out > /login > Continue with Google > Google Choose an account with Use another account and prompt=select_account on the Production client/callback. Selecting will@latticeos.co completed sign-in back to its admin workspace; a browser snapshot stall required refresh before the completed workspace was observed. Repeated logout and Google entry showed the chooser again; left that chooser open for the user. Screenshot: /tmp/lattice-google-chooser-live.png. Six focused tests, typecheck, focused lint and hosted build pass. No RFQ/company/profile values changed. Other in-progress address-editor changes remain local and excluded from the release.


## 2026-10-16 — Activate Geoapify and verify live address entry

Owner completed Geoapify signup and explicitly approved creating the Lattice Free-plan project and connecting its generated key to Vercel Production/Preview. Confirmed project Free plan ($0, 3,000 credits/day). Stored GEOAPIFY_API_KEY as a Secret for both environments without exposing its value; removed the ignored temporary transfer file. Rebuilt current committed source 0477bc6 (preserving the separately released fresh-Google-account chooser) from an isolated archive, excluding local unfinished RFQ address-editor changes. Ready Production dpl_HzqFTvZTj4BadEp4PmkMgP7cCFhL is promoted to latticeos.co. Hosted build/typecheck pass; no automated tests were run.

Genuine Apple Customer Admin checks pass: shipping lookup returns 350 5th Avenue, New York, NY 10001; ArrowDown/Enter selects it and fills street/city/NY/ZIP together. Billing mouse selection of the directional 1600 Pennsylvania Avenue Northwest match fills Washington/DC/20500. Both forms show the Amazon-style native state dropdown with full names; choosing New York yields stored selection NY. Manual entry closes lookup and retains the typed street. Missing-key message was verified before activation; after activation both real provider responses succeed with attribution. All form drafts canceled and original addresses visibly restored; no address or RFQ records were saved. Short-window HTTP 500+ scan returned zero records. Evidence: /tmp/lattice-street-suggestions-live.jpg, /tmp/lattice-billing-autofill-live.jpg, /tmp/lattice-geoapify-free-plan.jpg. Provider key activation is complete; local Development key setup is optional and was not changed.

## 2026-10-16 — Reliable street address suggestions

Diagnosed the live settings flow with public U.S. addresses. Geoapify returned valid results in about 5.5 seconds, exceeding the prior 5-second API cutoff; focusing/clicking an existing street also left the menu closed. Raised the server timeout to 15 seconds with safe timeout-specific logging, added slow-search progress/retry guidance, reopened suggestions on focus/click, and made number-only input prompt for a street name without spending provider credits. A valid existing ZIP softly biases results. Names and phones remain excluded from provider requests. Typecheck and focused ESLint pass; no automated tests run. Released from commit 642142e as production deployment dpl_HtLzd5EExnY2YvepN3VbjTsXsSZU and promoted to latticeos.co. Fresh signed-in Customer Admin production check returned five valid matches for `350 Fifth Avenue` without a city after the slower provider response, and a click away/back refetched matches for the unchanged query. Number-only `286` showed the street-name prompt. The verification editor was canceled and saved shipping/billing defaults remained unchanged. Screenshot: /tmp/lattice-address-reliability-live.jpg. No automated tests run.

## 2026-10-16 — Searchable state picker

Replaced the browser-native state menu on account shipping and billing forms with a Lattice-styled searchable picker. It shows full state/territory names and two-letter codes, supports keyboard navigation and selection, and preserves an existing legacy region until the user picks a U.S. state. Deployed from commit bd9d2ac as production deployment dpl_Fff9ABuwpi7mDoDJw4rDUGHgLZ8V and promoted to latticeos.co. In a fresh Customer Admin settings editor, verified the styled popover, filtering to New York, keyboard ArrowDown/Enter selection, and postal-abbreviation-backed value. Canceled the editor and confirmed saved address remained unchanged. Screenshot: /tmp/lattice-state-picker-live.jpg. Typecheck and focused ESLint pass; no automated tests run.


## 2026-10-18 — Quote checkout and billing-address copy (local only)

Renamed the customer quote action from “Accept quote” to “Begin checkout.” Simplified the billing summary label and missing-address prompt to refer only to the billing address, while retaining a configured billing email in the saved request summary. The settings link still focuses the billing-address section. No deployment or verification run.


## 2026-10-18 — Reversible Design A in an isolated Production copy

Reconstructed and checksum-verified all 997 source files from current Production `dpl_2PVFWrjYurFom1vhiEb9xeVgQtQ6`. Committed the independent baseline as de73b9b / production-baseline-20261018. Implemented A as commit 79d8aae: separate Production and Shipping timing per part, one quote-level footer using viewer date + maximum part production + shipping, live local-date rollover, responsive wrapping and Pending handling. Kept the prior layout behind the legacy switch. Added a synthetic dev-only preview with single/two-part, missing shipping, legacy and 390px mobile views; normal customer data and persistence are not used.

Thirteen focused checks, TypeScript and scoped lint pass. Browser and local HTTP checks pass; two old quote/checkout assertions fail identically in legacy mode and are documented as inherited drift. The local dev harness uses Turbopack and avoids development Clerk dependencies for the exact synthetic preview route. No deployment occurred. See LOCAL_PREVIEW.md for preview commands, limits and rollback instructions.


## 2026-10-18 — Consolidate local working copies

At William’s request, retained the Production-derived Timing A repo as the continuing local workspace. Preserved the original repo’s Git history, uncommitted work and local configuration in a private recovery tar archive (excluding regenerable `.next` and installed dependencies), checked the archive can be listed, relocated installed dependencies into the retained repo, and removed the superseded working folder. No application feature changes, tests or deployment were performed.


## 2026-10-18 — Primary local copy on port 3000

At William’s request, changed both Design A preview scripts from port 3001 to port 3000 and documented this Production-derived repository as the primary local working copy. The local preview was restarted on 127.0.0.1:3000. No deployment was made.


## 2026-10-18 — Replace Design A with sidebar Design C

Implemented William’s selected Design C using the generated sidebar-card reference: delivery estimate card above Summary, production/shipping stages, combined duration, and a date that refreshes with the viewing day. Part rows retain production lead time and identify the longest part. Removed A’s timing footer and duplicated per-part shipping. Added the timing-c preview URL while preserving timing-a bookmarks and the legacy rollback switch. Updated both preview scripts to select sidebar by default. All 13 focused timing/layout checks, TypeScript and scoped ESLint pass. Browser automation was blocked by the URL policy when claiming the old preview tab, so no Design C visual verification is claimed. No deployment.


## 2026-10-18 — Consistent quote address sections

Removed quote-status conditions from the shared customer quote shipping and billing presentation so submitted/review and issued quotes display the same missing-address copy and settings links. Removed the pre-issuance-only shipping Change link to match the issued template. Existing snapshot data and the earlier billing-label/Begin checkout edits are retained. TypeScript, scoped ESLint and git diff whitespace checks pass. No automated tests or browser verification run; not deployed.


## 2026-10-18 — Release quote address and checkout copy

William requested publishing the quote changes to Vercel. Confirmed latticeos.co still used baseline dpl_2PVFWrjYurFom1vhiEb9xeVgQtQ6. Created an isolated two-component release from that exact Production baseline, including consistent shipping/billing sections across quote states, the Billing address label and prompt, and Begin checkout. Preserved release source a849911 on local branch codex/quote-address-release. The Design C experiment and development configuration are excluded from this release.

TypeScript and scoped ESLint pass. Vercel Production build passed and was staged, with HTTP 200 for application login and 307 to login for protected quotes. Promoted Ready deployment dpl_7LGEZLXbndJoQEWSD8EZbR19pxRh to latticeos.co; domain lookup confirms the new deployment. Live home/login return 200 and signed-out quotes redirect to login. Immediate deployment-scoped runtime error/fatal scan returned zero records. Authenticated quote-page browser rendering was not independently verified.


## 2026-10-18 — Remove quote next-step panel

Removed the highlighted What happens next panel from the customer quote status header across quote states at William’s request. Local change; no deployment.


## 2026-10-18 — Move quote activity below parts

Moved the quote activity card from the sidebar to the main column immediately below Parts and pricing. Matched the adjacent card header, replaced the bare count with a labeled update count, and widened the vertical timeline with dates aligned right on larger screens and stacked on small screens. Timeline uses an ordered list with decorative markers hidden from assistive technology. TypeScript, scoped ESLint and whitespace checks pass. Local change only; browser rendering was not independently verified.


## 2026-10-18 — Delivery timeline heading

Renamed the quote sidebar card heading from Delivery estimate to Delivery timeline at William’s request. Local copy edit.


## 2026-10-18 — Remove delivery timeline footnote

Removed the Based on today / Updates daily until ordered footnote from the local Delivery timeline card at William’s request. Missing-duration guidance and delivery-date calculation/daily refresh behavior are retained.


## 2026-10-18 — Remove per-part longest label

Removed Longest part beneath production lead times from desktop part rows and mobile part cards. Local copy edit; delivery timeline calculation is unchanged.


## 2026-10-18 — Combine quote pricing columns

Combined Unit price and Line total into one Line total column, with per-unit pricing as muted subtext. Applied the same hierarchy to mobile part cards, adjusted table widths and subtotal column span, and retained explicit pending unit pricing. TypeScript, scoped ESLint and whitespace checks pass. Local only.


## 2026-10-18 — Quote address defaults and editable copied billing

Completed five browser comments locally: removed the quote-activity count and remaining delivery-card Longest part label; renamed the settings row Shipping Address; linked billing opens populated editable inputs, field edits unlink it, and checking Same as shipping recopies the current shipping address. Fixed quote address display by supplying current company settings only when the authenticated company matches the request company. Complete request snapshots retain precedence; incomplete unpurchased quote addresses use complete company defaults for display without rewriting stored requests. Purchased requests do not use this fallback. Corrected duplicated billing email output by formatting address lines independently of contact lines.

All 24 focused settings/address/timing checks pass, including linked-edit persistence, missing/complete/purchased snapshot precedence and immutability. TypeScript, scoped ESLint and whitespace checks pass. React review confirms server-side company scoping, narrow serialized props, local editor state, accessible existing form labels and unchanged effect cleanup. No deployment or authenticated browser verification performed.


## 2026-10-18 — Five numbered workspace tour steps

Separated the five guided steps from the final completion popup. Resources now reads 5 of 5, and the ready-to-get-started popup says Workspace tour complete without a step number. Completion, replay, close, address-setup handoff and existing stored completion codes retain their behavior. All 15 focused tour/onboarding checks, TypeScript and scoped ESLint pass. Local only.


## 2026-10-18 — Optional address setup after the first workspace tour

The first-time tour completion popup now offers Add shipping and billing addresses now or Add later when address setup is needed. Add now records tour completion and opens the existing address onboarding dialog. Add later persists the existing company deferral, records completion and dismisses the tour. Skip/close also defer rather than launching address setup. Completed users no longer automatically see address onboarding on subsequent visits. Help/replay flows suppress the address choice and setup dialog and avoid rewriting an already-completed tour.

All 35 focused onboarding, tour and settings checks pass, including Add now, persistent Add later and Help replay with missing addresses. TypeScript, scoped ESLint and whitespace checks pass. Local only; authenticated browser behavior was not independently exercised.


## 2026-10-18 — Full-width request progress timeline

Changed the Upload/Configure/Submit progress grid to two flexible tracks and a content-width final track so Submit reaches the right edge of the quote configuration cards. Offset the header’s small horizontal inset for matching timeline/card edges. Local layout edit only.


## 2026-10-18 — Anchor address suggestions to their field

Replaced the shared city/ZIP suggestion chips below State/ZIP with a single-column dropdown anchored directly below the active City or ZIP input. Full-width rows show city/state plus ZIP, with a scroll limit, keyboard Arrow/Enter selection, Escape dismissal, blur cleanup and active-row scrolling. Removed duplicate native datalists. Provider requests remain debounced and aborted on field changes, with stale-response protection. All 19 focused address/settings checks pass; TypeScript and scoped ESLint pass. Local only; no live provider/browser verification.


## 2026-10-18 — Calculated admin quote delivery and issuance fields

Replaced the editable estimated-delivery calendar with a read-only date derived from issue date plus maximum per-part production lead time and shipping duration (Domestic 2 / International 5 business days). The server independently derives the persisted date from validated part durations and shipping method; posted delivery-date overrides are ignored. Missing/invalid part timing leaves the date pending and issuance blocked. Customer note is optional in the form and shared server validation; clarification/no-quote notes remain required. Removed Shop name, Country and Overall lead time days from the supplier attachment area, preserving existing supplier metadata in hidden submission values. Added red asterisks for Unit price, Lead time, Shipping cost and Quote valid until; Shipping speed/terms retain their markers.

All 53 focused admin workbench, issuance, preparation and timing checks pass, including blank-note issuance and server-calculated Domestic/International dates despite posted overrides. TypeScript, scoped ESLint and whitespace checks pass. React review: derived dates use render-time calculation, no synchronization effects; read-only date has an explicit label and description; existing save guards and authorization remain intact. Local only; no real quotes issued and no browser verification/deployment performed.


## 2026-10-18 — Archive Equipment explorer

Removed Equipment explorer from customer navigation, saved-order insertion logic and tour copy. Its protected route redirects authenticated customers/admins to Equipment; anonymous and supplier handling remains intact. Explorer components, data, styles and source documentation remain available for restoration.

36 checks pass across sidebar, archived route and tour. Four sidebar tests fail identically on the unchanged Production baseline (duplicate desktop/mobile Request Quote expectation and stale Customers-vs-Companies labels); no new failures. TypeScript, scoped ESLint and whitespace checks pass. Local only.


## 2026-10-18 — Simplify request configuration tour copy

Updated the second tour step description to William’s exact wording: Add your CAD files, then define the requirements for each part. Local copy edit.


## 2026-10-18 — Shorten request tour heading

Changed the second tour step heading to Build your manufacturing request and updated matching test text. Local copy edit.


## 2026-10-18 — Simplify quote management tour heading

Changed the third tour step heading to Manage your requests and updated matching test text. Local copy edit.


## 2026-10-18 — Update step 3 tour description

Updated Manage your requests to William’s exact copy describing the offering from the lattice manufacturing network, retaining the submitted-request/issued-quote and empty-list guidance. Local copy edit.


## 2026-10-18 — Show Quotes behind tour step 3

Step 3 now navigates to /quotes while retaining its tour popup and sidebar highlight. The coach waits for the real Quotes page marker before presenting Manage your requests, and Back returns to request configuration. All 16 focused tour/controller tests, TypeScript and scoped ESLint pass. Local only.


## 2026-10-18 — Finish label on tour step 5

Renamed the Your Resources step action from Next to Finish, retaining the transition to the existing unnumbered completion popup. Updated matching test labels. Local copy edit.


## 2026-10-18 — Reorder Your Resources

Set the resource navigation order to How Lattice works, Capabilities, Materials, Equipment, Inspection & Certificates on desktop and mobile, and matched the tour listing. Versioned only the resource section’s saved order so legacy preferences do not restore the old order while subsequent personal drag-and-drop ordering still persists. Local change.


## 2026-10-18 — Reversible tolerance radio-card design

Implemented William’s approved two-choice presentation: Standard tolerances and Drawing-specific tolerances. Both the part card and technical drawing review use the shared radio-card component. Existing Medium/Fine ISO profile is retained in an expandable general-standard control; threads, fits and other features stay separate. Drawing callouts take precedence, with conflicts referred for review. Added a structured drawingSpecificTolerances requirement to the existing JSON drawingRequirements object and carried it through local drafts, saved request parsing/restoration and submission packaging. Existing server drawing enforcement covers the new flag, including exact legacy-note compatibility. No database migration.

Kept the previous dropdown/checkbox JSX available via toleranceDesign=legacy and the server LATTICE_TOLERANCE_DESIGN=legacy default switch. Switching presentation preserves part state, legacy tight-linear flags and ISO Fine; explicit Standard selection clears only the corresponding tolerance flags. Rollback and comparison URLs are documented in docs/tolerance-design-preview.md.

All 66 focused form/manufacturing/draft/submission checks, TypeScript and scoped ESLint pass. React review confirms accessible native radio grouping, shared controlled values, no state-reset effects and unchanged independent feature flags. Local only; browser visual review and deployment not performed.

## 2026-10-18 — Numeric tolerance selection

Replaced ISO-profile cards with three absolute linear tolerance choices in part configuration and drawing review. Added accepted numeric RFQ values and exact-first saved-label restoration; enforced tighter-option drawings independently on the server. Saved ISO selections remain visible without conversion; existing layout switch retains rollback. Numeric selection atomically updates drawing flags. Removed the ISO-only introduction for numeric selections and documented units, review scope and rollback in tolerance-design-preview.md. Local only; TypeScript, scoped ESLint and git diff --check pass. No tests or browser verification performed.

## 2026-10-18 — Exact screenshot tolerance copy

Replaced all three absolute-tolerance card headings and descriptions with the supplied Xometry screenshot wording, including rounded displayed metric values, drawing-override language, reamed-hole exceptions and Standard inspection text. Removed the prior contradictory drawing-precedence helper text. Persisted numeric option labels/values and legacy rollback remain intact. Copy change only; no inspection-selection or submission-policy changes. Local only, no tests run.

## 2026-10-18 — Minimum requested delivery date

RFQ configuration now permits optional target arrival dates only on/after eight weekdays from today in America/New_York. Weekends are excluded; no holiday calendar is applied. Added reusable calendar minimum support with disabled dates/Today, bounded keyboard and month navigation, and an accessible error for saved dates that are too early. Draft dates remain saved, but readiness/submission requires changing or clearing invalid dates. Shared server submission validation enforces the same policy; other calendar usages are unchanged. TypeScript, scoped ESLint and diff whitespace checks pass. No tests or browser verification performed. Local only.
## 2026-10-19 — Shared material alias registry

Added `src/lib/material-identity-registry.ts` and routed the Materials catalog, RFQ options/draft normalization/search, and material-property lookups through scoped alias resolution. Catalog and RFQ display names now align for the approved 304/304L, 316/316L, Invar 36, Brass 360, Copper 110, and Bronze 932 choices. Property lookup aliases are registered by family; the combined stainless selections no longer resolve to only the 304 or 316 property record. Supplier source labels remain attached as provenance. Updated the feature map and material naming decision. TypeScript and `git diff --check` pass; tests and browser verification were not run. Local only.

## 2026-10-19 — Shared material alias registry

Added `src/lib/material-identity-registry.ts` and routed the Materials catalog, RFQ options/draft normalization/search, and material-property lookups through scoped alias resolution. Catalog and RFQ display names now align for the approved 304/304L, 316/316L, Invar 36, Brass 360, Copper 110, and Bronze 932 choices. Property lookup aliases are registered by family; combined stainless selections do not resolve to a single-grade property record. Supplier source labels remain attached as provenance. Conflicting family-scoped property aliases fail closed and are available through a conflict inspection helper for review. Updated feature map, project context, and material naming decision. TypeScript and `git diff --check` pass; tests and browser verification were not run. Local only.


## 2026-10-19 — Resolve automated test failures after material and workflow updates

- Original full run: 691 passed, 37 failed, one skipped. A separate temporary HEAD checkout reproduced 29 failures among the ten affected files, establishing that most were already present in the checked-in baseline.
- Repaired manufacturing intake validation to resolve approved legacy material labels before comparing them to keyed RFQ choices; retained the compatibility regression test. Updated request-form expectations for absolute tolerance choices, preserved ISO values, and combined stainless labels.
- Updated incomplete Clerk/database mocks and valid phone/billing fixtures. Aligned navigation and quote-detail tests with approved Companies/Users labels, responsive CTAs, first-tour address choice, combined pricing, neutral activity and missing-address display fallback. Checkout asserts editable saved-address values and preserves the saved AP contact at the server action.
- Restored missing shared search/stage/owner controls in the admin quote queue in accordance with the existing documented workflow. Added search/reset, cross-table filters and archive coverage. Added signed-in password-reset ownership and authoritative linked-billing checks.
- Excluded only the versioned third-party OCCT public runtime from source linting; application sources remain linted.
- Final full suite: 137 test files passed, one opt-in PostgreSQL audit file skipped; 733 tests passed, zero failed, one skipped. TypeScript, full ESLint and git diff whitespace checks pass. The live database audit and browser/hosted verification were not run; no deployment or customer data changes.


## 2026-10-19 — Publish draft workflow synchronization PR

Created [Sync production baseline and approved Lattice workflow updates](https://github.com/willpaikstack/lattice/pull/1) in the original Lattice GitHub repository, targeting main on `codex/materials-quote-workflow-test-repairs`. Used a separate checkout based on current GitHub main because the active local repository has independent Production-source history. The draft explicitly documents the broader source reconciliation needed since main predates the current app. Preserved existing environment/QA exclusions, restored the original Git ignore protections and generated CAD-runtime exclusion; customer workflow data, exact production RFQ audit JSON, environment files and generated vendor bundles were omitted. A pre-existing trailing blank line in imported CAD code was removed for the review diff.

The PR source passes 733 tests with one opt-in PostgreSQL audit skipped, TypeScript, full ESLint and whitespace checks. Linked the PR to this chat. No merge, deployment or database writes.


## 2026-10-19 — Merge approved workflow updates and verify Production

Production release completed (2026-10-19): [Sync production baseline and approved Lattice workflow updates](https://github.com/willpaikstack/lattice/pull/1) was marked ready and squash merged with user authorization. Main commit `cb90b1398bd3781877a03256aebba0b885b91146` has the same tree as the tested PR head. Automatic Vercel Production deployment `dpl_HsJxrQ2G5EQcMHATMK3KSGXTYMgX` is READY and assigned to latticeos.co and www.latticeos.co. Release source passed 733 tests (one opt-in PostgreSQL audit skipped), TypeScript, ESLint, diff checks, and a fresh production build. Anonymous live checks: home/login/icon return 200, protected quotes/admin/settings redirect to login, development-only timing preview returns 404. Deployment-scoped error/fatal runtime-log query returned no records during the release check. Authenticated browser flows and real database audit were not exercised. Local memory entry only; no extra deployment triggered.



## 2026-10-19 — Audit materials catalog and quote selection unification

Completed a source/data based UX audit of the active Materials atlas/family directories and grouped RFQ picker after the approved cleanup. Evaluated current exports: 284 directory rows across 12 families and 104 selectable RFQ options (114 raw); counts use different grade/condition units. Documented catalog/picker coverage differences, independently authored featured-grade inconsistencies, remaining aliases, family-name lookup fragility after renaming, sourcing claims, condition modeling, cross-page continuity, and accessibility/hierarchy improvements. Recommended one reviewed material registry with stable IDs, shared family/condition relationships, explicit request/sourcing actions and historical compatibility. Full proposal: `docs/audits/materials-catalog-rfq-unification-2026-10-19.md`. Anonymous local route check redirected to authentication, so no new authenticated browser or customer-task testing is claimed. No app changes, database writes, deployment or test suite run in this audit.


## 2026-10-19 — Generate material highlights from published directory records

Implemented the approved catalog consistency recommendation. A shared `material-catalog-records.ts` projection supplies canonical grade names, listed conditions and reference-property lookup to the directory and family view models. Family atlas examples derive from the same catalog-backed highlighted selections; featured presentation data references exact directory grades rather than defining independent display identities. Removed display-only highlights absent from the published directory (including D2/H13, C385/C464, C122/C172, 8620 and Grade 23) without adding new offerings. Stainless highlights use the combined 304/304L and 316/316L names and identifiers; single-grade reference values are not substituted for those requirements. Aluminum highlights display parent alloy and condition separately. Removed/changed grades and tempers automatically disappear from highlights, and generic family fallbacks use directory records instead of legacy display variants. Validation: 39 focused tests passed across family view models, directory interactions and CNC catalog coverage; TypeScript, targeted ESLint and whitespace checks passed. React component boundary/accessibility checklist reviewed. Local change only; no deployment or authenticated browser review.


## 2026-10-19 — Unify catalog material actions and RFQ Material/Condition selection

Implemented both approved follow-ups. Added a shared catalog/RFQ offering projection; every published grade and condition now exposes Request quote for an existing reviewed variant, or Ask us to source with editable inquiry prefill. Family highlights and full directory rows share the action component. Configure can find catalog-only requirements and opens sourcing review in a separate tab so the draft remains intact. Retained all previously selectable RFQ requirements, including distinct steel designations that broader catalog aliases relate to another grade.

Added grouped searchable Material and separate Condition controls. Exact 6061-T651 search fills both while T6/T651 remain distinct. Parent selection requires deliberate condition choice, and unreviewed conditions do not substitute a generic alloy. Existing exact keys/full labels persist; the server derives optional grade/condition metadata and rejects incomplete/source-only submissions. Catalog quote links initialize the first part through CAD upload; draft/reorder requirements take priority. Kept the legacy picker code for presentation rollback. No database migration, submitted-record rewrite or deployment.

Verification: full Vitest suite passes with 758 tests and one opt-in PostgreSQL audit skipped (140 files passed, one skipped). Includes exhaustive published grade/condition action coverage, legacy RFQ availability, precise condition search/keyboard selection, first CAD upload, draft roundtrip, trusted server metadata, and quote/inquiry route prefill. Updated stale presentation and persistence assertions for canonical names, shared reference source and derived metadata. TypeScript, full ESLint and whitespace checks pass. React component boundaries, keyboard/focus behavior and rendering checklist reviewed. Authenticated browser review was not performed.


## 2026-10-19 — Prepare documented cross-device Git handoff

Updated README, PROJECT_CONTEXT, TODO and LOCAL_PREVIEW with the current material implementation, verification, release boundary and canonical GitHub handoff. Added `docs/cross-device-handoff-2026-10-19.md` with exact branch/setup commands, credential/data exclusions, legacy compatibility, rollback and next checks. Prepared `codex/materials-catalog-handoff` from existing GitHub main `cb90b13`, overlaying reviewed source changes while preserving upstream-only files and excluding local private RFQ evidence, Production manifest and generated CAD runtime. Retained independent local history; no force-push, database reset or Production deployment is part of this handoff. Latest application verification remains 758 passing tests, one opt-in PostgreSQL skip, TypeScript/ESLint/whitespace checks clean.


Git handoff publication: committed the reviewed material/catalog changes and updated Markdown memory on `codex/materials-catalog-handoff` (initial commit `6702ac0`), based on existing main. Pushed the branch to the existing GitHub repository without changing main. Follow-up normalizes one new-file trailing blank line and records publication. No secrets or private local records are included. Git cleanup preserves local data/configuration; any broader reset requires clarification.
