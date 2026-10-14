# P1 remediation and verification

Date: October 14, 2026 (America/New_York). Scope: six confirmed P1 defects from the hosted readiness inventory (F4–F7, R1–R2). P0 protections remain in place. Live checkout remains disabled.

## Implementation

| Finding | Change | User experience |
| --- | --- | --- |
| F4 — incomplete submissions | Validate submission shape, supported file types/sizes, whole quantities, one CAD per part, associations, supported quality/tolerance choices and required drawings; inspect every authorized stored file and refuse claimed bytes without storage. | Invalid packages receive specific errors before a new RFQ is saved. |
| F5 — malformed drafts | Version shared records; validate/repair legacy request arrays and recover form state from usable saved requests. Retain and quarantine unusable records on read; reject invalid writes. Validate browser caches before rendering or synchronization. | Quotes stays usable. A recovery notice identifies hidden old drafts; valid draft files and choices remain reusable. |
| F6 — Test webhook ingress | Rotate the existing automation bypass credential and configure only the existing Stripe Test endpoint URL with Vercel's supported automation-bypass query parameter. Stripe signatures and all application authorization remain enforced. | Stripe delivers directly to the protected Preview; payment is saved even when the buyer closes or leaves checkout. |
| F7 — quality upload limit | Admin/order-scoped direct R2 upload and trusted completion up to 25 MB. Recheck shipment state transactionally, attach once and invalidate prior approval on new documents. | Upload progress, explicit success/retry messages and an honest 25 MB limit replace the oversized form request. |
| R1 — dependencies | Next 16.4.0, Prisma 7.10.0 and refreshed compatible dependencies; patched Sharp/MySQL/deepmerge dependencies. Prisma CLI is development-only. | No visual redesign. Production dependency audit has zero advisories. |
| R2 — vendor durability | Postgres `AdminVendorOverride` stores editable fields/detail rows. Database failures propagate; no filesystem fallback. Additive schema and optional archive importer are included. | Vendor edits persist across instances and releases. |

Related attachment review: supplier quote files and revised clarification drawings retain their legacy form paths with visible, enforced 3 MB limits and browser preflight checks. Server Actions accept 4 MB to accommodate those files and metadata within Vercel's request envelope. Larger quality documents use direct storage. Broader attachment direct-upload support is a future improvement.

## Release and verification status

All six confirmed P1 findings are repaired and verified. Application commits `a96a704` and `e3d8d39` were staged with Production configuration, built successfully and promoted as `dpl_LKRxRX56KSzo6DE1vZmomPPFqezZ` to https://latticeos.co. The additive vendor table was verified during the Production build. Local regression checks pass **576 tests / 117 suites**, typecheck, lint and optimized build; the corrected customer-access command passes **48 tests / 7 suites**. Live checkout remains disabled.

Runtime `npm audit --omit=dev`: zero advisories. The full audit retains five high entries, all tracing to unpatched `braces` via Next's development ESLint glob tooling. The app does not import these packages at runtime or feed customer inputs to their glob parser; lint runs only on trusted repository patterns. No upstream patched `braces` release is available in the registry. Do not describe the full dependency graph as advisory-free. Reassess if untrusted patterns are ever accepted by development tooling.

npm is the single package-manager contract (`npm@11.6.2`, Node 24); remove the conflicting pnpm lockfile. The patch uses no forced dependency downgrade or release-candidate Prisma upgrade. The new Next agent-instruction block is framework-generated.

## Operational boundaries

- The vendor schema addition creates only a new table. It does not replace, reset or migrate existing customer/order records. Production staging ran the explicit `LATTICE_VENDOR_SCHEMA_MIGRATION_ENABLED=true` build flag before promotion.
- `scripts/migrate-vendor-overrides.mjs` imports a recoverable local archive without replacing database edits. No local override archive was present in this workspace; previously lost ephemeral edits cannot be recovered from static directory data.
- The existing project automation secret appeared in an early diagnostic; it was rotated immediately and subsequent outputs are redacted. Existing deployments/automation that used the previous secret must use the refreshed value. No new public-domain protection exception was introduced.
- Test Neon, private R2 and Stripe Test configuration stay isolated. No Live payment, supplier job or customer email is authorized by these tests. The Preview email key remains blank.
- P2 defects, commercial go/no-go decisions, Live webhook proof and intentionally deferred product areas remain outside this repair scope.

## Hosted retest evidence

The isolated Preview used development Neon/Clerk, private `lattice-preview-test` R2 and APS test storage, and Stripe Test. Primary verification used Preview `dpl_HWckEz4t3YcTD2Tdvka3BrhhvoLr`; the subsequent Git Preview included the final browser-cache retention patch.

| Finding | Hosted result | Status |
| --- | --- | --- |
| F4 | Missing storage/claimed bytes, required second-part drawing, invalid part association, fractional quantity and unsupported attachment each returned 400. A valid two-part package returned 201. | Repaired |
| F5 | Malformed writes returned 400; an injected unusable legacy row was retained and excluded with a recovery ID. Quotes returned 200. A usable legacy record was repaired/versioned, its form reconstructed and original storage references retained; same-company member read succeeded and foreign-company read excluded it. Malformed browser records are archived under a company-scoped recovery key before active-cache replacement. | Repaired |
| F6 | A real synthetic $65.33 Stripe Test Checkout payment generated a genuine provider event. Two Stripe-origin webhook requests returned 200. The browser was deliberately signed out before payment, so its success return stopped at sign-in; Neon nevertheless held PURCHASED/PAID with the correct total. Invalid signatures returned 400. Separate signed duplicate-delivery probes returned 200 with one purchase transition and one invoice after repeated PDF reads. A full Test refund reached the app through provider delivery and saved the refunded amount. | Repaired |
| F7 | Direct quality uploads of 5,245,427 bytes and exactly 25 MiB each completed and attached once; repeated completion returned 200, old approval cleared, original hashes matched and foreign downloads returned 404. Buyer preparation returned 403; foreign-order keys and oversized files were refused. The real native browser form also uploaded the 5 MB PDF and displayed the saved confirmation; its persisted download matched the original hash. | Repaired |
| R1 | Patched dependency graph passed the full suite, local build and both hosted builds. Runtime audit has zero vulnerabilities; the unpatched development-only glob advisory remains bounded as described above. | Applicable runtime issues repaired; development advisory documented |
| R2 | An admin edit saved and rendered in Preview, then remained visible from an independent Ready deployment. Foreign mutation returned 403. The synthetic test edit was restored to its baseline. Database failure behavior is covered by automated tests. | Repaired |

Production smoke checks: home and sign-in 200; private RFQ API and new quality upload API 401 when unauthenticated; admin orders 307 to sign-in. The Production sign-in build contains the Production Clerk key and no Development key. These are release smoke checks, not Live payment certification.

Sanitized observations are in [verification.json](p1-remediation-2026-10-14/verification.json). Browser evidence is retained in the ignored local QA folder; no credentials, Checkout URLs, original customer records or raw captures are committed.

## Remaining rollout work

The original inventory's P2 findings and unverified operational/commercial gates remain open. This release closes the six confirmed P1 findings; it does not certify a completed app or authorize Live payments. The five development-only advisory entries require an upstream patched release or a future lint-tool replacement. Supplier quote attachments and clarification replacement drawings currently have an honest 3 MB form limit; extending those paths to larger direct uploads remains follow-up work.
