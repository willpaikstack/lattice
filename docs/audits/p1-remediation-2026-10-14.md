# P1 remediation and verification

Date: October 14, 2026 (America/New_York). Scope: six confirmed P1 defects from the hosted readiness inventory (F4–F7, R1–R2). P0 protections remain in place. Live checkout remains disabled.

## Implementation

| Finding | Change | User experience |
| --- | --- | --- |
| F4 — incomplete submissions | Validate submission shape, supported file types/sizes, whole quantities, one CAD per part, associations, supported quality/tolerance choices and required drawings; inspect every authorized stored file and refuse claimed bytes without storage. | Invalid packages receive specific errors before a new RFQ is saved. |
| F5 — malformed drafts | Version shared records; validate/repair legacy request arrays and recover form state from usable saved requests. Retain and quarantine unusable records on read; reject invalid writes. Validate browser caches before rendering or synchronization. | Quotes stays usable. A recovery notice identifies hidden old drafts; valid draft files and choices remain reusable. |
| F6 — Test webhook ingress | Rotate the existing automation bypass credential and configure only the existing Stripe Test endpoint URL with Vercel's supported automation-bypass query parameter. Stripe signatures and all application authorization remain enforced. | Stripe can deliver directly to the protected Preview; genuine delivery/fulfillment proof pending. |
| F7 — quality upload limit | Admin/order-scoped direct R2 upload and trusted completion up to 25 MB. Recheck shipment state transactionally, attach once and invalidate prior approval on new documents. | Upload progress, explicit success/retry messages and an honest 25 MB limit replace the oversized form request. |
| R1 — dependencies | Next 16.4.0, Prisma 7.10.0 and refreshed compatible dependencies; patched Sharp/MySQL/deepmerge dependencies. Prisma CLI is development-only. | No visual redesign. Production dependency audit has zero advisories. |
| R2 — vendor durability | Postgres `AdminVendorOverride` stores editable fields/detail rows. Database failures propagate; no filesystem fallback. Additive schema and optional archive importer are included. | Vendor edits persist across instances and releases. |

Related attachment review: supplier quote files and revised clarification drawings retain their legacy form paths with visible, enforced 3 MB limits and browser preflight checks. Server Actions accept 4 MB to accommodate those files and metadata within Vercel's request envelope. Larger quality documents use direct storage. Broader attachment direct-upload support is a future improvement.

## Release and verification status

Implementation is on the isolated hosted-test branch. Local regression checks pass 575 tests / 117 suites, typecheck and optimized build; final hosted retests and Production release are pending.

Runtime `npm audit --omit=dev`: zero advisories. The full audit retains five high entries, all tracing to unpatched `braces` via Next's development ESLint glob tooling. The app does not import these packages at runtime or feed customer inputs to their glob parser; lint runs only on trusted repository patterns. No upstream patched `braces` release is available in the registry. Do not describe the full dependency graph as advisory-free. Reassess if untrusted patterns are ever accepted by development tooling.

npm is the single package-manager contract (`npm@11.6.2`, Node 24); remove the conflicting pnpm lockfile. The patch uses no forced dependency downgrade or release-candidate Prisma upgrade. The new Next agent-instruction block is framework-generated.

## Operational boundaries

- The vendor schema addition creates only a new table. It does not replace, reset or migrate existing customer/order records. Production staging must run the explicit `LATTICE_VENDOR_SCHEMA_MIGRATION_ENABLED=true` build flag before promotion.
- `scripts/migrate-vendor-overrides.mjs` imports a recoverable local archive without replacing database edits. No local override archive was present in this workspace; previously lost ephemeral edits cannot be recovered from static directory data.
- The existing project automation secret appeared in an early diagnostic; it was rotated immediately and subsequent outputs are redacted. Existing deployments/automation that used the previous secret must use the refreshed value. No new public-domain protection exception was introduced.
- Test Neon, private R2 and Stripe Test configuration stay isolated. No Live payment, supplier job or customer email is authorized by these tests. The Preview email key remains blank.
- P2 defects, commercial go/no-go decisions, Live webhook proof and intentionally deferred product areas remain outside this repair scope.
