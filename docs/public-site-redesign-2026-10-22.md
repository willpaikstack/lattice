# Public-site redesign — October 22, 2026

## Brief and design

William requested an invite-only public site for domestic machine shops and small manufacturing companies. Book a call is primary; Request access remains secondary. Homepage and its related public destinations should share a coherent design. He chose a call-request form rather than an external scheduling service.

The direction is “Take on the work. Keep your floor focused.” Warm whites, graphite, a muted olive headline and a brighter green action color support large typography, clear sections, real manufacturing context and a practical shop-oriented narrative. Existing Lattice logo and manufacturing images are reused. No invented customer logos, testimonials, statistics, certifications or guaranteed tolerances are added.

References: [Protolabs](https://www.protolabs.com/) and [Protolabs Network / Hubs](https://www.hubs.com/), reviewed for clear process and capability communication. Design and copy are specific to Lattice’s domestic-shop/managed-overseas-capacity proposition.

## Implemented scope

- `/`: invitation status, call CTA, shop scenarios, milling/turning/sheet-metal overview, requested quality documentation, workflow, native keyboard-accessible FAQ and closing CTA.
- `/book-a-call`: name/company/email/needs, optional phone and preferred times/time zone; pending button, bounded server validation, honeypot, safe save errors, retained form fields and honest scheduling-pending receipt.
- `/waiting-list`: matching design; existing submission action, confirmation and duplicate states retained.
- `/how-it-works`: new guest marketing content; signed-in users keep their existing resource page.
- `/login` and nested challenges, `/forgot-password`, `/reset-password`: shared public layout; original Clerk and recovery actions retained.

The site uses `src/components/public-marketing.tsx`, `public-marketing.module.css`, `public-site-header.tsx`, `public-how-it-works.tsx` and `call-request-form.tsx`. The homepage and call page remain statically prerenderable. No application-wide CSS, protected manufacturing workflow, schema or dependency changes.

## Call-request handling

Browser → `requestCallAction` → `saveCallRequest` → existing `createWaitingListEntry` → Prisma `WaitingListEntry`, visible in `/admin/customers` → Waiting list.

`procurementNeeds` begins with CALL REQUEST and includes optional phone/preferred times, followed by the manufacturing needs. Call requests are saved even when an existing email/domain has requested access. The database is required outside development; development retains the existing disk fallback. No new email or calendar operation is performed. The operator checks the queue and arranges a time by email. This is a request to talk, not a scheduled appointment or approved account.

## Verification

- Full suite: 818 passed, one existing opt-in database audit skipped.
- TypeScript, full ESLint and diff whitespace checks pass.
- Optimized production build passes on retry; first run stopped after compilation at the existing Next.js security advisory reminder. No migration/bootstrap flags were enabled.
- Runtime dependency audit identifies existing critical Next.js advisories (16.4.0), with an available fix. Upgrade before release; no dependency upgrade was performed in this design task.
- In-app browser: desktop homepage/call form, 390px homepage/call/guest workflow/access layouts, public navigation and FAQ tested. No horizontal overflow on inspected phone layouts.
- Guest login shell inspected on 127.0.0.1; Clerk did not finish loading there. The existing localhost browser was already authenticated and correctly redirected to its workspace. No login credentials, identity settings or sessions changed.
- Call validation, queue payload, storage failure, UI retry/value preservation and saved-receipt behavior covered by automated tests with isolated mocks. No genuine database call submission, outgoing email, or customer data mutation performed. Hosted persistence/provider behavior is not certified by these checks.

## Handoff

Branch: `codex/public-site-redesign`, based on main `d008329`. Review locally at http://localhost:3000/. Production has not been changed. Before publication, review design/copy, resolve existing framework advisories and verify one controlled hosted call request reaches the admin queue. Consider an operator notification or calendar integration separately if needed.
