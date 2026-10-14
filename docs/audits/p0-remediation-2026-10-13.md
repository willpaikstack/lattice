# P0 remediation and hosted retest

Date: October 13, 2026 (America/New_York). Application patch: `db347a6`.

## Outcome

All three reported P0 defects are fixed in the application code and passed hosted positive/negative API retests. The Production build `dpl_EmQHJHnZtE1ohen8tAMbuyagnTek` was staged, checked with Production configuration, then promoted to https://latticeos.co. Live checkout remains disabled; no Production customer, payment, email or storage fixture was created by these checks.

**Verification limit:** the Mac remained locked, preventing the requested native browser follow-through. Interactive rendering and file-picker clicks have not been freshly certified for this patch. The actual hosted upload/submission/download and provider model-authorization paths were exercised through HTTP, with genuine development Clerk sessions, Neon, private R2 and APS. This does not close the P1/P2 rollout gaps in the original readiness report.

## Changes and customer experience

| P0 | Repair | Customer/operator experience |
| --- | --- | --- |
| Upload completion | Store expected name/type/size in a private, server-written R2 upload-intent record; sign exact length/type; compare the uploaded object with that trusted record. Completion no longer depends on metadata hoisted into presigned URL query parameters. | The existing upload-once flow now completes for small/large CAD and drawings. Names and bytes are preserved. No extra step or new CORS configuration is required. |
| Admin data exposure | Authorize each administrative page before private queries execute, retaining the existing layout/action/route checks. Cover queues, customer/vendor profiles, order detail, inquiries and resource previews. | Customers following admin links still return to their workspace. Operators retain their existing screens. The redirect response no longer contains another company's administrative data. |
| CAD derivative privacy | Register model ownership only from server-created translation results in private R2 records. Enforce ownership on status, thumbnail and token routes. Issue APS dynamic resource scopes for the authorized mounted models; no broad viewer token. Use unique object IDs and serialize SDK token initialization for multiple parts. | Interactive CAD viewing retains the same controls. Company colleagues and Lattice operators can access authorized models; other companies cannot. Saved previews are rechecked; eligible older previews can be regenerated from the authorized original and subsequently reused. Original-file download links remain the fallback. |

No visual redesign, new mandatory form fields or changed manufacturing choices were introduced. Restored previews may briefly show their existing checking/processing state while access is revalidated. A legacy preview without a verified ownership record is denied rather than trusting a client-supplied saved URN. Recovery requires an authorized stored original and the current eligibility declaration; otherwise the original-file/replacement fallback is shown.

## Hosted retest results

Preview: `dpl_DaNBCUE4PKuWEVx6u2655TdCtqJ1` at https://lattice-hosted-test.vercel.app, with development Neon/Clerk, private `lattice-preview-test` R2 and the separate APS test bucket. Production-equivalent application code, isolated test data.

| Check | Result |
| --- | --- |
| Large STEP: 6,482,251 bytes | CORS 204, signed PUT 200, normal completion 201; correct original name and length. |
| Small STEP: 2,246 bytes | CORS 204, signed PUT 200, normal completion 201; correct original name and length. |
| PDF: 5,245,427 bytes | CORS 204, signed PUT 200, normal completion 201; correct original name and length. |
| Normal RFQ submission | 201 with all three files; no fixture metadata manipulation. |
| Saved original downloads | All three private downloads 200 after authorized redirects; hashes match the originals. |
| Wrong upload length | Signed PUT rejected (403); expected size cannot be changed by the client. |
| Another company completing uploads | 404 for all three file keys. |
| Private intent/model records | Download route returns 404, including for an operator; internal records are not customer attachments. |
| Unauthorized admin pages | Customer/second-company/anonymous redirected responses tested across 12 routes; no forbidden company data. |
| Authorized operator | Quote queue, RFQ detail and existing order detail return 200 and expected test content. |
| Model status/thumbnail/token | Same-company Member 200; other company 404; anonymous 401. |
| Unscoped token request | 400; no broad APS viewer token is issued. |
| Direct APS requests with scoped token | Authorized model manifest/thumbnail 200; different synthetic model manifest/thumbnail 401. |
| Two-model token | Both permitted model manifests 200; unrelated manifest 401; other company cannot obtain the group token (404). |
| Saved original recovery | Operator starts secure recovery (202); its customer retains access (200); another company remains denied (404). |
| Staged Production smoke | Login HTML present with Production Clerk configuration; anonymous requests/model-token APIs 401; admin pages redirect 307. |
| Local release checks | 557 tests / 113 suites pass; typecheck and optimized build pass. Lint has zero errors and four warnings in ignored, local QA scripts. |
| Remote release builds | Preview and Production builds Ready. |

The redirected workspace may legitimately serialize the caller's own customer data, and Next.js may echo URL identifiers supplied by the caller. Neither is a foreign-data leak. Initial marker assertions were refined to distinguish those cases; final checks inspect forbidden company titles/names/file data rather than treating echoed route parameters as private query results.

An extra adversarial P1 submission probe timed out; it is not counted as a passed persistence/validation test. Model ownership checks after that probe still denied the other company. Existing invalid-submission and general resilience work remain open. Recent Preview error inspection found the previously observed PostgreSQL driver deprecation warning on that submission path; database reliability is not certified by this patch.

## Architecture and remaining work

- Private upload intents and CAD ownership/source records live in the existing private object store under fixed, hashed `internal/` keys. The browser cannot select those keys for signed writes, and file-download authorization does not expose them. Storage failures deny access rather than falling back to broad model permissions.
- No database migration, new production secret, public-bucket setting or CORS expansion was required.
- The viewer uses Autodesk's documented [resource-scoped tokens](https://aps.autodesk.com/blog/scoped-tokens-are-here), verified against the real provider. Previously issued broad tokens, if any, are not retroactively revoked by a code deployment and expire according to their original provider lifetime.
- Finish native browser upload/interactive-viewer/multi-part recovery checks once the Mac is unlocked. The original P1/P2 issues—submission/draft validation, webhook ingress, quality upload limits, dependency advisories, vendor durability, accounting/communications and operating gates—are still outstanding.

[Sanitized hosted evidence](p0-remediation-2026-10-13/evidence.json). Raw responses, fixture files, credentials and local captures remain ignored under `output/qa/` and `.vercel/`.
