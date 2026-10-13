# Materials design audit and alternatives

Date: 2026-10-10. Status: design proposal; no product implementation or deployment.

## Recommendation

Use a technical materials catalog as the primary working experience, with the current family atlas retained as a browse mode. Credibility should come from consistent grade naming, readable conditions, named reference sources, and an honest distinction between catalog coverage and confirmed supply. Reduce decorative imagery and move useful selection information higher on the page.

The recommended direction is concept B. Concept A is a smaller visual refresh compatible with the existing family-first approach. Concept C is a later comparison feature, not a prerequisite for improving the catalog.

## Scope and evidence

Reviewed the running local app as an authenticated Lattice Admin operating the customer workspace: `/materials`, Aluminum, Stainless steel, Plastics / polymers, and `/materials/inquiry`. Inspected the shared family-card, family-guide, directory, polymer disclosure, and data/view-model code that drives all families, plus the existing `/materials/design-directions` source. Sampled desktop at 1440 × 1000, the default intermediate viewport, and mobile at 390 × 844. Confirmed the Aluminum T5/T6 selector updates property values and its source link; opened polymer behavior details. No inquiry was submitted.

This is a heuristic design audit, not customer research, a full accessibility certification, or proof of Production parity. The remaining family guides share the audited template but were not each exercised in the browser. RFQ and quality-documentation integration was assessed from repository context and navigation, not a new end-to-end transaction.

Primary evidence files:

- `src/components/material-family-catalog.tsx`
- `src/app/(workspace)/materials/[slug]/page.tsx`
- `src/components/material-grade-directory.tsx`
- `src/components/plastic-functional-profile.tsx`
- `src/lib/material-family-view-models.ts`
- `src/app/(workspace)/materials/inquiry/page.tsx`
- `src/app/(workspace)/materials/design-directions/page.tsx`
- `docs/material-mechanical-property-coverage.md`
- `docs/material-machinability-coverage.md`

## What already works

- The light customer shell, restrained borders, and consistent family layout give the section a calm starting point.
- Family cards are full-card links with keyboard focus styling, and family pages have breadcrumbs and a jump to all grades.
- Aluminum groups conditions under an offering, and changing a condition updates the reference and citation.
- The directory qualifies availability by condition, form, dimensions, quantity, and documentation.
- Reference values have caveats and citations; unsupported data is intentionally withheld rather than fabricated.
- Polymer functional traits avoid presenting one generic mechanical-property table as authoritative for every resin.
- The unlisted-material form explains supplier qualification and follow-up clearly.
- Supplier identity and internal provenance remain outside the customer catalog.

## Findings and suggested changes

| Priority | Finding | Usability / credibility effect | Suggested change |
| --- | --- | --- | --- |
| High | No grade search or direct lookup in the active atlas or family directory. | A buyer with a drawing callout must know its family and expand groups to find it. | Add grade lookup by canonical name, known alias, and verified UNS. Keep family browsing as an alternate mode. Search a designation only when the mapping is documented; do not imply standard equivalence. |
| High | The existing unlisted-material inquiry has no entry point in the active atlas or family guides. The atlas test explicitly expects its absence. | A catalog dead end conceals a useful qualification workflow. | Add a quiet `Request an unlisted material` link near the catalog heading and in empty search results. Retain the existing dedicated form. |
| High | Important reference labels and caveats are 10–11 px and pale gray. | The qualification needed to understand the numbers is less legible than the numbers themselves. | Use 13–14 px secondary/reference text, 14–16 px working content, and stronger contrast. Keep condition, source, and reference status visually attached to every property set. |
| High | Featured cards and canonical directory rows diverge. Stainless featured grades are `304` / `316`, while the directory offers `304/304L` / `316/316L`; some directory entries say `Designation as listed` where featured cards show UNS. PTFE is Fair in featured content but Difficult in the directory. | The same page can appear to disagree with itself, undermining technical trust. | Generate both views from one canonical grade/condition record. Show dual-certified designations consistently. Do not fill identifier gaps without a verified mapping. Reconcile rating differences using the stated condition and source. |
| Medium | Large family hero images precede all working content. Mobile featured rows also begin with large images. | A buyer scrolls through illustration before reaching grades and conditions. | Replace the family hero with a small optional swatch or thumbnail beside a compact introduction. Put the grade list and local navigation above the fold. Use images as illustrative material context, with no implication of actual inventory or completed Lattice work. |
| Medium | Family cards reserve substantial space for only a name, count, and small grade chips. Chips look like controls but navigate only through the whole card. | Space is underused and the next action is ambiguous. | Add one concise use-oriented family descriptor and an explicit `Explore family` affordance. Treat examples as plain text; use compact card heights and smaller texture strips. |
| Medium | Common grades and all grades repeat similar material information in different layouts. Aluminum pre-expands 6063 even though 6061 is the featured common starting point. | Users must interpret two hierarchies and an arbitrary initial selection. | Fold common grades into the main directory as a curated quick-access rail or filter. Open a detail only after selection, a deep link, or a deliberate remembered user choice. |
| Medium | Five-segment machinability bars translate three qualitative levels into a seemingly numerical rating without a scale explanation. | `4/5` can look like measured engineering performance. | Use text labels Good / Fair / Difficult with a short definition and condition note. Explain that they are qualitative machining guidance. Avoid star ratings and score bars. |
| Medium | Repeated generic application text makes adjacent directory rows hard to distinguish. | Many rows occupy space without helping a buyer choose. | Show concise, grade-specific differences where curated. Label family-level guidance honestly and keep it in the group header; do not invent grade-specific benefits. |
| Medium | Mobile rows stack many secondary fields; behavior controls are small, and the compact navigation conceals resource links beyond the initially visible items. | Browsing and returning to Materials require more effort on a narrow screen. | Mobile summary rows should lead with designation, condition, and one decision signal; open full details on a dedicated sheet/page. Provide an obvious Resources/menu entry and a local family selector. Use comfortable touch areas and visible focus. |
| Medium | Missing data is often communicated with a dash, and the polymer unspecified branch contains the literal encoding artifact `â€”`. | Missing information can look like broken content or an unnoticed zero. | Use `Reference not yet sourced`, `Not published by this source`, or `Confirm during RFQ` according to the actual reason. Correct the encoding artifact when implementing. |

### Readability evidence

Calculated contrast from the explicitly authored foreground/background colors in featured white cards:

| Text color on white | Contrast | Current use |
| --- | ---: | --- |
| `#919397` | 3.08:1 | Reference caveat |
| `#898b8f` | 3.41:1 | Reference condition |
| `#85878b` | 3.60:1 | Property labels |
| `#77797c` | 4.37:1 | UNS metadata |

These are below the 4.5:1 minimum for normal-size text. The requirement is documented in [W3C WCAG 2.2 contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum). This calculation concerns the specific authored pairs, not every element in the app. Recommended 44 px touch areas are a usability design target; they are not a claim that WCAG requires every target to be 44 px.

## Proposed information hierarchy

1. Materials heading, one sentence explaining coverage, and the unlisted-material link.
2. Browse families / Grade catalog modes, with grade lookup in the catalog mode.
3. Compact family, condition, and form filters. Expose only fields the current dataset can support; `Common forms` are guidance, not live stock filters.
4. A scannable grade list showing canonical designation, verified identifier, listed conditions, common forms, and qualitative machinability.
5. Selected-grade details with use, tradeoffs, condition selection, reference properties, named source, and documentation guidance.
6. The existing workspace Request Quote action. Material-prefill or row-level RFQ actions are optional future work and would change the current CAD-first navigation contract.

On mobile, open the selected grade as a full-width detail view rather than compressing a desktop inspector into a narrow column. Retain search/filter state and restore list position on return. Comparison, if introduced later, should show at most three selected materials with a deliberate condition for each.

## Credibility rules

- Catalog counts describe normalized offerings/grades, not inventory. Avoid a combined headline count until the mixed offering/grade unit has been explained.
- Never infer `In stock`, `Certified`, `Recurring availability`, or document readiness from a family name. Those require operational evidence.
- State `Availability confirmed during RFQ` near the list, not only below the featured content.
- Distinguish a listed supplier condition from a public reference condition. Exact material/condition/form and requested certificates are confirmed during RFQ.
- Public reference literature is not a mill certificate. Make named links readable, and prefer an exact referenced document when one is available over a generic search destination.
- Keep internal supplier identities/provenance private. Customer credibility can use designation, condition, public reference, and a clear confirmation process.
- Preserve the polymer functional-selection approach; do not introduce invented numeric polymer properties.
- Preserve the official Lattice mark in implementation. Generated mockups may approximate the mark and are not logo assets.

The existing `/materials/design-directions` prototype includes heuristically assigned stock/sourcing posture and assurance copy. It is an older exploration, not a reliable source of operational claims; do not promote those badges into the product without supporting data.

## Alternative templates

| Concept | Design | Best fit | Tradeoff |
| --- | --- | --- | --- |
| A — Refined family atlas | Compact family cards, one use-oriented descriptor, plain grade examples, small swatches, explicit navigation, and an unlisted-material link. | Smallest refresh; buyers who browse by family. | Known-grade lookup still takes more effort. Retains the prior no-search atlas decision. |
| B — Technical materials catalog (recommended) | Grade lookup, browse/catalog modes, compact filters, aligned grade list, and a selected-grade inspector with condition and source. | Frequent engineering/procurement use; buyers arrive with a drawing callout. | Adds search/filter behavior and requires agreement to revise the no-search decision. Needs curated fields and responsive detail behavior. |
| C — Comparison workbench | Up to three explicit grade/condition selections, aligned use/form/tradeoff/source rows, and readable reference caveats. | Buyers choosing between plausible alternatives. | A new feature with more state and data-normalization work; implement after the core catalog. Never declare a best material from generic properties. |

Image-generation prompts and saved concept paths are in `materials-design-2026-10-10/prompts.md`. These raster images are visual proposals, not interactive templates or verified technical data. Their text/counts/identifiers require checking against canonical application data before implementation.

## Suggested sequence and validation

1. Correct the readability, encoding, canonical-name/rating inconsistencies, and inquiry discoverability. Reduce hero imagery; retain the existing customer shell.
2. Build a reviewable concept-B prototype after the direction is selected. Keep the atlas available and use the existing canonical catalog, not mockup text, for data.
3. Add comparison only after task testing supports the need.

For a prototype, test representative buyer tasks: find 6061 and review T6 versus T651; find 316/316L from either alias; find a grade hidden in a closed group; inspect a record with no sourced reference; review a polymer's behavior; reach the unlisted inquiry; return from a mobile detail without losing context. Observe completion, wrong selections, and hesitation with a few actual buyers; no performance gains have been measured in this audit. Check keyboard focus, screen-reader control names, contrast, touch areas, and 390 px layout. Do not submit live inquiries or RFQs as design verification.

## Decision status

No design direction has been approved. B proposes changing the 2026-08-11 no-search atlas decision; A preserves it. The shared workspace quote action, CAD-first RFQ flow, supplier privacy, and reference-data limitations remain the current contract. No application behavior changed in this audit.
