# RFQ audit repairs — 2026-10-14

## Conclusion

The customer process display, hosted PDF preview and false drawing validation findings are repaired and released. Autodesk conversion remains blocked by provider capacity; the account owner must restore APS/Flex capacity for the app/team. William confirmed the newly added credits were Codex credits, not Autodesk credits.

Production release: `dpl_FboVWTNXMVUuxkBmZ1oLvk9ijLDN`, `https://lattice-j10ap0z1d-willpaikstacks-projects.vercel.app`, promoted to latticeos.co. The release preserves the previously deployed queue/provenance changes. The unrelated local material-atlas edit was excluded. No workflow records were cleared or customer quotes issued.

## 1. Customer process display — resolved

Both customer detail layouts now prefer the issued quote line process, then the saved individual part process, then the overall request fallback. Canonical process values receive readable labels. Existing quoted specifications retain precedence.

Verified the normal customer detail route for WC-3 using the admin's permitted customer-workspace view: P1 shows CNC Milling, P2 CNC Turning and P3 Sheet Metal Fabrication. The former combined process is absent from part specifications. The regression test covers both layouts before quote issuance; existing issued-quote tests continue to pass. This browser check does not claim a fresh customer Google sign-in.

UI: corrected process text beside each part; no extra customer controls. No user input needed.

## 2. Hosted PDF preview — resolved

The deployed component's load error was `Failed to fetch` while following the authorized file endpoint's redirect to private storage. The same file rendered locally, and the packaged worker was served successfully in Production. This isolates the failed boundary to the browser's remote file fetch; the exact browser/CORS policy producing the refusal was not separately established.

PDF preview requests (`preview=1`, actual `.pdf` storage key) now authorize the same session/file first, inspect stored metadata and stream the original bytes through Lattice's origin. Other original downloads retain private signed redirects. Private no-store caching, sandbox, content type, nosniff and disposition remain enforced. Unauthorized requests cannot open a storage stream. Rendering remains lazy and uses the packaged PDF.js worker.

Production browser checks: PW-3-P1 and AH-2-P1 show Page 1 of 1 and the correct drawing text/canvas. AH's PDF renders even while its CAD conversion is unavailable. An existing non-synthetic multipage PDF was also checked through the same admin review path. Existing fixtures' stale drawing envelope labels are unchanged; that is the fixture limitation documented in the original audit.

UI: the existing drawing viewer now displays the PDF; navigation/zoom and the original-download link remain available. No user input needed. Very large PDF streaming/rendering and every possible PDF variant were not exhaustively tested.

## 3. Customer prose triggers drawing requirement — resolved

New submissions save the five drawing-dependent feature choices as `manufacturingDetails.drawingRequirements` in the existing JSON metadata; no schema migration is needed. The server checks these structured selections and the selected inspection documents. Arbitrary notes such as `no drawing required` no longer create a requirement.

Legacy clients/records without the structured flags retain support for exact whole generated requirement lines, such as `Threads requested; drawing required.`. Substring matches inside customer sentences are removed. Draft/resubmission prefill likewise prefers saved structured flags and only recognizes exact legacy lines, so reopening the RFQ does not infer feature selections from prose. Actual selected drawing requirements remain enforced.

Verified negated/mid-sentence notes, structured true/false choices, required inspection documents, legacy generated flags, and resume behavior. No extra Production RFQ was submitted for the regression; validation and form integration were checked locally.

UI: notes accept ordinary customer wording, and the existing drawing checks follow actual selections. No new controls. No user input needed.

## 4. Autodesk 403 — external action required

A retry against an existing failed AH source object returned HTTP 403 with this provider response:

> Token exchange denied. Policy 'ProductAccessRequiresCapacity' has effect: deny

Authentication and access to the production CAD bucket succeed. The normal deployed admin retry independently confirms the same capacity failure with the Production configuration. Autodesk Support describes this policy as insufficient allowed capacity for the token/app/team and directs account owners to API usage and APS capacity. This does not establish which paid plan or balance the account currently has.

References: [Autodesk Support explanation](https://forums.autodesk.com/t5/installation-licensing-forum/token-exchange-access-denied/m-p/14118486/highlight/true), [Autodesk API usage](https://manage.autodesk.com/feature-usage/).

App changes: job-start errors now map that specific refusal to a clear capacity message without exposing arbitrary provider response contents. Admin review offers **Retry CAD preview** for a saved original whose preview is missing/failed; it uses the existing authorized source, current saved eligibility declaration and secure model registration. Missing eligibility remains blocked. An available private source association can be reused. Original downloads stay available after failure. A deployed AH-2-P1 retry returned the clear message and re-enabled the button; it did not create another RFQ.

**Needed from William:** activate/restore Autodesk APS/Flex conversion capacity for the Autodesk app/team used by Lattice. Codex credits cannot supply it. No purchase, plan acceptance, credential rotation or provider-account change was attempted.

After capacity is restored, retry and review the six affected AH models. Successful preview recovery and persisted original-file URN/derived-dimension backfill remain to be verified; the new retry can register/reuse a secure preview, but does not yet backfill the RFQ's saved original-file URN or line-item dimensions. Do not claim the six missing previews/dimensions are repaired now.

## Verification and evidence

- Full suite: 118 files / 588 tests passed after the PDF route and retry tests. The subsequent saved-flag prefill change passed its focused regression group (15 tests) plus typecheck/lint; no final full-suite rerun is claimed after that narrow change.
- Changed-file lint, TypeScript and the final hosted Production build pass.
- Five outdated inspector tests were reconciled with the user's previously released table-only queue behavior. Detail coverage remains in the dedicated admin detail suite.
- Original-download redirect coverage and unauthorized-file denial tests pass. Browser checks use existing Production records and preserve all 12 test RFQs and the 3 earlier user RFQs.
- Local evidence: `output/qa/rfq-audit-repairs-2026-10-14/`. Includes corrected customer-process DOM/screenshot, working PDF screenshot and capacity-refusal DOM/screenshot. Private environment material and raw runtime logs stay gitignored under `.vercel/repair-private/`.
- The earlier internal supplier-data payload finding remains separate and open. These repairs are not a complete authorization/security certification.
