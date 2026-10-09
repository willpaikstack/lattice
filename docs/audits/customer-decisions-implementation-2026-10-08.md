# Customer audit decisions and implementation — 2026-10-08

The customer approved recommended defaults for unannotated findings and changed the following policies: request-specific quality approval is selected on the RFQ, credit-card purchase accepts a quote, quote validity is fifteen weekdays, and the approved onboarding is to be integrated and deployed. Deployment was authorized and completed through authenticated Vercel CLI access. Stripe merchant mapping and tax configuration remain incomplete; see the account findings below.

Implemented and deployed:

- RFQ quality requirement, durable Customer Admin approval, downloadable quality package, admin inspection upload, revised-document invalidation and guarded shipment release.
- Server-enforced saved expiration, 15-weekday validity for newly issued/reissued quotes, card-only initial purchasing, disabled PO/unsupported carrier/tax-exemption choices, payment/session ownership, USD/amount checks and Stripe intent idempotency.
- Durable delivery/compliance/purchasing snapshots and an explicit Lattice Admin compliance hold/release.
- Complete Action Center list rather than a five-row truncation. The original example showed eight open workflows and five customer actions while exposing five rows with three customer actions; it was a presentation limit, not five missing orders. Quality-approval actions now apply only to an agreed requirement.
- Actual customer welcome/tour, per-user/company durable progress and Help/replay; admin and support impersonation do not change customer progress. Existing Clerk/password/address setup remains the entry flow. Customer visual/accessibility testing remains required before rollout.
- Company-scoped draft upload folders, authorization before referenced files are read/copied, scoped browser drafts plus database draft synchronization. Old unscoped browser drafts are deliberately not imported into another signed-in company; their files require re-upload under the correct account.
- Explicit file-to-part index for new packages; sparse legacy drawing arrays are not guessed. Revised drawings retain original file history.
- Durable order-help tickets, clarification replies with revised drawings and dated history, admin support queue, actual support address, no SLA promise.
- Full immutable order references and one durable annual invoice snapshot per order for customer/admin PDF downloads, reconciled to the recorded payment.
- Lifecycle email queue for clarification requests, issued/revised quotes, quality approval requests and shipment; routine progress remains in-app. Resend delivery requires configuration, delivery failures remain visible, and admin retries are implemented; scheduled monitoring remains follow-up work.
- The development database's missing address-deferral column was repaired. Independently reviewed additive changes were applied transactionally to Production; both final schema diffs are empty. Generated standalone assets excluded from lint and the address helper name corrected; outdated drawer/invitation/PO/draft tests updated to current behavior.

Remaining release work: Stripe runtime configuration and real payment/webhook/refund testing; shipping/tax total finalization; genuine customer and mobile onboarding tests; notification monitoring; invitation delivery verification. Customer self-service team management and integrations remain later governed features as recommended. See the separate checkout audit for the detailed release checklist.

## Release verification

- Deployed and promoted to https://latticeos.co: `dpl_B2YnUGqkNVau3QQBBBgkMj3yjk73`, immutable deployment https://lattice-c8jw88ls9-willpaikstacks-projects.vercel.app. Vercel status Ready; Production target and project/team were confirmed before mutation.
- 351/351 tests pass across 81 files, including 11 shared-draft isolation/deletion tests; typecheck, lint, local production build and Vercel build pass. `knip` still identifies an older unused login component, five unused exports, and unlisted `server-only` imports; dead-code cleanup is not claimed.
- Authenticated deployment-protection access returned login HTTP 200 and unauthenticated draft API HTTP 403 with no data. Public-domain login returned HTTP 200; Vercel inspect confirms the domain resolves to this release. Genuine customer-role, actual mobile, live uploads, invitation receipt and payment reconciliation remain unverified.
- Source UI review applied the React skill checklist, including scoped effects/cache identity, server authorization, and accessible controls. Local browser confirmed the RFQ checkbox and expired-quote renewal screen; screenshot at `screenshots/rfq-approval-2026-10-08.jpg`.

## Stripe account findings

The Stripe connector was not connected. The existing Chrome session showed a “New business sandbox” with Tax “Get started.” Switching to its live account opened business activation (10% verified, business type/details and review still pending). The primary account then returned to test mode and stated that verification is needed to move real money. Browser tabs became unavailable before the account switcher could be inspected. These observations establish that the visible account is not activated; they do not establish that it owns Lattice's existing key. Production has a live publishable key plus protected secret/webhook entries; secret values were not retrieved. Its publishable key differs from the visible test keys, so account ownership and live Tax registrations remain unconfirmed. User must supply/attest legal business and payout details if this is the intended merchant account. Never infer registrations or silently turn on tax collection. Checkout remains gated off until account mapping, final shipping/tax amounts and controlled payment/webhook/refund tests pass.

### Correct-profile follow-up

The user identified a new Chrome window signed in as will@latticeos.co. Native browser inspection there shows **Nexus Manufacturing Technologies, Inc.**, account `acct_1TcAE25pzNAaqmdk`. Its live Account Status is Active, Payments and Payouts active, with no active tasks. The earlier New business activation warning belonged to a different Chrome profile and is superseded for this user-confirmed merchant. The correct live Tax overview still shows Get started. Business activation is not the current blocker for Nexus; Tax configuration/registrations, runtime-key ownership and controlled integration testing remain.

User confirmed the existing tax registration is New York only. Correct Stripe setup shows registration/automatic collection Not Started and default product category General - Electronically Supplied Services. Do not use that category for manufactured parts. Runtime tax integration must use the appropriate physical-goods category and the confirmed registration. No live Tax activation, subscription, new government registration, or paid test occurred. Admin lifecycle-email retries are implemented with provider idempotency, failure status and attempt counts; quality notices target the owning company’s Customer Admins. Seven delivery/authorization tests pass without external email.

Final source commit `d9ee924f223c66d1ba1799158b48fe9b10b8f99b` is on main and the audit branch. Production is Ready at the deployment above; public login 200 and draft API 403 were verified after this final application release. The subsequent handoff commit changes documentation only.
