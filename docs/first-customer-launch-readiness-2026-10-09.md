# First-customer launch readiness

Assessment date: 2026-10-09. Scope: onboard one real customer, receive an RFQ, issue a supplier-backed quote, accept an order and reliably execute it. This is a repository and recorded-evidence review, not a fresh production certification. The founder-led cohort remains the baseline.

## Current position

The production customer-to-RFQ path has been demonstrated. Commercial ordering is not yet ready: live checkout remains disabled. Production Stripe credentials now pass the authenticated Nexus merchant readiness diagnostic; a signed Live webhook delivery has not yet been observed. William confirmed card payment with a customer PO reference. Target: Tuesday, October 13, 2026. PO credit terms remain outside the initial release. First-job details are not yet known.

Engineering update (2026-10-10): the separate Neon development database is reachable and currently contains no companies, requests, or invoices. The local Stripe credential authenticates to the expected Nexus account with `livemode=false`; a Test-mode webhook secret is configured. Optional PO capture is implemented through checkout validation, pre-payment Request persistence, Stripe metadata, webhook finalization, order data, and immutable invoice snapshot/PDF paths. Resend accepted one clearly labeled test-only email from `support@latticeos.co` to the admin address (HTTP 200); inbox receipt is not yet confirmed. Full tests (382 tests across 86 files), typecheck, lint, and optimized build pass. A database-backed RFQ → quote → paid order → invoice rehearsal has not yet run. Live checkout remains disabled.

Latest evidence supersedes older open items in TODO and earlier audits:

- Production invitation/resend, actual Gmail receipt and matching PDF attachment, personal-password setup, genuine customer login, address persistence and required-ZIP validation passed.
- A synthetic customer RFQ reached the admin queue. CAD/drawing downloads matched original bytes and survived deployment. Anonymous access and second-company scoped support access were rejected. Old temporary-password rejection passed.
- Customer tour replay, all four steps, refresh/resume and completion persistence passed. Clean-company automatic first-run, skip, mobile/accessibility and genuine second-customer isolation remain open.
- Local Stripe Test mode exercised NY/PA checkout, decline, failed/successful 3DS, cancel/retry, partial/full refunds and signed callbacks. Some duplicate/late-event replays passed. These used local mock records, not a database-backed customer purchase on production-equivalent infrastructure.
- Latest recorded checks: 379 tests pass; typecheck, targeted lint, and optimized build pass. Those results do not certify the outstanding commercial flow.

Engineering update (2026-10-10): added separate authenticated customer drawing-download links for desktop and narrow layouts, corrected Account Settings card-availability copy to mirror hosted checkout gating, and made production RFQ and customer-profile reads fail closed on database errors. Full tests (382 tests across 86 files), typecheck, lint, and optimized build pass. Documented first-order release, quality-hold, refund/cancellation, failed-email, and service-recovery procedures in [the first-customer operations runbook](first-customer-operations-runbook.md). The runbook still needs William's operator backup, commercial policy, and Production access decisions. The Test database remains without a synthetic company/RFQ, so a database-backed paid-order rehearsal is not complete. Vercel environment inspection was blocked by a 403 for the current connector scope; no production values were read or changed.

## Ranked tasks

Rank expresses launch importance. Independent work can run together. Owners are proposed responsibilities, not new assignments or business decisions.

| Rank | Task | Proposed owner | Completion test |
| --- | --- | --- | --- |
| 1 | Add the confirmed customer PO reference to card purchasing. | Engineering; William gathers first-job details | Card checkout accepts an optional customer PO number, preserves it through Stripe/webhook-only fulfillment and shows it on the order and immutable invoice. PO remains a purchasing reference, not payment authorization. A PO document attachment can be handled through an explicit operator process initially if not required in checkout. Ask for job value, destination and quality requirements during qualification, before quoting. |
| 2 | Repair and verify Production Stripe configuration. | William supplies key securely; engineering verifies | Runtime authenticates to the expected Nexus account; merchant/Tax readiness passes; actual signed Production webhook delivery is demonstrated. Variable presence and unsigned-webhook rejection do not prove signed delivery. Keep live purchasing off until the remaining gates pass. |
| 3 | Rehearse the entire RFQ → quote → paid order flow. | Engineering and William | Use a genuine customer identity, database-backed records and isolated production-equivalent Test mode. Submit representative multipart CAD/drawings, clarify/revise, attach supplier pricing, issue a final DDP quote, receive email, review/pay, see exactly one order and download the issued invoice. Saved prices, revisions, addresses, shipping, tax and payment must agree. Do not quote the existing Production proof RFQ: its notes prohibit quoting/manufacturing. |
| 4 | Finish payment edge cases and accounting reconciliation. | Engineering; William owns accounting procedure | Verify webhook-only fulfillment without a return-page visit, duplicate/late events, concurrent checkouts, expired/revised quotes, amount/session ownership and pending/failed refunds with database-backed records. Exactly one accepted order and primary invoice exist. Establish a traceable credit-note/refund process and manufacturing-cancellation authority; an explicit manual procedure may suffice initially. Refund status must not silently cancel supplier production or rewrite the original invoice. |
| 5 | Close first-run, recovery and genuine company/role isolation gaps. | Engineering and controlled-account operators | A clean account automatically reaches password/address setup and first welcome. Finish/skip/resume work; expiry, failed delivery/resend and password recovery work. Two genuine customer logins cannot access one another's drafts, RFQs, orders, checkout mutations or file/invoice/quality documents. Customer Members cannot perform Customer Admin quality approval. |
| 6 | Fix customer-facing gaps and verify supported devices. | Engineering | Customer can download the correct drawing/revision; settings accurately reflects purchasing availability. Complete the supported flow on desktop and an actual mobile viewport with usable focus, keyboard and error behavior. If CAD preview is promised, prove a representative solid model; otherwise keep preview failure non-blocking and provide original-file access. |
| 7 | Lock commercial terms and supplier readiness for the first job. | William | Supplier confirms revision, manufacturability, material, quantity, finish/tolerances, documentation, price and capacity. Quote includes supported DDP delivery, actual shipping cost, dates, expiry and accessible purchasing terms. Customer understands cancellation/rework/refund handling. Operator can issue the correct supplier PO with supplier costs and has an accountable shipment/import path. Preserve supplier package and acknowledgment even if managed manually. |
| 8 | Rehearse fulfillment, quality holds and communications. | William and engineering | Demonstrate acknowledgment, production/QC updates, inspection upload, applicable Customer Admin approval, revised-document invalidation, shipment hold/release, tracking and delivery. Confirm actual clarification/quote/quality/shipment emails and support replies. Assign operator backup, internal response target and failed-email review/retry cadence. Scheduled automation may follow a reliable manual process. |
| 9 | Verify production resilience and recovery. | Engineering; William owns response | Confirm customer mode, private durable storage, current schema, recoverable database/files and documented restore/rollback. Exercise database/storage failure: no apparent success into ephemeral fallback or misleading demo data. Generic repository fallback paths need review; a live failure has not been demonstrated here. Monitor payment/webhook errors, app errors and failed email. Reconcile unavailable legacy Impeller attachments if relevant to the first job; never infer recoverable bytes from filenames. |
| 10 | Complete release verification and observed first-customer rollout. | William and engineering | Relevant auth/full tests, typecheck, lint and final build pass for the release. Record gate evidence, deploy and smoke-test the exact release. Enable live checkout only after purchasing gates pass. Observe first activation/RFQ/quote/purchase and reconcile payment/order/invoice before supplier release. Maintain an immediate checkout-disable and support procedure. |

## Release sequence

Before inviting a customer who expects immediate purchasing, close account/data/UX gates and confirm the supported purchasing path. Discovery can proceed while checkout work continues, with clear ordering availability.

Before accepting the first payment or PO commitment, close payment/accounting, end-to-end order, commercial/supplier and recovery gates. Production-equivalent Test mode validation comes first; a real charge requires a deliberately authorized commercial purchase or controlled live validation.

Before supplier release, lock the accepted revision/package, reconcile payment or approved credit authorization, record supplier PO/acknowledgment and clear applicable holds. Rehearse quality/delivery behavior before taking the order, although actual inspection and delivery occur later.

## Defer unless the first customer requires it

- Customer self-service team invitations, roles and integrations; operator provisioning is available.
- Company saved-card vault and fine-grained card permissions; initial hosted checkout avoids relying on the unfinished vault.
- Supplier self-service portal; supplier communication is operator-managed.
- Address autocomplete; validated manual entry exists.
- Activation-link replacement; the controlled temporary-password workflow is approved for the cohort.
- Broad catalog/photo expansion, analytics polish, unrelated dead-code cleanup and quote-workbench refinements.
- Fully automated email retries and credit-note issuance, provided manual processes are explicit, traceable and reliable.

PO credit terms and exemption support are deferrable only if the first customer does not require them.

## Target schedule: Tuesday, October 13

This is a proposed work sequence, not a guarantee that unknown failures fit the available time. Weekend work is part of the suggested timeline.

| Date | Focus | Exit condition |
| --- | --- | --- |
| Fri Oct 9 | Fix live Stripe credential blocker; specify PO-reference persistence and identify the intended first customer/contact. | Runtime merchant check succeeds; purchasing stays disabled; agreed PO field scope is clear. |
| Sat Oct 10 | Implement PO reference and drawing-download/payment-copy fixes; exercise a database-backed Test mode order and issued invoice. | Genuine customer can complete the representative order flow; PO survives webhook-only completion and appears correctly in the invoice. |
| Sun Oct 11 | Finish clean-account/recovery, genuine second-company isolation, mobile and payment edge-case checks; rehearse quality/email/support operations. | Material failures fixed; remaining work has an explicit owner and completion test. |
| Mon Oct 12 | Verify signed Production delivery, recovery/monitoring and commercial operating procedures; run final checks, deploy and rehearse. | Recorded go/no-go review passes for onboarding and purchase readiness separately. No material new feature work after this review unless required to repair a blocker. |
| Tue Oct 13 | Founder-led invitation and assisted onboarding; help customer prepare the first RFQ. | Customer activates and can submit a complete package. If an issued supplier-backed quote is ready and purchasing gates passed, customer can pay by card with a PO reference. |

The first real PO need not occur on Tuesday: supplier-backed pricing and confirmed job scope must precede purchase. The Tuesday target is onboarding with purchasing capability ready; an actual order date depends on the customer and supplier response.

If Monday's payment gates fail, do not describe the app as order-ready. Offer RFQ-only onboarding only if its account, privacy, storage and support gates pass and the customer is explicitly told purchasing is pending. This fallback does not satisfy full purchasing readiness and does not silently change the target.

## Remaining customer information

The intended first customer/contact, job value, destination and quality requirements are still unknown. Gather these before provisioning/quoting as appropriate; their absence does not prevent representative technical validation now. Do not assume tax exemption, controlled-part eligibility or supplier capacity.

## Evidence

- [Production onboarding proof](audits/customer-onboarding-proof-2026-10-09.md)
- [Checkout audit and subsequent payment evidence](audits/customer-checkout-2026-10-08.md)
- [Completed work log](completed-work-log.md), latest October 9 entries
- [First-customer onboarding playbook](first-customer-onboarding-playbook.md)
- Source: `src/app/(workspace)/quotes/[requestId]/actions.ts` enforces card-only and DDP purchasing and has no card PO-reference capture; `src/components/buyer-quote-checkout.tsx` puts PO fields in the disabled branch.
- Source: `src/lib/customer-lifecycle-email.ts` provides durable events/operator retries; `src/lib/local-file-storage.ts` provides remote storage; `src/lib/request-repository.ts` contains fallback paths needing failure-mode verification.
