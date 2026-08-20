# First Customer Onboarding Playbook

## Purpose and cohort

Run the first ten Lattice customers as a **founder-led design-partner cohort**, not as a self-serve launch. The first objective is to prove the complete operating loop with real work: a domestic machine shop routes an otherwise-declined or capacity-constrained job to Lattice, receives a supplier-backed quote, places an order when appropriate, and sees a reliable production/quality/shipping update trail.

Target: 10 domestic machine shops, enrolled in two waves of five. Start wave two only after wave one's first-RFQ and support patterns are understood.

Suggested program promise: “Lattice gives your shop a managed way to pursue overflow and out-of-capability work. For this early cohort, I will personally help set up the account, validate the first RFQ package, and keep you close to the production path.” Do not promise a price, lead time, capacity, or outcome before the specific job has been reviewed.

## First: keep the relationship clean

Because prospects are known through Amogy, make a deliberate separation before outreach.

- Review Amogy's employment agreement, confidentiality obligations, customer/non-solicit provisions, conflict-of-interest policy, and any use-of-contacts or outside-business policy. Obtain written internal guidance or consent when it is required; a local attorney can advise on the specific agreement.
- Use only contact information and relationships you may lawfully use personally. Do not export Amogy CRM data, customer lists, drawings, pricing, supplier terms, or other non-public information into Lattice.
- Do not target an account that is actively in an Amogy commercial process, and do not position Lattice as affiliated with, endorsed by, or acting for Amogy.
- Send outreach from Lattice channels on personal time and keep a simple record of the relationship source, conflict check, outreach date, and consent.
- Be transparent in the first conversation: Lattice is an independent, early-stage service; participation is optional; their RFQs and files will be handled in Lattice rather than through Amogy.

This is a business-operating guardrail, not legal advice. If the agreement is unclear, pause that prospect rather than trying to interpret it in the field.

## Who belongs in the first ten

Score each prospect before inviting them. The cohort should prioritize learning quality over total RFQ volume.

| Criterion | What good looks like | Weight |
| --- | --- | ---: |
| Real trigger | Regular overflow, a capability gap, or a job they would otherwise no-quote | 30% |
| Fit | CNC machining/fabrication work that matches the current supplier network and documentation model | 25% |
| Champion | Owner, estimator, project manager, or buyer who can submit an RFQ and give candid feedback | 20% |
| First-job readiness | A likely CAD-backed RFQ in the next 30–60 days | 15% |
| Learning value | Adds a useful process, material, quantity, or quality-documentation case without being unusually risky | 10% |

Invite the top five first. Keep five alternates warm. Avoid making a first-cohort job the first use of an unproven process, a safety-critical application, or a requirement that Lattice cannot document and control.

## Release gate before any invitation

Complete this checklist for a real customer environment—not mock mode—before account credentials or production drawings are exchanged.

- [ ] Production uses `LATTICE_DATA_MODE=customer`; no demo RFQs can be exposed.
- [ ] Clerk production migration/keys and a Lattice Admin login have been smoke-tested with a provisioned customer account.
- [ ] Production database schema is current and company-scoped access probes pass.
- [ ] CAD/drawing uploads are stored in durable production object storage (R2/S3 or equivalent), not local `.data/uploads`.
- [ ] The outbound sending domain/Resend path is configured and tested for account and support communications, or the high-touch manual alternative is explicitly documented.
- [ ] Card checkout and Stripe webhooks are production-configured before offering card payment. Do not offer purchase-order payment or tax-exempt handling in the cohort; both are intentionally unavailable.
- [ ] The operator has run the customer-access and manual QC plans, including cross-company file/RFQ access checks.
- [ ] A named Lattice operator owns RFQ response, quality-document review, and order-status updates; define a backup and a response-time target.

If any item is incomplete, the safe alternative is a non-production discovery call or a manually managed pilot with no customer account/files in Lattice. Do not invite customers into an environment that cannot safely retain their CAD package.

## Operating workflow

### 1. Prospect and qualify (15–30 minutes)

Reach out individually, not as a campaign. Ask about the last job they declined, delayed, or struggled to source; current process/material/quantity; customer-required quality documents; typical decision-maker; and whether a CAD-backed opportunity is likely in the next 30–60 days.

Record a one-page prospect card: company, contact, relationship source, conflict-check result, stated pain, likely first job, expected timing, decision path, process/material, quality requirements, and next step. A `not now` is useful data; do not force an account without an identifiable use case.

### 2. Fit and scope call (30 minutes)

Use a short, repeatable agenda:

1. Their overflow/no-quote pattern and a concrete recent example.
2. Explain Lattice's managed sequence: complete package → Lattice validation/supplier-backed quote → approval → customer-visible production/quality/shipping updates.
3. Confirm what Lattice can and cannot do today: invite-only access, one initial Customer Admin, card-only checkout if enabled, no customer self-service teammate administration, and human-operated support.
4. Select a first job with a clear, bounded manufacturing package. Agree the date for an assisted RFQ submission.
5. Explain early-cohort expectations: honest feedback, permission to follow up, and no obligation to place an order.

End every call with one named champion, one probable RFQ, and a dated next action. Otherwise leave the prospect in nurture rather than provisioning an unused account.

### 3. Prepare the company (internal, 15 minutes)

Before provisioning, create an internal customer brief and an account plan:

- Legal company name, shipping/billing contact and address, and the single initial Customer Admin.
- Whether that person should later receive a Customer Member teammate (Lattice Admin adds members during this phase).
- The first-job hypothesis, documentation needs, preferred communication channel, and communication boundaries.
- A plain-language pilot note covering confidentiality handling, quote validity, payment method, support route, and that Lattice is managing supplier coordination.

Create the company and first Customer Admin in `/admin/customers`. Save the generated temporary password only long enough to hand it off securely. It expires in 72 hours and the customer must set a personal password before using the workspace.

### 3a. Send the onboarding invitation (proposed product workflow)

Send a concise, branded invitation from `support@latticeos.co`, visually aligned with the Lattice public site. It should identify the customer's company and named Customer Admin, state that the account is ready, and include a direct `Activate your account` or `Log in` button, the sign-in email, three short next steps, and an offer to schedule a short onboarding call.

Approved first-cohort sender and email metadata:

- From and Reply-To: `Lattice OS <support@latticeos.co>`.
- Subject: `Your Lattice OS account is ready`.
- Assistance: `Reply to this email for help`; William Paik owns replies and normally responds within 1–8 hours.
- Scheduling: no link in the initial invitation. A configurable Calendly link remains planned work.

The customer does **not** create a quote; they submit an RFQ and Lattice later issues a supplier-backed quote. Use that language consistently in the email and product.

**First-cohort policy:** send the sign-in email and the administrator-issued temporary password together in the branded invitation from `support@latticeos.co`. This is an intentional, limited-risk tradeoff for an empty, newly provisioned company workspace: the password expires after 72 hours, forces the recipient to choose a personal password before workspace access, and an expired or undelivered invitation can only be replaced with a newly generated password. Do not store the plaintext password in customer notes, an activity record, a CRM, an outbox, or a resend log; use it only in the email-delivery payload. The Lattice Admin must not be able to retrieve it after invitation creation.

For the later hardened workflow, replace the temporary password with a single-use, expiring activation link that lets the recipient choose their own password. That is preferable at scale, but is not required for this controlled first cohort.

Keep the invitation short:

> Welcome to Lattice, [First name]. Your [Company] account is ready. Sign in with [email] and the temporary password below. You will be required to create your personal password before entering the workspace. Submit your first RFQ when you have a package ready; we will validate it before supplier outreach and keep you updated throughout quoting and production. If you would like a hand getting started, reply to this email and we will set up a call.

When the scheduling workflow is ready, replace the last sentence with a configured scheduling link (for example, Calendly) and retain the reply-to-support option for customers who prefer it.

## Make the invitation workflow operational

### Target first-cohort experience

1. A Lattice Admin creates the company and first Customer Admin in `/admin/customers`.
2. The provisioning action generates the existing 72-hour temporary password and completes the Company, Lattice membership, and Clerk identity creation.
3. In the same successful action, Lattice sends the branded HTML invitation from `support@latticeos.co` to the provisioned work email. It includes the login URL, sign-in email, temporary password, forced-password-change explanation, support reply path, and optional scheduling link.
4. The app records only an invitation delivery event: recipient, company/user IDs, created/sent/failed/revoked timestamps, delivery-provider ID, and failure category. It never stores the temporary password or rendered email body.
5. If sending fails, the admin sees a clear failure state and can issue a new password and resend. A resend always invalidates the preceding password. If the customer has not activated before expiry, the admin uses the same reset-and-resend action.
6. The customer signs in, is forced to create a personal password, and continues through the agreed address-confirmation workflow. Initial company work is empty until the customer submits an RFQ.

Keep the current address gate for the cohort: personal-password setup → a clear shipping-address form → a clear billing-address form → dashboard. Both forms must have explicit labels and required-field validation; billing begins prefilled from shipping but requires customer review and save before access continues. These company-owned values are used for RFQs, quotes, and orders.

### Delivery plan

| Phase | Work | Definition of done |
| --- | --- | --- |
| 1. Lock the policy | Confirm the cohort-only email-password policy, sender identity, copy, address timing, support owner, and customer-call option. | Complete: approved sender/subject, reply-only support, William Paik as owner with a typical 1–8-hour response time, and the current address gate retained. |
| 2. Commission email | Verify the `latticeos.co` sending domain in Resend, configure `support@latticeos.co` as the sender/reply-to, set production environment variables, and send test mail to controlled inboxes. | Gmail/Outlook deliverability and Reply-To behavior pass; no application secret is committed to Git. |
| 3. Build invitation delivery | Add an invitation delivery service and branded responsive HTML template; connect it to Customer Admin provisioning and a new reset/resend action. Preserve the current atomic company/user/Clerk provisioning behavior. | Implemented in source: invitation sends after successful provisioning; failed delivery is visible and recoverable. Requires schema application and controlled end-to-end test before Production use. |
| 4. Protect and audit | Keep plaintext passwords out of Prisma, local fallback files, logs, server-action responses after send, and persisted email bodies. Add a minimal audit event and expiry/resend invalidation checks. | Implemented in source: `CustomerInvitation` records no plaintext credential/body; focused sent/failure tests pass. Complete expiry and browser-flow validation against a real controlled account before launch. |
| 5. Validate end to end | Use a staging customer account and controlled mailbox to create, send, activate, change password, confirm addresses, submit a test RFQ, reset/resend, and verify support replies. | The entire journey works on production-equivalent infrastructure. |
| 6. Pilot rollout | Send the first invitation manually observed; review delivery and activation within one business day before inviting the remaining cohort. | One successful real activation without support ambiguity, then release in waves. |

### Invitation implementation path

The current admin action creates the Company, Lattice user, Clerk user, and 72-hour temporary password, then displays that password only in the admin browser. It does **not** send an invitation. The implementation should replace that last handoff with the following controlled sequence.

1. **Create invitation delivery records.** Add a Prisma `CustomerInvitation` record associated with the company and Customer Admin. Persist only recipient, company/user IDs, created/sent/failed/revoked timestamps, expiry, Resend message ID, and a non-sensitive failure category. Do not persist the temporary password, an email-body copy, provider request body, or response containing credentials.
2. **Build one email service and template.** Add a server-only invitation-email module that builds a responsive Lattice-styled HTML and text email, uses `WAITLIST_EMAIL_FROM` as From/Reply-To, `APP_BASE_URL` for the login button, and Resend for delivery. The template includes the approved subject, login email, temporary password, 72-hour expiry, forced-password-change explanation, three next steps, and “Reply to this email for help.”
3. **Connect it to provisioning.** Retain the existing atomic Company/Lattice-user/Clerk-user creation. Only after that succeeds, send the invitation and record `sent`. Do not return the temporary password to the admin UI on a successful send. If delivery fails, retain the newly created account, show a clear “not delivered” state, and provide a retry path instead of pretending the customer was contacted.
4. **Implement reset-and-resend.** From the customer profile, an admin selects “Issue new password and resend.” Lattice generates a new password, changes it in Clerk and the Lattice record, invalidates the prior password, creates a new invitation event, and sends the new email. The admin never sees or retrieves the generated password. A failed retry is recorded as failed and remains retryable.
5. **Add authorization and safety tests.** Cover successful send, Resend failure, retry, expiry, prior-password invalidation, non-admin denial, no password in returned server-action state, and no password in database/outbox/logging paths. Add a visual/email-client review of the HTML at desktop and mobile widths.
6. **Run a controlled end-to-end test.** Provision a test company using `willclawpaik@gmail.com`, receive the email, sign in, set a personal password, complete shipping and billing, submit a non-sensitive test RFQ, test reset-and-resend once, then delete or clearly mark the test company.

The correct delivery semantics are **provision first, then send and audit**. Email delivery cannot be part of the same database transaction as Clerk and Resend; a recoverable failed-delivery state is safer than rolling back a successfully created identity after an uncertain provider response.

### Production-readiness work packages

#### Durable CAD/drawing storage (required before real customer files)

The app currently writes RFQ and drawing bytes to local `.data/uploads`, which is unsuitable for Vercel production. This requires both an infrastructure setup and an application change.

1. **Choose a provider.** Recommended: Cloudflare R2, because it is S3-compatible and avoids common egress charges. Use a dedicated production bucket, for example `lattice-production-files`; keep it private and do not expose a public bucket URL.
2. **William’s setup in Cloudflare.** Create the bucket, create a least-privilege API token with object read/write permissions limited to that bucket, and generate the S3-compatible access key, secret, and account endpoint. Keep all three only in Vercel Production environment settings—not Git or chat. Confirm the desired file-retention/deletion policy and geographic/legal requirements for customer CAD.
3. **Lattice implementation.** Add an S3-compatible storage adapter, switch production uploads and downloads from local files to private object keys, enforce the existing company/admin authorization before issuing a short-lived download URL or streaming a file, and retain the local adapter only for development. Apply size/type limits, retry/error handling, and a defined malware/content-scanning policy.
4. **Validation.** In a production-equivalent account, upload a harmless CAD/drawing fixture; verify it survives a redeploy, is available to its owning company and an admin, and is inaccessible to another company or an anonymous request. Also exercise supplier-quote and customer-PO file paths.

#### Clerk, database, and access smoke test

1. Confirm Clerk Production keys are set in Vercel and the production login URL/redirect settings include `https://latticeos.co`.
2. Deploy the production schema migration before creating the test account.
3. Provision the `willclawpaik@gmail.com` test Customer Admin, complete login/password/address setup, and submit a non-sensitive RFQ.
4. Create or use a second test customer and prove cross-company isolation: that second customer must not see, open, or download the first company’s RFQ or uploaded file. Confirm the Lattice Admin support view can access both as intended.

#### Payment decision

Before inviting a pilot who might place an order, choose one of these paths:

- **Card payment in Lattice:** William configures live Stripe keys and a live webhook for `https://latticeos.co/api/stripe/webhook`; Lattice then performs a live-mode test with a controlled payment and refund/void plan before offering checkout.
- **No in-app payment for wave one:** do not present card checkout as available and handle any commercial arrangement outside the product under an agreed manual process. This avoids representing the checkout path as ready, but it means the first cohort does not validate the complete in-app purchase loop.

Purchase-order payment and tax-exempt handling remain unavailable in either case.

### What Lattice needs from William

| Needed decision or action | Why it is needed | Recommended default |
| --- | --- | --- |
| Approve the cohort policy | Confirms that temporary passwords may be sent in the invitation and that the 72-hour forced-change rule stands. | Approved: Customer Admin only; empty newly provisioned workspace only. |
| Configure or authorize Resend | Lattice needs a verified sender and API access to deliver the actual email. Do not paste an API key into this document or Git; configure it in the deployment environment. | Complete for Production: `latticeos.co` delivery was tested from `Lattice OS <support@latticeos.co>`. The automated invitation service remains to be built. |
| Approve sender and copy | Avoids an invitation that recipients do not recognize or trust. | Approved: subject `Your Lattice OS account is ready`; concise founder-led copy in this playbook. |
| Choose the scheduling behavior | Determines whether the invitation offers reply-only support or a booking link. | Approved: start with `Reply to this email for help`; add Calendly later. |
| Name the support owner and response promise | Ensures replies and failed invitations do not sit unattended. | Approved: William Paik; typical response within 1–8 hours. |
| Decide address timing | Determines whether current mandatory pre-workspace address onboarding remains or is redesigned for first-RFQ confirmation. | Approved: retain current pre-workspace confirmation, with explicit shipping and billing data-capture forms. |
| Supply pilot recipients | Enables controlled test and first-wave delivery. | Test inbox chosen: `willclawpaik@gmail.com`. Outstanding: one friendly machine-shop contact who explicitly agrees to pilot. |

### Things Lattice can do without additional input

- Implement the branded invitation template using the current Lattice visual system.
- Wire it to the Lattice Admin provisioning flow and the secure reset/resend workflow.
- Add delivery-state, expiry, and non-persistence tests.
- Prepare staging and production checklists that use environment configuration rather than tracked credentials.

### 4. Activate the account (20–30 minutes, live together)

Run the first login over screen share or beside the customer when useful. The goal is not training; it is making a real first session succeed.

1. Have the Customer Admin sign in and set their personal password.
2. Complete shipping and billing defaults. These are shared company defaults, so verify the legal entity and delivery information carefully.
3. Point out only three places: Dashboard (work needing attention), New Request, and Quotes/Orders. Mention the support path.
4. Upload a non-sensitive sample only if they do not yet have a live job; do not create artificial production RFQs just to demonstrate the system.
5. Confirm who will submit the first live package and schedule the assisted submission.

Log activation as complete only when the user has logged in, completed company defaults, and can find the New Request flow.

**Current-product note:** Lattice already enforces the password-change requirement before a normal workspace route is rendered. It also currently sends a new customer without complete addresses directly to shipping/billing setup after password creation and before the workspace. That is more operationally reliable than collecting addresses after an RFQ because shipping information affects RFQ and quote handling.

If reducing first-login friction is more important, implement a specific later alternative: pre-fill the known company shipping and billing addresses during Lattice Admin provisioning, label them “Please review and confirm,” and require the Customer Admin to confirm or edit them at their first RFQ submission—**before** the RFQ is sent to Lattice. Do not defer confirmation until after a quote is issued: the quote may already depend on the delivery details. This requires a product change because the provisioning form does not currently collect addresses and the existing continuation route blocks on address completion.

### 5. Concierge first RFQ (30–45 minutes)

Treat the first RFQ as a package-quality review. The customer owns the requirements; Lattice helps ensure they are represented before supplier outreach.

Check that each line item has its CAD file, drawing when required, material/specification, quantity, finish/tolerances, due date, packaging/inspection requests, and clear notes. Capture missing information through the in-app `Request information` path with a customer-facing note rather than letting ambiguity travel to suppliers.

Set a published internal service level for this cohort, for example: acknowledge a complete RFQ within one business day; identify missing information within one business day; provide a quote timing update within two business days even if supplier pricing is not ready. Use targets only after confirming they are operationally sustainable.

### 6. Quote, order, and delivery loop

For every first job:

- Explain the quote, scope assumptions, lead time, shipping, quality-document requirements, and expiry on a brief review call or message.
- If the customer buys, use the selected structured supplier quote and issue the supplier PO only after the final package is locked.
- Publish customer-visible order updates from the admin order detail at each meaningful milestone; include the next milestone, target date, responsible party, and a plain-language update. Do not leave the dashboard to imply automated tracking.
- Attach requested inspection/material documentation for customer review before shipment and proactively flag any variance or delay.
- At delivery, confirm receipt and capture a 10-minute debrief: what was easy, what was unclear, what took too long, whether they would route the next similar job through Lattice, and the next job signal.

## Cadence for two waves

| Time | Action | Exit signal |
| --- | --- | --- |
| Week 0 | Select five prospects; complete conflict and release gates | Five qualified prospects, no unresolved access/storage risk |
| Weeks 1–2 | Discovery calls and assisted activation | At least three activated companies with a dated first-RFQ plan |
| Weeks 2–4 | Concierge first RFQs; daily operator review | First RFQs submitted and package gaps categorized |
| Weeks 4–6 | Quote/order support; weekly cohort review | Repeatable quote path and clear top friction points |
| Week 6 | Decide whether wave one is stable | Continue, pause to fix a systemic issue, or invite wave two |
| Weeks 7–12 | Onboard next five using the revised playbook | Ten companies; evidence of repeated use or well-understood non-fit |

Hold a 30-minute internal review each week. Review every active company, RFQ age, missing-information reason, quote turnaround, open customer promise, quality/document status, and product friction. Turn only repeated, material friction into product work; solve one-off issues with service first.

## Cohort scorecard

Track the funnel and service reliability, not just signed-up accounts.

| Measure | Definition | Early target / decision use |
| --- | --- | --- |
| Qualified → activated | Invited shops that complete first login and company defaults | Diagnose outreach and activation clarity |
| Activated → first RFQ | Activated companies submitting a real RFQ within 30 days | Primary activation metric |
| Complete-first-pass rate | RFQs not needing a material clarification before supplier outreach | Measures intake/package design |
| RFQ acknowledgement time | Submission to Lattice acknowledgement | Measures operator reliability |
| Quote-cycle time | Complete RFQ to customer quote issued | Measures supplier/operations bottleneck |
| Quote → order | Issued quotes that become a placed order | Contextual; never optimize by overpromising |
| On-time / documentation complete | Orders meeting committed milestone and requested evidence requirements | Core trust metric |
| Repeat intent | Customer says they would send the next similar job through Lattice | Best early product-market signal |

Use a simple red/yellow/green status for each company: **green** has an active job or next-job date; **yellow** has a clear blocker and owner; **red** has no response, a trust issue, or a release-gate concern. Do not call dormant provisioned accounts “onboarded.”

## Lightweight communication templates

**Warm introduction**

> I’m building Lattice OS independently: a managed way for machine shops to cover overflow or work outside their current capability without simply no-quoting it. I’m inviting a very small group of shops I know well to try it with a real, bounded job. I’d value 20 minutes to understand where you lose work today and see whether there is a good fit—no obligation to submit an RFQ or place an order.

**Post-call follow-up**

> Thanks for walking me through [pain/job]. The first use case we discussed is [short description]. If you are comfortable proceeding, I’ll set up [name] as your Lattice account administrator, then we can submit the first package together on [date]. For this early cohort, I’ll personally validate the package and keep you updated on the quote and production path.

**First-RFQ checklist note**

> For each part, please have the CAD model, drawing if applicable, material/specification, quantity, finish/tolerance requirements, target date, and any inspection or material-document requests. If anything is unknown, send what you have; we will identify the gap before supplier outreach rather than make assumptions.

## Decisions to make before outreach

1. The exact eligibility boundary for Amogy-adjacent contacts after an agreement/policy review.
2. Whether the cohort is free, discounted, or standard commercial pricing—and which services, shipping, and issue-resolution terms apply.
3. The sustainable response-time commitment and the named operator backup.
4. Whether production release gates are complete. If not, define a manual pilot path that excludes production customer data from Lattice.
5. The explicit wave-one success threshold for inviting wave two (recommended: at least three activated companies, two real RFQs, no unresolved privacy/data-storage issue, and a repeatable operator response process).
