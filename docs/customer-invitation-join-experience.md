# Customer Invitation and Join Experience

> Updated direction, 2026-10-08: the customer introduction should end after a brief optional contextual tour of the real workspace. The researched screen-by-screen proposal, exact tour copy, motion specifications, evidence limits, and feature tradeoffs are in [Customer onboarding research and design](customer-onboarding-research-and-design.md). That proposal supersedes the earlier dashboard-only handoff below. No application behavior has changed. Established company details remain operator-managed; the initial address-completion permission must not be presented as unrestricted customer editing.

## Goal

Make a customer feel that Lattice is organized, credible, and ready to help from the moment their invitation arrives through the first visit to their workspace. The current first cohort is operator-led: a Lattice Admin provisions the company and its first Customer Admin, and the customer joins by invitation. This is not public self-registration.

## Experience principles

- **Personal and specific:** name the recipient and company, and explain why their workspace is ready.
- **Clear about the next step:** tell the customer what to do, what information to have ready, and what happens after sign-in.
- **Quietly confident:** use concise language, generous spacing, clear headings, and one primary action per screen. Avoid marketing claims, urgency, and unexplained jargon.
- **Respectful of their time:** request only the information needed to activate access and complete shared company defaults. Explain why an address is requested.
- **Trustworthy at every state:** show progress, preserve entered values after recoverable errors, and give a real support path when the customer cannot proceed.
- **Consistent:** carry the same Lattice identity, labels, and tone from email through login, password setup, address confirmation, and workspace.

## Recommended customer journey

| Stage | Customer experience | Product behavior |
| --- | --- | --- |
| Invitation received | A short, named welcome identifies the company workspace, explains Lattice's managed overflow-capacity service, and offers one `Get started with Lattice` action. The attached “How Lattice works” guide is introduced as optional context. | Continue using the approved branded email and PDF attachment. For a newly created identity, clearly label the temporary password and its 72-hour expiry. For an existing verified identity, say to use their established sign-in method and do not imply a password was issued. |
| Sign-in | The recipient lands on the Lattice sign-in page with their invited email prefilled when safely available. The page explains invite-only access and links to support. | Keep sign-in routed through the Lattice `/login` experience. Preserve the intended post-login continuation to `/account/continue`. |
| Password setup | A focused page welcomes the customer by name, explains that this is a one-time setup step, and asks for a personal password and confirmation. Provide password requirements before submission. | Keep the mandatory setup before any workspace shell or customer data renders. Show clear success, mismatch, expired temporary password, ended session, and service-error states. Never expose an existing password. |
| Company details | A short progress indicator frames the task as company setup. Ask the Customer Admin to review shipping, then billing details, explaining that these defaults are shared with authorized company users and can be changed later. | Preserve existing values, seed blank billing fields from shipping for review, validate required fields, and save to the shared Company record. Keep the current Customer Admin-only durable deferral behavior, but make the `Finish later` consequence explicit. |
| Workspace handoff | A completion screen confirms access is ready, names the company, and offers a single `Go to dashboard` action. A concise next-step card points to `Create an RFQ` and says Lattice will review the package and prepare a supplier-backed quote. | Route to the role-specific home after required setup. Do not present empty RFQ/order states as an error; explain that the workspace is ready for the first request. |
| First use | Dashboard orientation highlights the next useful action and how to get help. The customer can return to account settings to update shared addresses. | Keep ongoing support and onboarding help visible in the customer workspace, with no dependency on a scheduled call. |

## Copy direction

Use direct, plain language. Example copy for the join steps:

- **Email subject:** `You’re invited to Lattice`
- **Email lead:** “Welcome to Lattice, [First name]. Your [Company] workspace is ready.”
- **Password setup heading:** “Set your Lattice password”
- **Password setup explanation:** “This one-time step secures your account. Choose a personal password to continue to your workspace.”
- **Address step heading:** “Confirm your company details”
- **Address explanation:** “These shipping and billing details are shared defaults for your company. You can update them later in Account Settings.”
- **Completion heading:** “Your workspace is ready”
- **Completion explanation:** “When you’re ready, submit an RFQ and our team will review the package and prepare a supplier-backed quote.”

Avoid suggesting that the customer creates a quote, that Lattice has already reviewed a job that has not been submitted, or that pricing, lead time, or capacity is guaranteed. Keep the invitation and setup screens focused on account access; the attached guide carries the longer product explanation.

## Visual and interaction direction

- Use the existing public Lattice identity and typography, with a restrained graphite and cobalt palette and a light, neutral canvas.
- Keep login and initial password setup outside the authenticated workspace shell, consistent with current auth security behavior.
- Use a narrow readable content column, a clear page title, short explanatory copy, and one prominent action. Keep secondary actions visibly secondary.
- On setup steps, show a small progress label such as `Secure your account` and `Company details`; avoid a long multi-step wizard impression.
- Use persistent field labels, accessible error text beside the affected field, visible keyboard focus, and announced save/status feedback.
- Make recovery links and support contact easy to find without competing with the primary action.
- On small screens, keep the primary action visible after the form and avoid side-by-side address fields that become cramped.

## Edge cases the experience must handle

- Invitation delivered to an address that already has a verified Clerk identity: explain that the recipient should use their established sign-in method.
- Temporary password expired or replaced by a resend: explain that the invitation credential is no longer valid and direct the customer to contact Lattice for a fresh invitation.
- Customer signs in without a provisioned Lattice membership: explain that access is invitation-only and provide a support route without revealing whether another account exists.
- Customer closes the browser or loses the session during setup: allow a fresh sign-in and resume from the first incomplete required step.
- Address save fails: retain entered values, identify the failure, and provide a retry path. Do not claim the company details were saved.
- Address task deferred: confirm that access is available and state where the Customer Admin can complete the shared details later.
- Customer has no RFQs yet: show a purposeful first-request call to action and brief description rather than empty metrics alone.

## Delivery plan

### 1. Polish the existing first-cohort flow

Keep the current operator-provisioned invitation and temporary-password model. Improve consistency and orientation across the email, sign-in page, password setup, address step, and dashboard handoff. Ensure the existing-vs-new identity distinction stays accurate in the email and recovery guidance. This is the smallest path to a professional first customer experience.

### 2. Validate the complete journey in a controlled environment

Use an approved test recipient and non-customer test company. Verify invitation delivery and PDF receipt, first sign-in, forced password setup without losing the Clerk session, address saves and deferral, reset/resend behavior, rejection of the prior temporary password, and recovery states. Confirm the workspace is company-scoped and contains no other company's records. Record screenshots and outcomes for the release checklist.

### 3. Replace temporary passwords with account activation

For a hardened follow-on, replace the password-bearing email with a single-use, expiring activation link that verifies the recipient and lets them choose their password. Add explicit expiration, resend, and revoke states, and retain safe delivery audit events without storing secrets or email bodies. This removes a credential from the email while preserving the operator-led cohort model.

### 4. Expand onboarding only after the first cohort

Use customer feedback to decide whether to add a scheduling link, provider-backed address autocomplete, a review of operator-prefilled company details, or Customer Admin teammate invitations. Do not add these steps before they solve a demonstrated point of confusion or delay.

## Definition of done

- A customer can understand why they were invited and the one action to take from the email.
- A first-time customer can sign in, set a personal password, confirm or defer company details, and reach the correct workspace without operator intervention for normal cases.
- Existing verified identities receive accurate sign-in guidance and retain their current credential until required setup is complete.
- Errors and expired credentials have clear recovery instructions and do not discard form entries unnecessarily.
- The first empty dashboard state explains how to submit the first RFQ and how Lattice responds.
- Keyboard and mobile use remain clear, and all steps use consistent Lattice voice and visual treatment.
- Controlled end-to-end delivery, access-scope, recovery, and address checks pass before using the flow with a real customer.

## Current implementation references

- `docs/first-customer-onboarding-playbook.md` — cohort operating process and current invitation policy.
- `src/lib/customer-invitation-email.ts` and `src/lib/customer-invitation-delivery.ts` — invitation composition and delivery.
- `/login`, `/account/continue`, `/account/set-password`, and the account address onboarding in `/account/settings` — current account join path.
- `docs/app-feature-map.md` — operator-facing route and behavior map.
