# Customer Action Center And Notification Spec

Last updated: 2026-06-17

This is the working document for the customer-facing Action Center and Notifications center. Use it to edit the notification taxonomy, define grouped customer workflows, and keep dashboard behavior aligned with quote and order activity.

## Current Principle

The Action Center should answer what needs attention next. Notifications should preserve the chronological record of what happened. An event can appear in notification history and also create a grouped action workflow, but reading the event does not resolve the workflow.

V1 does not use separate workflow/notification tables, read/unread persistence, explicit checklist completion, or mark-read actions. Workflows and notification rows are derived from existing records.

## Notification Types

| Family | Notification | Trigger / Source | Needs Attention? | Destination | Notes |
| --- | --- | --- | --- | --- | --- |
| RFQ status updates | Draft created | RFQ status event enters `DRAFT` from no prior status. | No | `/requests/new?draft=[requestId]` | Keep out of the dashboard Inbox. This belongs in quote activity/audit history because the buyer created the draft themselves. |
| RFQ status updates | RFQ submitted | RFQ status event moves from `DRAFT` to `SUBMITTED`. | No | `/quotes/[requestId]` | Dashboard copy: `Lattice received your RFQ and is reviewing the files and requirements.` |
| RFQ status updates | Quote closed | RFQ status event moves to `CLOSED`. | No | `/quotes/[requestId]` | Keep out of the dashboard Inbox. This can remain in the full Notifications page and quote activity/audit history. |
| Needs-attention quote items | More information requested | RFQ status event moves to `NEEDS_INFO`, or current request status is `NEEDS_INFO` without a matching event. | Yes | `/quotes/[requestId]` | Buyer needs to clarify details before pricing continues. |
| RFQ status updates | Quote ready for review | RFQ status event moves to `QUOTED`, or latest `customerQuotes` item exists without a matching quoted event. | Yes when request is currently `QUOTED` | `/quotes/[requestId]` | Buyer should review price, lead time, and checkout options. This lives under RFQ Progress, not a separate quote-ready family. |
| Order progress | Order placed | RFQ status event moves to `PURCHASED`. | No | `/orders/[requestId]` | Links the buyer from the quote flow into the order view. |
| Order progress | In Production | Supplier order update status is `IN_PRODUCTION`. | No | `/orders/[requestId]` | Customer-facing production milestone. |
| Order progress | Inspection In Progress | Supplier order update status is `QC_IN_PROGRESS`. | No | `/orders/[requestId]` | Customer-facing inspection milestone. |
| Quality/document uploads | Material cert uploaded | Supplier document category is `MATERIAL_CERT`. | Yes | `/orders/[requestId]` | Buyer should review quality documentation. |
| Quality/document uploads | Inspection report uploaded | Supplier document category is `INSPECTION_REPORT`. | Yes | `/orders/[requestId]` | Buyer should review quality documentation. |
| Quality/document uploads | Certificate of conformance uploaded | Supplier document category is `CERTIFICATE_OF_CONFORMANCE`. | Yes | `/orders/[requestId]` | Buyer should review quality documentation. |
| Quality/document uploads | Packing slip uploaded | Supplier document category is `PACKING_SLIP`. | Yes | `/orders/[requestId]` | Buyer should review shipment/order documentation. |
| Quality/document uploads | Other documents uploaded | Supplier document category is `OTHER`. | Yes | `/orders/[requestId]` | Buyer should review new documentation. Photo uploads remain visible in order detail but do not create Inbox notifications. |
| Shipping updates | Order shipped | Supplier order update status is `SHIPPED`, or current supplier order status is `SHIPPED` without a matching update. | No | `/orders/[requestId]` | Consolidates shipped and tracking availability into one notification; the supplier should add the tracking number when marking the order shipped. |

## Dashboard Behavior

- `/dashboard` leads with the highest-priority unresolved workflows, each with an owner, due context, progress, short checklist, and continuation action.
- `/dashboard` separately shows the newest high-signal notifications under Recent Updates.
- `/notifications` shows the full derived feed, including lower-level audit events such as draft creation and quote closure.
- Quote review and quote expiration collapse into one workflow for the same RFQ.
- The Actions KPI counts grouped workflows, not raw notifications.
- Copy must not use `Unread` until read-state is persisted.
- Dashboard RFQ status rows should include `RFQ submitted` and action-required `Quote ready for review`.
- Do not create customer notification rows for `Supplier pricing started`; supplier-pricing movement remains internal/admin or quote-activity context.
- Shipping should use one `Order shipped` notification. Do not create a separate `Tracking available` notification unless tracking is added later as a separate operational event in a future version.

## Current Implementation

- Feed builder: `src/lib/customer-notifications.ts`
- Workflow builder: `src/lib/customer-action-center.ts`
- Dashboard summary builder: `src/lib/customer-dashboard.ts`
- Dashboard page: `src/app/dashboard/page.tsx`
- Notification center page: `src/app/notifications/page.tsx`

## Proposed Editing Area

Use this section to adjust product behavior before implementation.

### Should Be Attention-Requiring

- More information requested.
- Quality/document uploads.

### Should Be Informational

- RFQ submitted.
- Order placed.
- In Production.
- Inspection In Progress.
- Shipping updates.
- Quote closed.

### Removed From Notification Taxonomy

- Photos uploaded. Photos remain visible in order detail, but they should not create separate customer Inbox rows.
- Tracking available. This is folded into `Order shipped` because shipment and tracking should be posted together.
- Order ready to ship. This is too close to the shipping notification and should not create a separate customer Inbox row.
- Awaiting supplier acknowledgment and generic supplier movement. These are internal production-management states unless they become delayed or blocked.
- Supplier pricing started. This is internal procurement progress and should not create a customer Inbox row.

### Documents Need Review Definition

`Documents need review` means Lattice or the supplier uploaded customer-relevant quality/compliance documentation that the buyer may need to inspect, retain, or forward internally. In V1 this includes inspection reports, material certificates, certificates of conformance, and other required quality documents. It does not include photos, and tracking availability is handled by the shipping notification.

### Open Questions

- Should `PO shipped` become attention-requiring when tracking details are missing?
- Should packing slips be informational instead of attention-requiring?
- Should the dashboard Inbox default to action-required items first, then newest informational items?
- Should supplier updates be grouped when many statuses change in one day?

## Future V2 Ideas

- Add a durable activity table.
- Add persistent read/unread state.
- Add notification preferences by customer/company/user.
- Add email notification digests for quote issued, needs info, shipped, and documents uploaded.
- Add explicit customer actions on Inbox rows, such as `Review quote`, `Answer question`, or `View documents`.
- Add activity grouping by RFQ/order so long-running orders do not crowd out new work.
