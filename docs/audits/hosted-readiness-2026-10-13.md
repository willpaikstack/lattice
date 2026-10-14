# Lattice OS hosted readiness report

Update October 14: the six confirmed P1 findings F4–F7/R1–R2 were repaired, hosted retested and released; see [P1 verification](p1-remediation-2026-10-14.md). P0 native browser retests are also complete. Findings below preserve the original assessment; P2 and operational/commercial gates remain open.

Update: the three P0 defects below were subsequently fixed and released in application patch `db347a6`. See [P0 remediation and retest](p0-remediation-2026-10-13.md) for passing hosted evidence and the locked-Mac browser-verification limitation. This document retains the original findings; its P1/P2 items remain outstanding.

Assessment: October 13, 2026, America/New_York. Later evidence timestamps are October 14 UTC. Scope: the deployed customer/admin workflow, development Neon, private test R2, Autodesk Platform Services (APS), and Stripe Test mode.

## Decision

**Not ready to roll out as a completed app.** The normal customer upload path fails, and authenticated customers can obtain another company's administrative data and translated CAD derivatives. These are release blockers even for an assisted RFQ-only launch. Purchasing also needs genuine provider webhook delivery, the remaining payment/fulfillment tests, and approved operating procedures before Live checkout is enabled.

Several important hosted segments work: real development authentication, database submission, quotation, private original-file downloads, APS translation, Stripe Test checkout/tax/payment, authenticated payment-event reconciliation, invoice download, and partial/full refund reconciliation. They do not establish a clean end-to-end pass: downstream tests required explicitly prepared storage metadata, and Stripe events were replayed through authenticated Preview access.

This is the inventory of confirmed defects, source-observed gaps, and unverified launch gates found in this assessment. It is not a claim that every possible defect has been discovered. Older local/production proofs remain useful but do not replace verification of this exact hosted release.

## Tested release and isolation

| Item | Configuration / evidence |
| --- | --- |
| Application source | Release application commit `71b21df`; audit branch began at `9a8690d`. No application fixes were applied during this audit. |
| Git branch | `codex/hosted-readiness-2026-10-13` |
| Vercel Preview | `dpl_2gXESm84dTeJVYz7BLjgypqQDzmD`, Ready; Node 24, Next.js 16.2.6. |
| Test URL | https://lattice-hosted-test.vercel.app — protected Preview, not public production. |
| Database | Existing separate development Neon database; its host differs from Production. Synthetic companies/users/RFQs only were mutated. |
| Authentication | Clerk Development; actual synthetic Customer Admin, Customer Member, second-company Customer Admin, and Lattice Admin identities. Browser sign-in used Clerk's documented test-email/OTP path. |
| File storage | New private `lattice-preview-test` R2 bucket; exact Preview-origin CORS. Scoped object read/write credential expires October 20, 2026. Test-bucket access succeeded; production-bucket access returned Access Denied. |
| APS | Existing APS application, separate `lattice-hosted-preview-test-20261013` translation bucket. |
| Payments | Existing merchant's shared Stripe Test mode, verified `livemode=false`; Preview checkout enabled, inline checkout disabled. No Live charge. |
| Email | Preview Resend key deliberately blank, preventing customer/support delivery. Delivery/inbox receipt is not certified. |
| Access for HTTP tests | Short-lived, same-project Vercel development OIDC header plus fresh Clerk session tokens. App authorization remained active. |
| Fixtures | Valid synthetic large STEP (6,482,251 bytes), small STEP (2,246 bytes), two-page PDF (5,245,427 bytes), two-part quote, NY address, optional PO reference. |
| Production | Earlier Git/Vercel publication is complete. This audit did not change Production configuration or customer records. The tested application code is also the current Production release, so shared code defects require urgent review there. Production exploitation was not attempted. |

The temporary Preview share link used during webhook investigation was revoked. It did not provide direct Stripe webhook ingress. Test credentials, identities, raw HTML, signed URLs, and local captures remain ignored; sanitized evidence is committed beside this report.

## Confirmed failures

Priorities: **P0** blocks customer rollout; **P1** blocks reliable commercial operation or a supported workflow; **P2** needs a defined limitation or follow-up before calling the whole app complete.

### F1 — P0: fresh CAD and drawing uploads cannot complete

The app prepared a direct upload (200), R2 CORS accepted it (204), and signed PUT stored the complete bytes (200). Completion then returned **400: “The file upload is incomplete. Upload the file again before continuing.”** This happened for both STEP sizes and the large PDF.

R2 HEAD showed the correct content length/type but empty object metadata. `prepareDirectUpload` signs `lattice-name` and `lattice-size` as S3 metadata; the returned browser headers contain only Content-Type. The signer hoists metadata into URL query parameters, and the tested R2 PUT did not persist that metadata. `completeDirectUpload` requires the missing expected-size metadata. The wire observations establish the incompatibility; the exact repair must be tested against R2.

**Impact:** customers cannot reliably finish the advertised upload/configure/submit journey. Correct CORS and a successful PUT alone are insufficient. Re-uploading does not fix this failure.

**Required:** transmit and sign the metadata using a verified R2-compatible header contract, or persist expected upload metadata securely on the server. Include any required CORS headers. Re-run normal browser uploads and completion for small/large CAD and drawings without fixture intervention, with size/tampering/ownership checks.

Source: `src/lib/local-file-storage.ts`, `src/app/api/request-draft-files/route.ts`.

**Fixture boundary:** to test later segments independently, the synthetic objects were copied with explicit metadata replacement. Successful completion after that intervention is a prepared-fixture result, not an application fix or normal upload pass.

### F2 — P0: another company can read administrative RFQ/order data in redirects

A second-company customer requested `/admin/quotes` and `/admin/customers`. Responses were **307 to `/dashboard`**, yet their bodies contained company A's synthetic RFQ title, company ID and CAD filename. After purchase, `/admin/orders` and `/admin/orders/[requestId]` also returned redirected bodies containing company A's order data. The quote queue exposure was also reproduced with company A's customer.

**Impact:** hiding the admin screen or redirecting the browser does not protect the returned private data. Some direct detail/PDF paths correctly enforce authorization; that does not protect the leaking list/detail pages.

**Required:** enforce admin authorization before every administrative query and before serializing its result, preferably in the data-access layer. Return minimal authorized data to client components. Audit all admin pages and add tests that inspect raw HTML/RSC response bodies for unauthorized identities, including redirected responses.

Source: `src/app/(workspace)/admin/layout.tsx`, administrative quotes/customers/orders page loaders. The Next.js data-security guide explicitly calls for checks close to data access; a layout guard is insufficient for concurrently evaluated children.

### F3 — P0: APS model access is not bound to company ownership

Using company B's real session and company A's known synthetic model URN:

- Model status returned **200 / ready**.
- Thumbnail returned **200 / image/png**.
- Viewer token endpoint returned **200** with a token.
- That token fetched A's APS manifest directly: **200 / success**, with derivatives present.

**Impact:** private original R2 downloads have working company checks, but translated derivatives do not have equivalent isolation. This test used only a synthetic cube; it did not inspect another real customer's model.

**Required:** bind every status/thumbnail/viewer access to an authorized saved request or draft/model record. A broad shared APS `data:read` token must not allow customers to retrieve unrelated models directly; use provider-supported resource scoping or a server-mediated design that enforces ownership. Verify original files and every derivative independently with two genuine companies.

Source: `src/app/api/cad-previews/{token,status,thumbnail}/route.ts`.

### F4 — P1: submission accepts missing bytes and missing required drawings

The hosted JSON submission API accepted both negative cases as **201**, storing synthetic RFQs:

1. A purported STEP attachment with a positive size but no storage key or uploaded bytes.
2. A two-part package selecting Dimensional Inspection Report, with every drawing omitted.

The UI's drawing requirement is defined in `rfq-options.ts`, but the submission boundary does not enforce it. `assertStoredFileReferences` rejects a missing key only when the supplied size is non-positive; positive claimed bytes can pass without storage.

**Impact:** operators can receive an apparently submitted manufacturing package that cannot be downloaded or fails the selected requirements. UI validation can be bypassed or diverge from future clients.

**Required:** validate a complete server-side intake schema: real authorized stored files, valid CAD-to-part associations, required drawings/documentation, supported sizes/types, quantities and manufacturing compatibility. Fail before persistence. Restricted declarations were correctly rejected (400) in this assessment.

Source: `src/app/api/requests/route.ts`, `src/lib/request-model.ts`, `src/lib/rfq-manufacturing.ts`, `src/lib/rfq-options.ts`.

### F5 — P1: malformed shared drafts can crash Quotes

A synthetic API draft with DRAFT status but an incomplete Request shape was accepted. The hosted buyer's Quotes page then failed with **“Cannot read properties of undefined (reading 'at')”**; quote-reference rendering assumed `customerQuotes` exists. The API checks ID/status/date but not the whole draft/request schema.

The incomplete fixture was replaced with a complete saved Request. After refresh/synchronization, the browser recovered. This was an intentionally incomplete test fixture, not proof that normal UI drafts spontaneously become malformed.

**Required:** validate and version the persisted draft schema, sanitize/repair legacy records on read, and recover or quarantine invalid drafts without crashing the whole queue. Test both remote draft contents and local browser cache recovery.

Source: `src/app/api/request-drafts/route.ts`, `src/components/buyer-quotes.tsx` and draft restore/sync code.

### F6 — P1: provider webhook delivery cannot reach the protected Preview

Unauthenticated direct POST to the configured Test webhook returned **401 from Vercel Authentication**. Stripe cannot send the test runner's Vercel OIDC header. A temporary share link only produced a redirect/cookie flow, so it was not usable as direct provider ingress.

The actual sandbox card payment succeeded, but the saved order remained **QUOTED / PAYMENT_PENDING** before authenticated event replay. Replaying Stripe's genuine completion event through the hosted handler changed it to **PURCHASED / PAID**. Multiple duplicate replays preserved the one order. Genuine partial/full refund events also reconciled through this authenticated path.

**Required:** establish a supported, narrowly configured webhook ingress for the test environment without broadly exposing the Preview, then prove actual Stripe-origin delivery, retries and webhook-only fulfillment. Independently prove the subscribed Live endpoint/signing secret before enabling purchasing. This is a test-environment ingress blocker; this audit does not assert that the public Production endpoint is protected by Vercel Authentication.

### F7 — P1: quality uploads promise 25 MB but hosted requests reject a 5 MB document

A synthetic inspection PDF of **5,245,427 bytes** submitted through the actual admin quality form returned **413**. A **1,327-byte** inspection PDF then returned 200 and was durably attached in Neon/R2. The action accepts up to 25 MB, but the hosted request path cannot carry the larger payload.

**Required:** use authorized direct storage upload plus completion for quality documents, or set an honest supported limit and show a usable pre-upload error. Review supplier pricing/evidence/other multipart attachment routes for the same hosted request-size boundary. Do not assume the RFQ direct-upload path automatically fixes these separate forms.

Source: `src/app/(workspace)/admin/orders/actions.ts:uploadOrderQualityDocument`.

### F8 — P2: customer order activity claims progress that did not occur

The newly paid synthetic order was Awaiting supplier acknowledgment, had no actual supplier update, and showed **“Material ordered and machining scheduled.”** The component uses this fixed fallback whenever the update list is empty.

**Required:** show a truthful empty state or a real recorded event. Verify every customer milestone is derived from saved activity; no default copy should imply supplier execution.

Source: `src/components/buyer-order-detail.tsx`.

### F9 — P2: expected quality errors are not actionable in Production builds

Clicking quality approval before any documents were attached correctly failed to approve, but the buyer saw Next.js's generic Server Components error/digest message rather than the intended “documents must be available” guidance.

**Required:** return structured, safe errors for expected validation failures and show recovery instructions. Review other customer server actions for thrown expected errors that become opaque in hosted production builds.

Source: `src/app/(workspace)/orders/[requestId]/quality-actions.ts`, `src/components/customer-quality-approval.tsx`.

## Dependency and durability gaps observed in source

| ID / priority | Finding | Needed before completion |
| --- | --- | --- |
| R1 / P1 | Lockfile audit reports 29 advisories: 1 critical, 21 high, 6 moderate, 1 low. Next 16.2.6 falls within published affected ranges. Advisory counts are not 29 demonstrated exploit paths. | Review applicability, update to supported patched versions, refresh both lockfiles, and re-run release/hosted regression checks. Do not blindly apply audit fixes that downgrade unrelated dependencies. |
| R2 / P1 | Vendor edits use `.data/admin-vendor-overrides.json` on the application filesystem. This is not a durable shared Vercel data store. | Persist edits in the database; prove save/reload across instances/deployments, with safe failure behavior. Hosted vendor mutation was not attempted. |
| R3 / P2 | Paid-event reconciliation created zero Invoice records. The first invoice PDF GET issued one durable snapshot; repeated PDF reads retained one invoice. | Define invoice issuance as part of payment fulfillment or an explicit operator procedure. Prove webhook-only purchases get their accounting record even when nobody opens the PDF. The issued snapshot in this test matched payment/PO/tax and stayed unchanged through refunds. |
| R4 / P2 | Both npm and pnpm lockfiles exist; past deployment reconciliation was needed. No checked-in CI workflow was found. Existing dead-code audit is not clean. | Choose/enforce the package-manager contract and automated release checks; resolve consequential unused/server-only boundaries. Dead code alone is not treated as a purchasing blocker. |

Next.js's vendor [AVIF image-optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) covers versions below 16.3.3. This app uses optimized images and allows Wikimedia remote hosts; runtime exploitability was not tested. The vendor's [next/og ImageResponse advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) has a separate patch boundary; no ImageResponse use was found in this app. Conditional i18n/proxy and Windows-specific advisories must be assessed against actual configuration rather than assumed applicable to the Linux deployment.

## Hosted verification matrix

“Prepared” means the storage metadata workaround described in F1 was required. “Replay” means the actual Stripe event was delivered by this authenticated test runner, not directly by Stripe.

| Flow | Result | Limits / evidence |
| --- | --- | --- |
| Preview remote build | Pass | Ready deployment; application source unchanged during assessment. Earlier release checks passed 529 tests, typecheck, lint and local/remote build; that is not evidence against the hosted failures above. |
| Clerk customer login | Pass | Real development buyer browser sign-in; independent role/company identities used for HTTP tests. |
| Clean first welcome / skip | Pass | New buyer saw and skipped welcome. Password/address were pre-provisioned, so their first-run gates were not re-tested. |
| R2 credential scope/private bucket/CORS | Pass | Test bucket allowed; Production bucket denied; exact Preview-origin PUT preflight 204. |
| Normal upload prepare/PUT/completion | **Fail** | PUT succeeds; completion 400 for all three files. |
| Shared draft company scope | Pass, with schema failure | Buyer/member share draft; other company does not. Incomplete draft acceptance causes F5. |
| RFQ submit / duplicate retry / admin visibility | Prepared pass | Neon 201; same idempotency key 200/same RFQ; part indexes preserved. Missing-file/drawing negative cases fail validation expectations. |
| Original CAD/PDF downloads | Prepared pass | Authorized redirects/downloads matched hashes; other company 404; anonymous API access refused. |
| APS translation / thumbnail | Prepared pass | Valid large synthetic cube became ready. Company isolation **fails**. Representative native/assembly formats and interactive viewer handoff not certified here. |
| Admin quote issuance | Prepared pass | Hosted server action persisted QUOTED, one quote version, $75 parts + $10 shipping. |
| Quote visibility/PDF | Pass | Buyer/member PDF 200 and valid PDF header; other company PDF 404 and quote title absent. |
| Admin page authorization | **Fail** | Redirect bodies expose RFQ/order/customer-directory data. |
| Hosted Checkout / NY tax / PO | Prepared pass | Stripe session creation succeeds; subtotal $75, shipping $10, tax $7.54, total $92.54; optional synthetic PO retained. Other-company mutation denied. |
| Sandbox card payment | Pass | Native Stripe Checkout, 4242 test card, `livemode=false`, session complete/paid. |
| Signature verification | Pass | Missing/invalid signature 400; signed no-op 200 via authenticated Preview access. |
| Direct Stripe webhook delivery | **Blocked** | Vercel protection 401; pending order before replay. |
| Paid order / duplicate completion events | Replay pass | PURCHASED/PAID, one request; repeated actual event replays did not duplicate fulfillment. |
| Invoice issuance/download/isolation | Pass after PDF access | One durable invoice; $75 + $10 + $7.54 = $92.54 paid, $0 due, PO matches. Buyer/member 200; other company 404. No invoice existed before PDF access. |
| Partial/full refunds / duplicate events | Replay pass | $10 then $82.54 succeeded; stored cumulative refund $92.54; invoice unchanged, order not silently canceled. Browser displays Refunded. No real refund. |
| Quality upload/storage/download | Partial | 5 MB form 413; small PDF persisted. Approval with no docs rejected with generic error. Customer Admin approval persisted; a subsequent small document upload cleared it. Remaining role/shipment gates are listed below. |
| Customer order UI | Pass with accuracy issue | Browser displays order, tax, PO, hold, files and Refunded. F8 fixed fallback falsely claims manufacturing progress. |
| Customer email receipt | Unverified | Delivery deliberately disabled in this Preview. |

## What remains unverified for commercial rollout

These are missing proof or operating decisions, not automatically implementation defects. Prior local mock evidence does not close them for a hosted database-backed release.

| Area | Required completion evidence |
| --- | --- |
| Full customer journey | Clean browser starts from login/intake, uploads real representative CAD/drawings, configures/submits, receives clarification/quote, pays, sees order/invoice; no direct DB/storage fixture intervention. |
| CAD/viewer | Representative native files/assemblies and dependencies, large/slow/failed translations, units/dimensions, browser preload/handoff, refresh/reopen and original download fallback. Confirm APS entitlement/quotas; no guaranteed translation-time claim. |
| Quote lifecycle | Hosted clarify/revise/reissue, expired-quote renewal, revised/expired quote checkout denial, saved version/package consistency and exact PDF content. |
| Payment edge cases | Hosted decline, successful/failed 3DS, cancel/retry, competing checkout attempts, old/replaced sessions, amount/customer/quote mismatch, late/out-of-order events, actual provider retries and async payment/failure cases if supported. |
| Accounting | Invoice issuance timing, immutable address/line snapshots, concurrent PDF creation, partial/failed/pending async refunds, credit notes/adjustments and tax/accounting procedure. Full refund must not imply supplier stop. |
| Quality and shipping | Customer Admin approval persistence and new-document invalidation passed; still verify full package review, Customer Member refusal, second-company refusal, replacement invalidation, stale/concurrent approval refusal, required documentation coverage, hold enforcement on shipment, compliance-review hold and eventual tracking/delivery. |
| Onboarding/recovery | Controlled invitation and attached guide receipt for current auth release, personal-password/address gates, expired/resend links, password recovery after Clerk migration, clean welcome finish/skip/resume, account email changes and session expiry. |
| Email/support | Real inbox receipt for clarification, quote, payment, approval, shipment and support; failure/retry cadence; correct recipient and saved links. Preview intentionally sent none. |
| Devices/accessibility | Current hosted journey at actual mobile viewport, supported browsers, keyboard/focus and useful retry/errors. Prior local narrow-layout proofs remain narrower evidence. |
| Reliability | Database/storage/APS/payment outages fail safely without apparent success or ephemeral/demo fallback; restore/rollback rehearsal; recovery of payment/order/files after outage. |
| Observability | Demonstrated error/payment/webhook/email monitoring and alerts, responsible owner, retention needs and incident response. Existing logs alone do not prove an operational alerting system. |
| Commercial operations | Approved DDP shipping/import owner, supplier manufacturability/capacity/acknowledgment, real price/revision/destination, cancellation/refund/rework terms, accounting procedure, operator backup and support hours. See the operations runbook. |
| Live payments | Expected merchant/tax readiness plus genuine subscribed Live delivery proof and explicit enablement only after gates pass. Earlier Production readiness diagnostics passed; Live checkout remains disabled. No Live transaction was attempted here. |
| Legacy attachments | Reconcile any missing old RFQ file bytes if those jobs are needed. Filename metadata cannot recover an unavailable original. No legacy customer object was altered by this test. |

## Incomplete or intentionally deferred app areas

These are part of the distinction between a limited assisted launch and a “completed app.” Keep unavailable features clearly labeled or hidden; do not promise them as operational.

- **Analytics and Projects:** current route bodies are shells with legacy Bubble placeholder copy, not working project grouping or analytics.
- **Supplier self-service:** supplier identity/onboarding/portal execution is not the current provisioned-role workflow. Initial operations rely on Lattice coordinating suppliers manually.
- **Vendor management:** source-backed directory is useful, but editable overrides are filesystem-based (risk R2 above), and a reliable supplier qualification/capacity/package/acknowledgment process still needs operating proof.
- **Support administration:** durable support requests and email retry exist; source shows no complete assign/reply/resolve workflow in the admin actions. An explicit manual support procedure is needed initially.
- **Notifications:** derived activity is not a complete durable read/unread/preferences notification system. Manufacturing activity must also be truthful (F8).
- **Team self-service and integrations:** deferred; operator provisioning is available. Do not advertise customer self-service role/invitation/integration management as complete.
- **Saved company cards / inline checkout:** deferred; the approved first-cohort path is hosted card Checkout. These are not defects when the limited scope is explicit.
- **PO credit, tax-exempt purchasing and customer carrier billing:** outside the initial card/DDP cohort. Optional PO reference works; it is not payment authorization or credit approval.
- **Carrier/tracking automation:** status/tracking and delivery confirmation require operator inputs; integrated shipment booking/tracking was not demonstrated.
- **Automatic email retries / credit notes / supplier cancellation:** not completed automation. Reliable approved manual procedures may support an assisted cohort, but must be documented and exercised.
- **APS optimization:** company-scoped reuse, job cancellation guarantees, completion notifications and broad format performance remain incomplete or proposed. Preview availability must not imply model privacy until F3 is fixed.

## Release gates and repair order

1. **Contain and fix F2/F3** before more customer-private data is exposed; review current Production because it shares the code. Prove negative raw-response/derivative access checks across roles and companies.
2. **Repair F1 and F4/F5**, then prove normal uploads and robust draft/intake validation on R2/Neon. Include failure/retry and reload cases.
3. **Patch applicable dependencies and replace vendor filesystem writes**; establish the release checks for both lockfiles.
4. **Provide test webhook ingress**, then repeat payment/edge/accounting tests with real provider delivery. Decide invoice issuance timing. Keep Live purchasing disabled meanwhile.
5. **Repair hosted quality upload size handling and safe validation errors**, then exercise approval, replacement and shipment holds with real role identities. Remove invented order progress.
6. **Complete communication, recovery/device and operating gates**, recording proof and explicit first-cohort exclusions. Obtain the outstanding business decisions through the operations runbook.
7. Deploy fixes to a new isolated Preview, repeat the clean customer journey, and record the exact final release/deployment. Do not treat this report, a successful build, or prepared-fixture passes as permission to promote unfinished purchasing.

## Evidence and handoff

- [Sanitized hosted observations](hosted-readiness-2026-10-13/evidence.json): test names, statuses and synthetic assertions; no credentials/tokens/signed URLs/customer payloads.
- Local ignored capture folder: `output/qa/hosted-readiness-2026-10-13/`. Includes the synthetic malformed-draft error, quote and invoice PDFs; raw administrative responses stay local because they can contain private development data.
- [First-customer operations runbook](../first-customer-operations-runbook.md) and [earlier readiness review](../first-customer-launch-readiness-2026-10-09.md) retain operating context. This report supersedes their unfinished hosted-test items only where fresh evidence above exists.
- Test objects/identities/RFQs and the Test webhook are retained for repeatability. One synthetic order is fully refunded in Stripe Test mode; synthetic negative RFQs remain labeled test-only. No supplier job, customer email or Live payment was initiated.
- The R2 test credential expires October 20. Renew only with an explicitly scoped test authorization if re-testing after expiry; remove the test branch environment/resources when no longer needed. Secrets stay in ignored files and Vercel branch Preview variables.
