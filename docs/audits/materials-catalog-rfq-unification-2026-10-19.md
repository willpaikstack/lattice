# Materials catalog and quote selection UX audit

Date: October 19, 2026. Status: recommendations; no application changes or deployment in this audit.

## Recommendation

Use one reviewed material registry to drive the Materials atlas, family directories, common-grade cards, quote picker, and selected-material summary. Give each grade a stable identity, model condition separately, and give customers a continuous path from researching a material to requesting it on a specific part.

The two surfaces should serve different tasks while agreeing on identity and requestability. The catalog helps buyers understand and compare. The picker helps buyers enter a drawing callout quickly. Their visual density can differ; their material names, families, condition choices, and sourcing actions should agree.

## Scope and evidence

Reviewed the current local source and evaluated its exported catalog and selectable RFQ option data after the latest approved removals and family moves. Inspected the atlas, family-page layout, common-grade cards, grade directory and condition controls, active grouped quote picker, name resolver, material options, process/finish checks, and property lookups. Read the prior October 10 catalog audit, October 13 picker audit, and durable product decisions.

The local `/materials/aluminum` route returned HTTP 307 to authentication for an anonymous request. This is a source and data based heuristic audit, informed by the supplied browser context and earlier page evidence. No new authenticated desktop/mobile walkthrough, screen-reader assessment, customer usability study, or production inventory verification was performed. The preserved search-first picker is disabled; findings about the active picker refer to `LegacyMaterialSelect`.

Measured current local state:

| Measure | Result | Meaning |
| --- | ---: | --- |
| Materials-page family directories | 12 | Customer-facing browse families |
| Directory rows | 284 | Mixed grade and alloy-offering rows; excludes common-grade presentation cards |
| Selectable RFQ options | 104 | After the current alias-selection filtering |
| Raw RFQ options | 114 | Includes historical/overlapping entries before selection filtering |
| Aluminum directory | 21 offerings | Related tempers are grouped under an alloy |
| Aluminum picker | 22 choices | Some choices include tempers and some do not |

These are different counting units. Subtracting 104 from 284 would not produce a valid count of missing materials. A complete reconciliation needs reviewed material identities and condition relationships.

## What works today

- Family cards have clear navigation and concise use-oriented descriptions.
- Grade search already normalizes punctuation and spacing and recognizes approved aliases in the quote picker.
- New parts do not silently default to a material.
- Aluminum already has a useful parent-alloy/condition structure in its directory.
- Explicit dual-certification notes accompany the combined 304/304L and 316/316L quote choices.
- Property sources and reference conditions are available, and polymer behavior guidance is generally more useful than one generic mechanical-property table.
- A dedicated unlisted-material inquiry and admin qualification workflow already exist.

## Findings

| Priority | Evidence in the current implementation | Effect on usability and confidence | Recommendation |
| --- | --- | --- | --- |
| 1 — High | The catalog combines vendor offerings and the CNC research library; RFQ options come from the CNC research library. The shared alias resolver does not define one published offering set. Catalog 321 and 347 have no picker option. | A buyer can research a listed material, then fail to find it when requesting a quote. | Publish both views from the same reviewed records. Every published catalog material must be findable in the picker and have a clear quote or sourcing action. |
| 2 — High | Common-grade cards and family examples are independently authored. Tool steel features D2 and H13, but neither is in its current four-row full directory. Brass features C385/C464, absent from its directory. Stainless featured cards say 304/316 while the directory and quote choices use the approved combined designations. | The same page appears to contradict its own complete list. | Feature existing material records by ID and use the same name and condition data everywhere. Repair accidental omissions before interpreting them as sourcing decisions. |
| 3 — High | Aluminum 6061 is one directory offering with T6/T651 conditions; quote selection has separate 6061-T6 and 6061-T651 rows. Other alloys mix unspecified and explicit conditions. | Buyers cannot tell whether a choice is a duplicate or a different requirement. | Use a Material field followed by a relevant Condition field. Allow exact-condition search to fill both. Carry the complete callout into the part summary and submission. |
| 4 — High | Copper contains Bronze 932 in the catalog, while Bronze is a separate quote family. Nickel & specialty alloys is represented by Inconel and Other Metals in the picker. Polymers use another grouping model again. | Customers must relearn where a material belongs after changing pages. | Maintain shared family IDs, labels, and ordering. Use metallurgy subgroups in the catalog and a shallower presentation in the picker. Give Bronze a consistent home. |
| 5 — High | Invar and Invar 36 still both appear in the precision-alloy directory, although RFQ selection is consolidated. Polymer lists contain overlapping labels such as PTFE / PTFE (Teflon), Acrylic / PMMA (Acrylic), and multiple POM labels. | Similar options can suggest unexplained differences in performance, price, or certification. | Review remaining overlaps. Use one choice for proven equivalent designations and searchable alternate names. Keep different resin grades, fillers, conditions, certifications, and homopolymer/copolymer requirements distinct. |
| 6 — High | Family/profile/property logic still uses display names in places. The newly renamed Nickel & specialty alloys family no longer matches code branches keyed to Inconel/Incoloy. | A heading change can suppress useful guidance or cause property lookup to fall back. | Key family classification, profiles, and properties by stable IDs. Treat display names as presentation only. Include this in the immediate correctness pass. |
| 7 — High | Materials pages say Available and The network supports this alloy while their source union includes competitor-researched offerings. Neither source alone establishes current supplier capacity. | Positive claims and repeated availability caveats leave buyers unsure what Lattice can actually quote. | Record the basis for offering each grade. Use clear actions such as Request quote or Ask us to source, with one concise explanation of quote confirmation. Keep inventory and certification claims dependent on evidence. |
| 8 — Medium | Family guides place a large hero, common-grade rows, and a second full directory before completing the selection journey. No grade row carries the selected grade/condition into an RFQ. | Research creates scrolling and memory work, then buyers must repeat their selection. | Put the working grade list earlier, reduce the hero, and turn Common grades into shortcuts to real rows. Add Use for this part or Request a quote with this material. Preserve the CAD-first flow and existing drafts. |
| 9 — Medium | The active catalog has no grade lookup. Quote no-results sends users to email; the atlas uses a dedicated inquiry form. | Known-grade users must browse families, and failed searches leave the quote task. | Add an optional Find a grade lookup while retaining family cards. Use the same search index in both surfaces. Reuse the existing qualification workflow, retaining the query, drawing context, and draft/part reference. |
| 10 — Medium | The active picker nests expandable groups inside a 430px scrolling region. Search has only placeholder text, Escape closes without restoring trigger focus, and its listbox contains other interactive controls. A viewport-aware alternative exists but is disabled. | Long lists are harder to navigate; keyboard and assistive-technology behavior are incomplete. | Keep a compact searchable picker with stationary search, bounded results and simple family browsing. Add an accessible name, result announcements, coherent combobox/listbox semantics and focus restoration. Check placement near viewport edges. |
| 11 — Medium | List rows lead with grade/UNS/chemistry while missing data may appear as UNS N/A, Designation as listed, or UNS pending verification. Important reference caveats use 10–11px pale text. | Secondary information competes with the choice; incomplete editorial metadata can look like an uncertain material specification. | Lead with grade and required condition. Show a verified alternate designation when useful; put chemistry and reference properties behind details. Increase reference text size/contrast. Resolve uncertain material identities before publishing, while treating optional identifiers as optional. |
| 12 — Medium | Machinability is shown as both text and a five-segment scale; generic group guidance repeats across rows. | Decorative precision and repeated prose add density without clarifying the actual choice. | Prefer qualitative labels with a short basis. Keep family guidance at the group level and use row space for reviewed grade-specific differences. |

The active atlas is intentionally family-first and the search-first picker trial is intentionally disabled. Optional catalog lookup and picker changes above are new recommendations, not assumptions that those earlier choices were revoked.

## Shared material model

One master record should include:

- Stable material ID and family ID.
- Canonical customer name and explicitly reviewed alternate search names.
- Grade/designation, applicable specification and certification requirements.
- Distinct conditions/tempers and valid process/form relationships, where supported by evidence.
- Published/requestable, sourcing-review, or retired status, with an internal basis for that status.
- Condition/form-specific reference properties and source documents, separate from supply evidence.
- Historical keys and display snapshots so existing RFQs retain their original requirements.

The master registry can initially live in code. A database becomes useful when operators need to maintain it through an admin UI. Moving the current lists into one database would not by itself reconcile their meanings.

Do not copy all 284 directory rows straight into the picker. First resolve generic identities, true aliases, condition relationships, retired entries, and the basis for each offering. Research from another manufacturing network should remain reference evidence until Lattice has an explicit offering or sourcing-review policy for the material.

The invariant should be: every published material has a searchable path into a quote or qualification request; every quote choice has a matching catalog identity. Full supplier qualification and a request for sourcing are different operational states, and the action should explain the next step without repeating warnings on every row.

## Proposed experience

### Materials page

Retain the family atlas. Offer a discreet Find a grade lookup for buyers with a known drawing callout. On each family page, put a concise introduction and common-grade shortcuts above a single canonical directory. A row shows the grade, a useful verified alternate designation, relevant conditions, and its action. Expand for application guidance, reference properties, and their exact condition/source.

Use Request quote for a published requestable offering and Ask us to source for a qualification path. Those actions should carry the material identity and chosen condition. Avoid implying stock availability through the word Available when the evidence only establishes a catalog listing.

### Quote configuration

Keep a searchable material control and family browsing. A buyer searching 6061-T651 should reach one 6061 material with T651 selected, while a buyer browsing 6061 should be able to choose its condition explicitly. Display Material and Condition separately when relevant; do not add irrelevant fields for every resin or alloy.

An unspecified condition should be explicit, such as Recommend a condition, only where Lattice supports that review path. Preserve the drawing requirement and never silently select a different temper. An exact-drawing/specification requirement must remain visible to admin review.

Provide a concise summary such as 6061 Aluminum · T651. Put UNS and material guidance in details. When a process is incompatible, explain the constraint and the next action without replacing the selection. Support mobile as a full-width selection sheet if the anchored list becomes too constrained.

For a sourcing request, retain the part/draft and carry entered requirements into the existing inquiry qualification workflow. Do not require buyers to re-enter the same material details in email. This extends the existing qualification process rather than treating unreviewed material names as automatically approved.

### Cross-page continuity

When the buyer has an active part, Use for this part returns to that part with the same reviewed material and condition. When starting from a resource page, Request a quote with this material preserves the selection through CAD upload. Multi-part requests should require deliberate application to each part; browsing must not silently replace a saved selection or update every line item.

## Copy and trust

Suggested shared explanation:

> Choose a material and condition. We’ll confirm sourcing, price, and lead time in your quote.

For a sourcing route:

> Tell us the grade and specification you need. We’ll review sourcing for this part.

For reference properties:

> Reference values for the stated condition and product form. Material certification is confirmed with your order requirements.

Keep the reference condition and source next to the numbers, legible at working text sizes. Do not manufacture reassurance by hiding unresolved identities or making unsupported inventory/certification promises.

## Implementation order and acceptance

1. Correct identity and membership inconsistencies: common cards versus directories, remaining approved aliases, generic/ambiguous entries, stable family IDs, condition relationships, and publication status.
2. Generate both selectable options and catalog content from the shared records. Preserve historical values and snapshot labels.
3. Align grade/condition selection and cross-page prefill; connect the existing sourcing inquiry to the current draft.
4. Refine hierarchy, text, picker accessibility and mobile behavior. Preserve familiar family browsing while improving known-grade search.

Before release, verify these customer tasks:

- Find a valid catalog grade such as 321 from quote configuration, with an explicit quote or sourcing path.
- Search 6061-T651, select it, browse its catalog detail, return, and see the same grade/condition on the same part.
- Search an approved alias and see one canonical result with no loss of condition or certification requirements.
- Find every featured/common grade in its full directory.
- Encounter an unavailable or process-incompatible choice and receive a clear action while the draft remains intact.
- Open an old RFQ and confirm its saved requirement is preserved; retired choices do not become new default selections.
- Complete the picker using keyboard and on a narrow viewport, with visible focus, readable labels, appropriate popup placement and no clipping.

Useful measures after implementation: material-search abandonment, no-result queries, catalog-to-RFQ completion, material-related support requests, and admin requests for clarification. These would validate the recommendations; this audit does not claim observed customer behavior.

## Source evidence

- `src/lib/customer-material-catalog.ts`: source union, current exclusions, family assignments and aluminum grouping.
- `src/lib/cnc-material-library.ts`, `src/lib/rfq-options.ts`, `src/lib/rfq-material-search.ts`: RFQ population and selection/search behavior.
- `src/lib/material-identity-registry.ts`: shared scoped name resolution; not a complete shared offering model.
- `src/lib/material-family-view-models.ts`: independently authored examples/featured grades, labels and overrides.
- `src/components/material-family-atlas.tsx`: active family atlas, descriptions and availability copy.
- `src/app/(workspace)/materials/[slug]/page.tsx`: current family-page hierarchy and featured rows.
- `src/components/material-grade-directory.tsx`, `src/lib/material-grade-properties.ts`: conditions, guidance, family-name branches and property lookups.
- `src/components/request-form.tsx`: active grouped picker; disabled search-first trial; no-results and keyboard behavior.
- `src/lib/rfq-manufacturing.ts`: current intake/finish compatibility validation.

Design references: [Nielsen Norman Group usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) for consistency and recognition; [W3C combobox guidance](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) for keyboard/focus semantics; [WCAG text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) for readable secondary text. These support the design criteria; the Lattice findings come from the local implementation and data.


## Implemented follow-up — October 19, 2026

User approved finding 2 (featured cards, examples and full directories generated from the same material records). Implemented a shared published-directory projection and catalog-bound featured selections. Family-card examples now use those canonical selections; absent curated grades are omitted, aluminum conditions are explicit and verified against directory conditions, and reference-property lookup matches the directory. This follow-up does not add missing materials or implement the broader RFQ selection redesign. Focused tests: 39 passed; TypeScript, targeted lint and whitespace checks passed. Local only.


### Approved follow-up — quote/sourcing coverage and Material/Condition controls

Implemented findings 1 and 3: every published grade/condition has a quote or sourcing action backed by a shared offering projection, with catalog-only requirements searchable from Configure. Quote links carry an exact variant or parent requiring condition into a new RFQ; source links prefill the existing inquiry. Sourcing from an active draft opens a separate tab. Parent alloy and Condition controls use the same projection; searching 6061-T651 sets both and persists the full requirement. Existing exact selections, old draft keys and submitted labels are retained. Distinct RFQ variants are not merged merely because a catalog lookup alias points to the same parent. Server validation rejects incomplete/source-only selections and derives metadata from known keys. Automated coverage includes every directory grade/condition, legacy selectable coverage, exact-temper search, keyboard selection, first CAD upload, draft restoration, server validation and both route handoffs. Authenticated browser review and deployment remain outstanding; this does not claim all catalog grades are confirmed available or process-compatible.
