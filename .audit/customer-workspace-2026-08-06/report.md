# Lattice OS Customer Workspace UX Audit

Date: August 6, 2026

## Scope

This combined UX and accessibility audit covers the authenticated customer workspace in the local Lattice OS application. The primary customer goal is to submit a manufacturable RFQ, understand its progress, review a quote, place an order, and confidently monitor production through delivery.

The audit inspected the rendered desktop experience for Dashboard, Request Quote entry, Quotes, Orders, Order Detail, Notifications, Materials, Roadmap, and Account Settings, plus a mobile Dashboard viewport. The session was an administrator operating the customer workspace, so the visible Admin workspace bridge is not treated as a customer-facing issue.

## Overall Verdict

The product has a credible visual foundation and a particularly strong order-detail information architecture. It is not ready for broad customer rollout yet. The main blockers are trust-breaking demo or internal content, incomplete account and organization behavior, unclear separation between customer actions and Lattice-monitored status, and a mobile information hierarchy that delays the most important work.

The recommended launch strategy is to narrow the customer workspace around three promises: submit an RFQ, respond to quote-related work, and track an order. Secondary product-marketing and roadmap surfaces should not compete with those promises until the core workflow is durable.

## Highest-Impact Recommendations

### 1. Remove all internal, demo, fixture, and placeholder content before customer access (P0)

The order detail page exposes phrases such as `reference/name-only`, `Not recorded`, `Pending review`, and an internal persistence-testing note. Account Settings states that changes are stored for a demo session and that MFA is paused. These details make the product look unsafe even when the underlying layout is good.

- Replace technical placeholders with deliberate customer states and an expected next update.
- Remove seeded test names, persistence-test notes, and internal operator language from customer-visible records.
- Add a pre-release content gate that searches rendered customer data for known fixture and fallback strings.
- Do not expose controls that appear durable until their persistence, authorization, and recovery behavior is production-ready.

### 2. Make account, company, and payment behavior genuinely production-ready (P0)

Account Settings presents security, team membership, financial permissions, cards, purchase orders, shipping, and billing as one mature system, but several areas are demo-only or incomplete. This is especially risky because customers will interpret these surfaces as authoritative.

- Replace exact-email ownership with durable company membership and explicit user roles before multi-user customer rollout.
- Require a clear MFA policy for financial and permission changes.
- Make team membership, role changes, email changes, and account recovery real or temporarily hide them.
- Either complete PO terms and approval controls or remove the coming-soon PO section from the launch workspace.
- Confirm that payment cards, addresses, and permissions shown in the UI always come from the same durable source used at checkout.

### 3. Separate “you need to act” from “Lattice is monitoring” (P1)

The Dashboard uses one Action Center for customer-owned tasks and passive Lattice monitoring. In the captured state, two schedule confirmations count as open items even though no customer action is needed. Notifications then adds another layer of explanation about workflows, creating conceptual overhead.

- Reserve Action Center for customer-owned decisions, missing information, expiring quotes, approvals, and document review.
- Present Lattice-monitored milestones as a compact order-status summary, not an action count.
- Every actionable row should state the action, deadline, consequence, and destination.
- Use the bell for event history; avoid duplicating open-work metrics on both Dashboard and Notifications.

### 4. Complete quote-to-order continuity (P1)

The current customer has two orders but the Quotes page shows no submitted RFQs. That may follow the product rule that purchased records leave Quotes, but it breaks customers' mental model and removes easy access to the commercial record that produced the order.

- Preserve accepted quote history from the order detail page, including quote version, validity, price basis, shipping terms, and downloadable quote.
- Rework the Quotes empty state to explain the customer outcome rather than internal buyer/operator mechanics.
- Ensure every RFQ state has a clear next step: draft, submitted, clarification needed, under review, quote ready, expired, declined, accepted, and converted to order.
- Test the complete journey with realistic customer data, including revisions, no-quotes, expired quotes, card checkout, and PO checkout.

### 5. Simplify navigation and mobile hierarchy around customer jobs (P1)

Desktop navigation gives Materials, Capabilities, Equipment, and Roadmap equal prominence with Quotes and Orders. On mobile, the summary cards stack before the Action Center and the compact navigation visibly prioritizes only Home, Quotes, and Orders, leaving resources dependent on horizontal discovery.

- Keep primary navigation focused on Home, Quotes, Orders, and Help or Account.
- Consolidate Materials, Capabilities, and Equipment into one secondary Sourcing Library or move them into RFQ creation where they support a decision.
- Hide Roadmap from the default customer navigation during launch; invite selected design partners to it contextually.
- On mobile, show customer-owned actions before KPI cards and compress zero-value metrics into a single summary row.
- Replace horizontally hidden navigation with a clear overflow menu or mobile navigation sheet.

## Step-by-Step Health

### Step 1: Dashboard - Needs work

Evidence: `01-dashboard.jpg`, `09-dashboard-mobile-viewport.jpg`

Strengths: restrained enterprise styling, clear primary Request Quote action, scannable metrics, and clickable workflow rows.

Risks: passive monitoring inflates the Action Center; the activity table repeats order information already available elsewhere; mobile customers must scroll through four large cards before reaching meaningful status.

### Step 2: Request Quote entry - Healthy foundation

Evidence: `02-request-quote.jpg`

Strengths: clear title, file-first start, autosave reassurance, accepted formats and size limit, and a simple four-stage progress model.

Risks: the initial upload canvas is visually oversized, and the full configuration/review/error path was not exercised because submitting files would create data. Before launch, validate draft recovery, upload failure, unsupported files, multi-part configuration, required-field errors, and successful submission.

### Step 3: Quotes - Needs work

Evidence: `03-quotes-empty.jpg`

Strengths: clean empty state and one obvious recovery action.

Risks: “buyer-facing quote tracker” and “operator review continues internally” are system-oriented phrases. With existing orders but no quotes, the page also feels disconnected from the customer's commercial history.

### Step 4: Orders list - Good with cleanup

Evidence: `04-orders.jpg`

Strengths: search, summary metrics, full-row navigation, useful status and next-step columns, and good scanning density.

Risks: status is repeated several times within each row; supplier naming is generic; long titles truncate without an obvious way to inspect them; two top metrics remain zero and consume substantial space.

### Step 5: Order detail - Structurally strong, rollout-blocked by content

Evidence: `05-order-detail.jpg`

Strengths: excellent coverage of current status, shipment, parts, files, quality records, pricing, billing, invoice, reorder, support, and account manager information.

Risks: visible internal/test content is a P0 trust failure. The page also gives equal weight to many pending states without distinguishing normal waiting from an exception. The most important customer question, “when will this move next?”, lacks a committed update time.

### Step 6: Notifications - Needs simplification

Evidence: `06-notifications.jpg`

Strengths: chronological list, full-row links, and a clear route back to open work.

Risks: explanatory copy about the relationship between notifications and workflows is too conceptual. Event copy such as “Buyer moved the quote” sounds like an audit log, not a customer update. Read/unread state, preferences, delivery channels, and meaningful grouping are not visible.

### Step 7: Materials - Needs restructuring

Evidence: `07-materials.jpg`

Strengths: credible breadth, traceability positioning, and category grouping.

Risks: the introductory copy is long, the display typography is much larger than the operational workspace, repeated imagery adds little inspection value, and symbols such as price/ease and unlabeled counts are difficult to interpret. The catalog does not directly help a customer start or improve an RFQ.

### Step 8: Account Settings - Not launch-ready

Evidence: `08-account-settings-viewport.jpg`

Strengths: sensible grouping of personal, company, security, payment, and default manufacturing information.

Risks: demo persistence, paused MFA, coming-soon behavior, and live-looking financial permissions coexist on one screen. Styling and density differ noticeably from the rest of the workspace. This surface needs a security, persistence, and content pass before customer exposure.

### Step 9: Mobile Dashboard - Needs work

Evidence: `09-dashboard-mobile-viewport.jpg`

Strengths: no visible overlap, readable type, and appropriately sized primary controls.

Risks: stacked metrics create a long route to Action Center; secondary navigation is not clearly discoverable; table behavior below the fold still needs breakpoint testing; the admin simulation control consumes scarce header space in this test session.

### Step 10: Roadmap - Healthy experiment, wrong launch prominence

Evidence: `10-roadmap.jpg`

Strengths: clear categories, interest controls, customer-value framing, and understandable maturity labels.

Risks: it advertises missing capabilities, displays zero-customer social proof, and competes with the core procurement workflow. Keep it behind a research invitation until customers trust and repeatedly use the core system.

## Accessibility Risks

- Several secondary text colors and uppercase micro-labels appear low contrast; measure them against WCAG AA rather than relying on visual inspection.
- Status cannot rely on color alone. Some rows pair color with text, which is good, but the entire system should be checked consistently.
- Mobile navigation requires explicit keyboard, screen-reader, and horizontal-overflow testing.
- The order list and dashboard table need responsive reflow and 200% zoom verification.
- Drag-to-reorder sidebar behavior is mouse-oriented and should have a keyboard equivalent or be removed from the customer shell.
- Validate focus order and visible focus across dialogs, account editing, upload, quote review, checkout, and destructive actions.
- Dynamic events such as autosave, upload progress, validation, checkout status, and saved settings need accessible live-region announcements.

## Recommended Rollout Sequence

1. P0 trust cleanup: remove fixtures, internal notes, demo banners, and ambiguous placeholders from all customer-visible records.
2. P0 account hardening: durable company membership, roles, MFA policy, payment and address source-of-truth, and recovery flows.
3. P1 workflow completion: exercise RFQ submission through quote revisions, checkout, accepted-quote history, order updates, quality documents, shipping, and help.
4. P1 information architecture: simplify Action Center, Notifications, primary navigation, and mobile hierarchy; hide Roadmap by default.
5. P1 quality gate: responsive testing, keyboard and screen-reader testing, contrast measurement, error recovery, empty states, realistic copy, and production smoke tests.

## Evidence Limits

- This was a local application audit, not a production deployment audit.
- The session was an admin account simulating the customer workspace; true customer-role restrictions were not visually retested.
- No RFQ file was uploaded, no quote was purchased, no payment was made, and no account data was changed.
- Screenshots and DOM structure support likely accessibility risks, but not a claim of WCAG compliance or failure. Screen-reader, full keyboard, contrast-tool, zoom, and reduced-motion tests remain required.
- The Materials screen was used as the representative resource-catalog surface; Capabilities and Equipment were not captured in depth.
