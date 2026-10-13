# First-customer operations runbook

Status: working procedure for the first customer; business-specific items that need William's approval are called out below. This runbook is for one assisted onboarding and manually coordinated orders, not a promise of automated fulfillment.

## Before sending an issued quote

1. Confirm the customer identity and the exact drawing/CAD revisions, line items, material, quantity, finish, tolerances, due date, and requested inspection documents. Record unresolved assumptions and obtain the customer's written clarification before supplier release.
2. Confirm supplier manufacturability, capacity, price, lead time, quality-document commitment, shipping method, shipping cost, and supported DDP/import terms. Do not issue a purchasing quote with unverified supplier cost or delivery terms.
3. Confirm the customer's ship-to address, quote expiry, subtotal, shipping, tax treatment, and final payable amount. The customer pays by card; an optional PO number is only a reference and does not create credit terms.
4. Issue the quote from the saved supplier-backed pricing. Confirm the lifecycle email is accepted and then check actual receipt; provider acceptance alone is not receipt proof. If the event fails, inspect `/admin/support`, correct the recipient/configuration, and retry the same queued event once.

## After card payment and before supplier release

1. Confirm Stripe shows the payment as succeeded and the Lattice order is `PAID`; compare the captured amount, tax, shipping, currency, and customer PO reference with the accepted quote and immutable invoice.
2. Confirm exactly one order and one issued primary invoice exist for the accepted quote. If the webhook is delayed or the app's return page was not reached, wait for webhook reconciliation and inspect the order before retrying anything.
3. Freeze the accepted drawing revision and supplier package. Generate and review the supplier PO against the selected supplier quote, quality requirements, shipping responsibility, and dates. Obtain supplier acknowledgment before treating work as released.
4. Do not release work while payment, quote revision, address, amount, or quality requirements are ambiguous. Do not change a released order's supplier package without recording the revision and obtaining the needed buyer/supplier acknowledgment.

## Production, quality, and shipment

1. Record supplier acknowledgment, confirmed start/finish estimates, and material/capacity changes in the order activity. Send the buyer a concise update when an agreed milestone changes.
2. Keep the order on hold while required inspection/material documents are missing or a requested Customer Admin approval is pending. Upload the current revision, request approval through the order workflow, and verify a revised document invalidates approval of its earlier version.
3. Release shipment only when required documents and approvals are complete. Record carrier, tracking, shipped date, and delivery confirmation; verify the buyer's shipment notice is received.
4. Route buyer replies and support requests to the named order owner. Until another operator is assigned, William is the primary support owner; the existing customer-facing support expectation is typically 1–8 hours.

## Payment exceptions, refunds, and cancellation

- Never treat a redirect/return page or an emailed receipt as payment proof; reconcile from Stripe's successful payment and the saved order state.
- For a duplicate/late event or an amount mismatch, pause supplier release, preserve the original quote and invoice, inspect Stripe and the order audit trail, and resolve through an idempotent reconciliation. Do not create a second order to clear a pending state.
- A refund must be initiated in Stripe by an authorized operator and reconciled back into Lattice from Stripe's signed event. Record the reason and Stripe reference. Keep the original invoice immutable; follow the accountant-approved credit/adjustment procedure separately.
- A customer cancellation request is not a supplier cancellation. Record the buyer request, obtain supplier stop/cancellation confirmation and any cost exposure, then confirm the commercial resolution with the buyer before changing production state or refunding.
- Do not promise refund timing, restocking/rework charges, cancellation rights, or tax treatment until William/accounting approves the applicable customer terms.

## Service and incident response

- Review `/admin/support` for failed customer-email events at the start and end of each business day while the first order is active. Retry only after checking the address and sender configuration; preserve the original idempotency key.
- If checkout, order persistence, files, or webhook reconciliation is unhealthy, stop new purchases by setting the Production `STRIPE_CHECKOUT_ENABLED` flag to `false` and deploying the configuration change. Verify checkout is unavailable, preserve existing orders, and contact the customer with a clear status. Do not disable or delete payment/webhook records to hide an incident.
- If the database or private file store is unavailable, stop RFQ submission and quote/order release until service is restored. Do not use local development fallback data as a production recovery. Restore from the provider's supported recovery point, then reconcile recent RFQs, uploads, Stripe events, orders, invoices, and email events before resuming.

## Items William must approve before commercial rollout

- Name a backup operator and confirm who can release a supplier PO, authorize a refund, approve a cancellation, and change Production payment configuration.
- Confirm the support-response target (the current playbook says typically 1–8 hours) and the hours/days it applies.
- Approve the customer-specific cancellation/refund language and the accountant-approved credit/adjustment process.
- Confirm the supplier/import owner and the first job's scope, destination, value, and required quality documents before issuing its real quote.
- Choose whether the remaining signed Production webhook proof will come from the first real customer payment or a separately approved controlled Live charge/refund.
