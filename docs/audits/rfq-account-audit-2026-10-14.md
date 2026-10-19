# Production RFQ submission → admin review audit — 2026-10-14

## Result

Subsequent repair status: the three app defects are repaired/released; Autodesk conversion requires account capacity restoration. See [RFQ audit repairs](rfq-audit-repairs-2026-10-14.md). The findings below preserve the original audit evidence.

The authorized test run is complete with findings: **12 RFQs, 24 parts, 39 original files**, submitted through four genuine customer Google sessions and reviewed as `will@latticeos.co`. Each customer submitted one one-part, one two-part and one three-part RFQ. All selected requirements match the saved database records and admin rendering; all 39 originals downloaded through authenticated normal links and are byte-identical to the uploaded fixtures. File-to-part ordering, exact file counts and sizes, requester/company attribution and absence of extra submitted file versions were verified. **840 comparisons pass.** CAD preview/dimension coverage is not a clean pass: Autodesk returned 403 for all six final-account models, leaving 24 missing derived fields across database/admin dimension/unit checks.

The exact durable record of every submitted field, full notes, declarations, part indexes, filenames and original-download hashes is [rfq-account-submissions-2026-10-14.json](rfq-account-submissions-2026-10-14.json). This deliberately excludes storage credentials, signed URLs, authentication material and unrelated account addresses. Browser screenshots, before-submit/saved/admin DOM captures, independent intended-value records and comparison scripts remain in the local QA evidence directory `output/qa/rfq-account-audit-2026-10-14/`.

| Account | Role / company | RFQs | Parts | Originals | Result |
| --- | --- | ---: | ---: | ---: | --- |
| paik.e.william@gmail.com | Customer Member / Apple | 3 | 6 | 9 | Selected requirements and all original hashes match; initial fixture limitation below. |
| willclawpaik@gmail.com | Customer Admin / Apple | 3 | 6 | 9 | Selected requirements and all original hashes match. |
| willpaik99@gmail.com | Customer Admin / Greno Industries | 3 | 6 | 11 | Selected requirements and all original hashes match. |
| ahoyyer@gmail.com | Customer Member / Greno Industries | 3 | 6 | 10 | Selected requirements and all original hashes match; CAD previews/dimensions unavailable after Autodesk 403. |

## Submitted cases

| Test | Request ID | Configuration |
| --- | --- | --- |
| PW-1 | `rfq_ccd9ef4b2a8bedc3390786529b5459d63c4d1a4e` | Qty7 Milling 6061-T6/as machined/Medium/Standard; Prototype; CAD only; no date/feature flags; approval false. |
| PW-2 | `rfq_c0f98f810b3b1b31ebda29477e4812de1c536937` | Qty13 Turning316L/smooth/Fine/CMM+MTR/drawing/threads+fits/Oct29; qty29 MillingPOM-C/as machined/Medium/Standard/CAD only/Nov16; Commercial; approval true. |
| PW-3 | `rfq_4843660c4a9dd98704b19c9165b952b97d84196c` | Qty3 Milling7075-T6/TypeII blue/Fine/FAIR+CoC/drawing/all five flags/Nov6; qty47 SheetMetal5052/powder RAL5015/Medium/Custom/CAD only/no date; qty101 TurningBrass360/polish/Medium/Dimensional+Formal/drawing/Dec4; Prototype; approval false. |
| WC-1 | `rfq_0e48f7f801db9df391ae602e7bebcc0727be61be` | Qty11 TurningBrass360/smooth/Medium/CoC/CAD only/Oct30; Commercial; approval false. |
| WC-2 | `rfq_944ebe6ec4babbf6df3e0eba57f4e9d58810023d` | Qty17 Milling7075-T651/natural hardcoat/Fine/CMM/drawing/threads/Nov20; qty53 Turning304/cosmetic bead blast/Medium/MTR/CAD only/no date; Prototype; approval true. |
| WC-3 | `rfq_8bf7c6a0beee28eca3c31d2629a020e4ec88f4fb` | Qty5 MillingPEEK/smooth/Medium/Standard/CAD only/no date; qty61 TurningCopper110/polish/Fine/Dimensional/drawing/fits/Dec11; qty89 SheetMetal1018/white powder/Medium/Custom/drawing/markings/Jan15 2027; Commercial; approval false. |
| W99-1 | `rfq_73e734b9b49ae7757d3799ec33e14670a6c02dd0` | Qty2 MillingTitanium5/fine machining/Fine/MTR/CAD only/no date; Prototype; approval false. |
| W99-2 | `rfq_a415b9f3c550476f9800a8633c746b2167e5d5f7` | Qty31 SheetMetal5052/as fabricated/Medium/CoC/optional drawing/Nov30; qty73 Turning4130/as machined/Fine/Formal/drawing/threads+corners/Dec18; Commercial; approval true. |
| W99-3 | `rfq_a83f97b721b3ee2cbb0d69b42c112fbdb2b6fde8` | Qty15 MillingDelrin/as machined/Medium/optional drawing/no date; qty97 TurningTitanium2/non cosmetic bead blast/Fine/CMM/fit/drawing/Jan22 2027; qty113 Milling6082/clear chromate/Medium/FAIR+MTR/marking+linear/drawing/Nov25; Prototype; approval false. |
| AH-1 | `rfq_0fa3af818700133c0750cd3ba963e1fcedf79409` | Qty19 TurningPolycarbonate/smooth/Fine/Standard/CAD only/Feb12 2027; punctuation/multi-line notes; Commercial; approval false. |
| AH-2 | `rfq_3b02ca9cdd96ee0d0c80d6011d424db72fbb86f5` | Qty37 Milling6061-T651/cosmetic orange matte anodize/Fine/FAIR+MTR/drawing/linear+threads/Dec23; qty127 SheetMetalA36/as fabricated/Medium/CoC/CAD only/no date; Prototype; approval true. |
| AH-3 | `rfq_d8f880dbc9c9744d428cbbadfd50e15760216a40` | Qty43 TurningBronze932/polish/Fine/Custom/drawing/no date; qty151 Milling316/nickel/Medium/CoC/drawing/fit/Jan29 2027; qty251 SheetMetal3003/Pantone Warm Gray9C powder/Medium/Standard/drawing/markings/Mar5 2027; Commercial; approval false. |

Standard Inspection is included on every part in addition to the optional documents shown. All declarations are unrestricted. Dates without a year above are in 2026. Feature flags become explicit appended requirement notes; these generated lines are expected, not accidental extra information. The JSON record retains exact spelling, full notes, date strings and values.

## Findings requiring follow-up

1. **Customer per-part process display uses the aggregate RFQ process.** Mixed-process PW/WC/W99/AH requests show the combined request process on every part in customer quote detail, even though saved per-part processes and admin labels are correct. `src/components/buyer-quote-detail.tsx` uses `customerLine?.process || request.process` in both layouts; before quote issuance there is no customer quote line. Use the saved part manufacturing process before the request-level fallback, then verify both layouts with one mixed-process test.
2. **Admin PDF previews fail for valid unchanged originals.** Multiple synthetic drawings show “The drawing could not be previewed. Download the original file below to review it.” The PW-3-P1 original is byte-identical and installed PDF.js parses it as one page with all expected text. All fifteen drawing original hashes now match, ruling out lost/swapped upload bytes in these fixtures. Diagnose hosted fetch/worker/font/rendering behavior; original-download fidelity is a separate pass.
3. **Negated free-text notes incorrectly require a drawing.** WC-2-P2 has no drawing-dependent flags/documents. The form showed Ready to submit, but a note saying “no drawing required” was rejected with “Part 2: upload a drawing for the selected specifications.” `src/lib/rfq-submission-validation.ts` uses `/drawing required/i` on all notes. Rephrasing that sentence to “CAD-only package” allowed submission; the revised intent and rejected attempt are recorded. Do not infer structured requirements from arbitrary prose. Preserve enforcement of actual required drawings and legacy generated requirement lines.
4. **Autodesk translation returned 403 for the six final-account models.** AH-1 and both AH-2 models failed to start translation; after William reported replenished credits, both staged AH-2 CADs were reselected through Replace Part and still showed 403. The three subsequent AH-3 CADs also have no saved URN or derived metadata. Original uploads/submission/downloads succeed. `startTranslation` in `src/lib/autodesk-platform-services.ts` identifies this as the provider job-start response, but discards its response body; inspected Vercel error logs provided no reason beyond unrelated Postgres SSL warnings. Cause is **not confirmed** as exhausted credits, billing, entitlement or credentials. All six affected parts lack source-unit/envelope fields in the database and admin; 24 derived checks fail (dimensions+units at each layer). Submitted manufacturing requirements are intact. Resolve provider authorization/entitlement and add an explicit retry/backfill path for already-submitted originals; do not claim the credit refill fixed conversion.

No application source repair, quote issuance, supplier outreach, order, payment, deployment or destructive cleanup was performed in this audit. The twelve explicit QA Production records remain available for operator review. Existing Impeller, A4589 and A4140 RFQs were preserved; there are fifteen active RFQs total, twelve under the `QA 2026-10-14` filter.

## Role/company checks

- Apple Customer Admin willclawpaik sees the Apple member PW RFQs. A direct foreign Greno RFQ returns 404; admin queue access redirects to the customer dashboard.
- Greno Customer Admin willpaik99 is denied an Apple RFQ (404), its directly addressed CAD original (`File not found`), and the admin queue (redirect).
- Greno Customer Member ahoyyer opens the Greno admin's RFQ and downloads its CAD byte-identically. Apple RFQ/file access is denied and the admin queue redirects to the customer dashboard. The member's first-login welcome tour was skipped through the ordinary UI before testing.

These checks cover the described RFQ paths, not complete security certification. The previously documented internal supplier browser-payload leakage remains open in [admin-customer-separation-2026-10-14.md](admin-customer-separation-2026-10-14.md).

## Test limits and evidence

- PW-1's first generated faceted STEP translates to empty viewer geometry. This is a fixture limitation, not proof of an app conversion defect. The remaining CADs use a previously verified synthetic OpenCASCADE solid with a 20 mm envelope. Drawing fixtures explicitly contain simplified conditional QA feature references, not factory-ready manufacturing definitions. PW drawings predate the solid substitution and have stale envelope labels; the WC/W99/AH labels were corrected before upload. The audit checks transfer/fidelity, not DFM or manufacturing correctness.
- PW-2-P2 was submitted before optional CAD dimensions populated; they remain absent in the saved record. New AH models lack dimensions because conversion failed. There is no late automatic dimension backfill shown by this audit.
- A specialized automated file-download operation once navigated to a Chrome-blocked R2 URL (`ERR_BLOCKED_BY_CLIENT`). Returning to the app and using its ordinary visible download link succeeded without disabling any browser protection. All 39 originals are verified through successful normal authenticated downloads. Native keyboard/link activation was used where CAD/PDF height changes caused coordinate drift; failed automation attempts are not classified as app file-loss bugs.
- A long-lived capture closure wrote W99 values into an older in-memory array after reassignment. The six authenticated admin DOM snapshots were preserved and parsed into the comparison record; all 220 W99 comparisons pass. Subsequent captures read/update/write the evidence JSON directly. No application data was changed to resolve evidence handling.
- Customer quote activity time presentation lacks a visible timezone and differs from the admin queue's explicit EDT display; admin detail headers also omit the zone. Submitted target-date strings match exactly. This is a presentation observation beyond the three confirmed app defects above.
- No exhaustive material catalog, mobile, quote issuance, procurement, checkout, restricted-work submission or legal classification test is claimed. The 12 cases cover the requested varied RFQ intake and review path.

Final evidence: `final-results.json`, `first-account-results.json`, `WC-results.json`, `W99-results.json`, `AH-results.json`, `download-hashes.json`, and `twelve-rfqs-admin-queue.png` in the QA directory. The admin Chrome tab is left open, signed in as will@latticeos.co, filtered to the twelve QA records.
