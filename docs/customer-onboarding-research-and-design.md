# Lattice customer welcome and guided tour

Research and design proposal · 2026-10-08 · Proposed, not implemented

## Recommendation

Create a personal welcome followed by an optional four-stop tour of the real workspace. Aim for 45–60 seconds from welcome to tour completion, excluding authentication and optional address entry. Treat that duration as a prototype hypothesis to validate with customers.

Sequence: invitation → account access → optional company details → welcome over the dashboard → Request Quote → Quotes → Orders → Help → normal dashboard.

The welcome is one composed moment. The four tour stops explain the manufacturing workflow through its actual controls. Completion and skipping both end the introduction. An RFQ submission remains a separate customer choice.

## Evidence and its limits

Reviewed Hark's public entry visually in a browser, its public product guide, Linear's public demo visually in a browser and invitation/start documentation, Slack's joining and quick-start documentation, and Superhuman's getting-started documentation. This is a directional design study, not a measured comparison of conversion rates. Signed-in first-account sequences for these products were not reproduced. Hark's exact introductory screen sequence and motion timing remain unverified; William's positive account of its pacing, transitions, animation, and colors is the creative brief.

| Reference | Verified evidence | Interpretation for Lattice | Limits |
| --- | --- | --- | --- |
| [Hark public entry](https://hark.com/) and [Using Hark](https://hark.com/using-hark) | Public entry has a soft blue atmospheric background, a large visual panel, short centered copy, and dark rounded sign-in actions. Its guide describes the background as a realtime sky simulation and explains Home, Chat, and Projects. | Use atmosphere and spacing to create a considered arrival. Explain a small mental map before detailed features. A soft blue tint can support Lattice's existing warm neutrals. | Public entry is not the downloaded app's onboarding. No claim about its private welcome screens, exact colors, easing, or completion rate. |
| [Linear invitations](https://linear.app/docs/invite-members), [start guide](https://linear.app/docs/start-guide), and [public demo](https://linear.app/demo) | Invitations identify the workspace joining path. The start guide offers a demo, live onboarding, and role-specific learning. The inspected demo has restrained neutral surfaces, a persistent sidebar, a Welcome document in Favorites, and a compact contextual notice in the main pane. | Keep orientation attached to the working interface; retain help after the introduction. Strong hierarchy and sparse accents suit a professional tool. | Demo content is populated and does not establish the actual first-account tour. Its current default view was Agent; Lattice should orient around the manufacturing workflow. |
| [Slack joining](https://slack.com/help/articles/212675257-Join-a-Slack-workspace) and [quick start](https://slack.com/help/articles/360059928654-How-to-use-Slack--your-quick-start-guide) | The invitation acceptance instructions are short and workspace-specific. The quick-start guide explains navigation and identifies a persistent help location. It includes embedded learning media. | Make the company destination unmistakable and let later learning remain available through Help. | Documentation verifies steps and information hierarchy, not current in-app animations or tour behavior. |
| [Superhuman getting started](https://help.superhuman.com/hc/en-us/articles/46005793127181-Get-Started-with-Superhuman-Mail) | The guide sets a 15-minute expectation, lists core workflows, and links an on-demand walkthrough. | State the time commitment up front and teach useful workflows in a deliberate order. Offer deeper assistance separately. | Fifteen minutes exceeds Lattice's desired scope. The linked Loom could not load in this research session; its motion and screens were not inspected. |

Reference media: [Hark introduction video](https://www.youtube.com/watch?v=0PSV7e1KawA), [Linear interactive demo](https://linear.app/demo), and [Superhuman walkthrough](https://www.loom.com/share/ec6b9971c73f465096b3c33cdc013176). These are source links, not recordings of Lattice or proof of first-account behavior. Hark and Linear public screens were visually inspected; no inaccessible video content is used as evidence.

The shared lesson is focus: a short promise, recognizable destination, and a manageable explanation of the core workflow. The exact design below is a Lattice recommendation, not a copied or experimentally proven sequence.

## Why an anchored tour

| Approach | Benefit | Cost | Decision |
| --- | --- | --- | --- |
| Four anchored explanations | Connects the workflow to controls the customer will use; gives the welcome a clear ending | Interrupts exploration and depends on stable navigation targets | Recommended, with explicit Start and Skip choices |
| Contextual hints on first feature use | Relevant at the moment of need | Learning is fragmented and may never introduce orders or support | Consider later inside complex RFQ forms |
| Persistent welcome checklist | Supports setup tasks spread over days | Can make an empty workspace feel unfinished and mixes orientation with actual work | Use only a quiet address reminder when needed |
| Full interactive task tutorial | More practice and potentially better recall | Longer; requires sample data and careful separation from real submissions | Defer until evidence shows customers need it |

NN/g's [mobile tutorial study](https://www.nngroup.com/articles/mobile-tutorials/) found no statistically significant task-time improvement in the studied comparison and cautions about tutorial burden. It does not prove that all tours fail or that Lattice's tour will work. Our rationale for a short optional tour is the customer's need for orientation and William's desired experience; validate understanding directly.

## Current product constraints and assumptions

- Source inspection confirms customer navigation is Home, Quotes, Orders, and manufacturing resources; the primary action is **Request Quote**. Use those exact labels in the tour. Quotes covers RFQ/quote tracking; there is no separate top-level RFQs entry to highlight.
- Customer surfaces currently use warm neutral backgrounds and Geist. The graphite sidebar theme belongs to the admin workspace. This proposal keeps customer context recognizable.
- There is no general Help entry in the inspected shell. Add a Help button above the account control containing Contact Lattice, How it works, and Replay introduction. The existing support address is `support@latticeos.co`; a mail link must also show a copyable address for users without a mail app.
- Newly provisioned identities currently use a 72-hour temporary password; existing verified identities use their established sign-in method. Both currently pass through mandatory personal-password setup. Keep copy accurate for each branch.
- Only eligible Customer Admins complete or defer initial shared address setup. Customer Members bypass that task. Established company defaults remain operator-managed; do not promise unrestricted customer editing.
- Tour progress is personal to the user and company membership. Shared address state stays company-scoped. One teammate completing the tour must not suppress it for another.
- Assumed primary use is desktop; mobile joining still needs a coherent experience. Target customers may join before they have a job to submit.

## Screen-by-screen experience

| Screen | Layout and exact proposed copy | Actions | Transition and rules |
| --- | --- | --- | --- |
| 1. Invitation | Existing branded email and approved PDF. Lead: **“Welcome to Lattice, [First name].”** Body: **“Your [Company] workspace is ready. Submit manufacturing requests, review quotes, and follow your orders in one place.”** | **Get started with Lattice** | Keep attachment optional. New-identity credential block says **“Temporary password · valid for 72 hours.”** Existing-identity copy says **“Sign in using the method already associated with [email].”** |
| 2. Account access | Narrow 440px form area, official logo, quiet neutral background. **“Sign in to Lattice”** / **“Use the email address that received your invitation.”** | **Continue** and existing auth actions; **Contact Lattice** | Preserve the authenticated continuation. Do not display private company information based only on an untrusted URL parameter. Never place a temporary password in a URL. |
| 3. Personal password | Same form frame. **“Make this account yours.”** / **“Choose a personal password for your Lattice account.”** Persistent field labels, show-password control, requirements beside the form. | **Save and continue** | Show saving state immediately. Continue only after confirmed success. Existing identity copy avoids referring to an issued temporary password. No workspace data renders before required setup succeeds. |
| 4. Optional company details | **“Set your company’s delivery details”** / **“Add shared shipping and billing defaults now, or finish this later.”** Two short steps: Shipping, Billing. | **Save and continue**, **Back**, **Finish later** | Preserve existing fields and review copied billing values. Eligible Customer Admins only. A saved shared deferral allows entry; Members do not see the prompt. Explain that corrections to established details go through Lattice. |
| 5. Welcome | Dashboard visible behind a light veil. Centered card, max 520px. Company eyebrow; **“Welcome to Lattice, [First name].”** / **“Your workspace is ready. Here’s where to request a quote, follow your work, and reach our team.”** / **“Four quick stops. About a minute.”** | **Show me around**, **Skip introduction** | A single 320ms entrance. Begin only when the shell and first target are ready. No artificial loading or compulsory countdown. |
| 6. Tour | One anchored card at a time, four steps specified below. Show **“1 of 4”** and so on. | **Next**, **Back**, **Skip tour**; last action **Finish tour** | User controls pacing. Remain on the dashboard; visually highlight real navigation controls without triggering their actions. |
| 7. Handoff | Remove overlay; quiet status: **“You’re ready. Replay the introduction anytime from Help.”** Dashboard empty state: **“Your next manufacturing request starts here.”** / **“When you have a job ready, use Request Quote to send the files and requirements. Lattice will review your request and prepare a quote.”** | Existing **Request Quote** action | No extra completion dialog. On skip, say **“Introduction skipped. You can replay it from Help.”** Return focus to the welcome launcher or dashboard heading. |

Suggested recovery copy: expired invitation — **“This invitation needs to be refreshed. Contact Lattice and we’ll help you get access.”** Session ended — **“Sign in again to continue setting up your account.”** Address save failed — **“We couldn’t save these details. Your entries are still here. Please try again.”** Use these only for confirmed states; ordinary login errors must not disclose account existence.

## Four-stop tour storyboard

Desktop: card sits to the right of the left sidebar target, with 16px gap and viewport collision handling. Card width 320px, max 360px, 20–24px padding. Keep the target label visible and put the step number above a short heading. Each stop takes approximately 8–12 seconds at a natural reading pace; welcome/finish add approximately 10 seconds. Never auto-advance.

| Stop | Actual highlighted element | Exact heading and body | Advancement |
| --- | --- | --- | --- |
| 1 | **Request Quote**, linking to `/requests/new` | **“Start with your manufacturing request”** / **“Add CAD files, quantities, and requirements here. Lattice reviews your RFQ and prepares a quote for you.”** | Next focuses Quotes; the customer does not open or submit a request during orientation. |
| 2 | **Quotes**, linking to `/quotes` | **“Follow requests and review quotes”** / **“Find your submitted RFQs and the quotes Lattice prepares here. Open a record to review its details and next steps.”** | Next focuses Orders; Back returns to Request Quote. |
| 3 | **Orders**, linking to `/orders` | **“Keep track of work in progress”** / **“Once an order is placed, follow its production updates, documents, and shipping details here.”** | Next focuses Help. Avoid implying live carrier tracking or enabled in-app payment. |
| 4 | Proposed **Help** button above the account control | **“Reach the Lattice team”** / **“Contact us when you need a hand. You can also revisit how Lattice works or replay this introduction here.”** | Finish tour dismisses guidance and saves completion. No email or support request is sent. |

Highlighted controls are visual references during the modal tour; only the tour's controls are interactive. This creates a predictable short sequence and prevents accidentally opening an RFQ form. A later “click the highlighted control” variant could teach navigation more actively, but would require route transitions, backtracking, and error recovery. Prototype both only if customers fail to locate controls after this shorter version.

The empty workspace requires no sample customer records. Targets exist in the shell whether or not any RFQs/orders exist. Keep genuine empty states and future-tense copy. Resources such as materials and equipment remain available for voluntary exploration after the tour.

## Visual and motion specification

These values are proposed prototype settings, not measurements of Hark or claims of optimal performance.

| Element | Specification |
| --- | --- |
| Canvas | Existing customer ivory `#F8F7F4`; panels white; primary ink `#171717`; body copy `#484848`. |
| Accent | Trial cobalt `#3659C9` for progress and focus emphasis; pale blue `#EAF0F8` as a small welcome wash. Graphite primary buttons maintain invitation continuity. Confirm contrast in the prototype. |
| Atmosphere | One soft static blue-to-ivory wash behind the welcome mark; solid white behind text. Retain the official Lattice identity. |
| Typography | Existing Geist; welcome heading 30–32px/1.15, card heading 18px/1.3, body 15–16px/1.5, step label 12px. Keep sentence case. |
| Geometry | Welcome radius 20px; tour radius 14px; 1px warm gray border; restrained shadow. Controls at least 44px high. |
| Setup steps | Fade outgoing content for 180ms, then reveal incoming content over 380ms with a 6px upward settle and `cubic-bezier(0.22, 1, 0.36, 1)`. Keep branding, story panel, form frame, and support footer mounted between form steps, including Shipping → Billing. |
| Welcome entrance | Wait for the embedded workspace document and fonts to be ready, then reveal the workspace and welcome together under one 500ms opacity animation. Clip the welcome artwork through the card’s single rounded outline; do not layer independently rounded header corners. |
| Tour changes | Fade outgoing card for 150ms; re-anchor; reveal the incoming bubble over 300ms with a 4px upward settle. Crossfade highlights over 300ms. Keep the actual workspace mounted and visible; do not animate a bubble across the screen. |
| Highlight | 2px accent outline and 6px outer space around target; a subtle veil at roughly 18% ink. No pulsing or looping motion. |
| Finish | Fade the welcome/tour overlay out over 350ms, revealing the same workspace underneath without another screen. |
| Reduced motion | Use immediate opacity/state changes with no transforms or animated scrolling. Exit durations also become zero, so animation does not delay navigation. |

The visual priority is stable text, deliberate whitespace, and timely response to input. Waiting time must reflect actual work rather than an aesthetic delay.

## Behavior and accessibility

- **Skip:** visible on welcome and every tour card, no confirmation or guilt language. Explicit skip ends onboarding and suppresses automatic reopening.
- **Replay:** Help → Replay introduction starts step 1. Replaying does not reset password or company setup and is tracked separately from first-time completion.
- **Returning visits:** completed/skipped users enter normally. A version change should not automatically replay a full tour.
- **Interruption:** persist the last step. On return, show a quiet **“Continue introduction · 2 of 4”** prompt with Continue and Dismiss; never unexpectedly place an overlay over ongoing work.
- **Persistence:** server-backed per-user/per-company status: not started, in progress, completed, skipped; version, last step, and timestamps. Browser storage may cache UI state but cannot be the shared source of truth. A failed progress save must not block workspace use.
- **Mobile:** when navigation is collapsed, reveal the real navigation panel as part of the tour. Use a bottom explanation card with the active target scrolled into the visible space above it. The last step closes the panel. At high zoom or very short heights, switch to a scrollable dialog with a clearly named target and location rather than hiding controls under a bubble.
- **Keyboard and screen readers:** treat the tour as a modal dialog, not an ARIA tooltip containing buttons. Keep the background inert; Tab stays within tour controls, Escape skips/closes, headings announce the target and step. Restore focus on exit. The highlighted element is visual context and its label/location are repeated in dialog text. Follow the [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- **Motion preferences:** respect reduced motion, consistent with [W3C guidance on interaction animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). That specific criterion is AAA; honoring it alone does not establish overall accessibility conformance.
- **Layout resilience:** anchor by stable element identity, not sidebar position; the current sidebar supports reordering. Recalculate on viewport changes. If a target is missing, show its text explanation in a centered card and allow Next/Skip. Do not strand the customer.
- **Role safety:** customer-only onboarding; do not trigger it during a Lattice operator's support session or alter the customer's progress from that session.

## Feature tradeoffs and implementation order

Effort is relative, not a schedule estimate. Validate auth-provider support before estimating activation work.

| Change | Customer benefit | Friction/cost | Operational implications | Scope |
| --- | --- | --- | --- | --- |
| Welcome plus four-stop tour | Coherent arrival and clear workspace map | One optional decision and about a minute; medium UI/accessibility effort | Stable targets and durable progress need maintenance | First release |
| Help and replay | A permanent recovery route and an endpoint for the tour | Small navigation footprint; low–medium effort | Route to staffed support email; no implied live-chat response promise | First release |
| Unified copy and motion | Consistency from email to dashboard | Low–medium effort; provider-owned auth screens may constrain styling | Keep new/existing identity variants accurate | First release |
| Optional address step | Company defaults available without preventing exploration | Forms lengthen setup for those who choose them | Preserve current permissions; identify downstream address requirements | Polish existing behavior |
| Expiring single-use activation link | Removes temporary-password transcription and a redundant sign-in step for new identities | High auth/recovery effort; expired/forwarded links still need handling | Requires resend/revoke, identity linking, safe audit, mail-scanner-safe consumption and migration behavior | Follow-on after provider design review |
| Move addresses to first relevant transaction | Shorter initial join | Interrupts later RFQ or ordering task | Must establish exactly which quote/ship-to workflows need them first | Evaluate after cohort feedback |
| Sample RFQ walkthrough | Demonstrates richer detail in an empty account | Longer tour; sample/real distinction and cleanup complexity | Must isolate synthetic data from company records | Defer |
| Animated atmospheric background | More distinctive brand expression | Rendering, distraction, contrast, and motion costs | More device coverage and maintenance | Static wash first |

The ideal future activation path is invitation → verify invited identity and establish appropriate authentication → welcome/tour. Existing verified identities should retain their established method where the identity policy permits. This is a proposed policy/auth change; the current mandatory password flow remains the baseline until that work is designed and implemented.

Prototype first: desktop welcome, all four steps, completion/skip, mobile navigation treatment, expired invitation, and one interrupted/resume state. Then integrate the approved design with current auth and address behavior. Validate invitation delivery, password handoff, and company-scoped access as well as the presentation before customer rollout.

## Success measures

For the first ten customers, report raw counts with denominators and short interview notes; the cohort is too small for strong conversion claims or useful A/B conclusions.

| Question | Measure and definition | Initial acceptance hypothesis |
| --- | --- | --- |
| Can invited users enter? | Required setup completed / invitations confirmed delivered, within 7 days; separate new and existing identities | Every controlled test succeeds; investigate every real activation block |
| Is the tour brief? | Active foreground time from Start tour to Finish, excluding interruptions | Typical 45–60 seconds including welcome; watch for repeated steps or >90 seconds |
| Is skipping respected? | Skip count / welcome exposures and skip count / tour starts | No forced reopening; a high skip rate is a discovery signal, not automatically a failure |
| Do customers understand the map? | After onboarding, ask them to point to starting an RFQ, finding a quote, locating an order, and getting help without submitting anything | At least 4 of the first 5 participants identify all four without coaching; provisional design target |
| Can they recover? | Expired-invite, interrupted setup, progress-save, and support cases with resolution notes | No dead ends; entered non-secret form data retained on recoverable failures |
| Does support burden improve? | Access/navigation assistance cases per activated customer during the first week | Establish a baseline; reduce repeated confusion in the next cohort |

Proposed events: invitation delivered (only when delivery is confirmed, otherwise label sent), required setup completed, welcome shown, tour started, step viewed, tour completed, tour skipped, tour resumed, tour replayed, help opened. Use opaque identifiers and coarse device class; exclude credentials, tokens, form contents, CAD metadata, and email bodies. Completion and skip are distinct terminal outcomes. Count RFQ submission separately as later product use, never as onboarding completion.

## Open validation questions

Can customers find Quotes after the tour without help? Does “Request Quote” clearly communicate that they are submitting an RFQ? Do optional addresses distract from the arrival? Does the welcome still feel refined on an ordinary shop laptop? These questions should determine the next iteration before adding more steps.
