# Equipment page comparison — 2026-10-13

Scope: live `/equipment` and `/equipment-explorer` on localhost, desktop screenshots, equivalent Hermle C400 search and expanded specifications, original-page mobile layout, and source-code/documentation checks. This is a heuristic design review, not a machine capability certification or measured user study. No application changes.

## Recommendation

Retain the original page's compact comparison table as the desktop foundation, with the explorer's process navigation, source-qualified specifications, source disclosures and mobile cards. The original feels like a credible technical inventory and scans faster. The explorer improves interpretation and evidence but spends too much space on each record. Neither yet supports a complete drawing-based capability decision.

## Findings

1. **High — incorrect implied specification basis on the original.** Universal Positional accuracy (X/Y/Z) and Work envelope (X × Y × Z) headers relabel unlike claims. AFMING GMU-600 displays 600 × 910 mm under a three-axis heading; the source review found operation size and listed tolerance. For Hermle C400 the original shows only 850 × 700 × 500 mm and removes the separate rotary envelope even from expanded details. The explorer preserves the separate Ø650 × H500 mm five-axis envelope and the source label Best tolerance. These are materially different decision inputs.
2. **High — catalog count credibility.** Original header/category says 162 machine models while the unfiltered footer reports 150 matching models. Its 664 total sets is calculated by adding the first integer found in mixed quantity strings (including fleet and 30+ counts). The explorer consistently uses 150 records and avoids the misleading aggregate. Records are not necessarily unique models or individual machines.
3. **Medium — redundant navigation and introduction on the original.** Equipment and Equipment catalog introductions repeat the purpose. The sentence about photos being supporting record data sounds like internal implementation commentary. Process dropdown and equipment-type strip largely duplicate one another, with inconsistent terms and no EDM shortcut in the strip. The sheet-metal shortcut is clipped at the inspected desktop width.
4. **Medium — density regression in the explorer.** At the same desktop viewport, a collapsed Hermle C400 row measured 71px in the original and 168px in the explorer. The explorer therefore uses about 2.4 times the height per record. Repeated Network record footers, icons, labels and boxes add weight. Both designs put substantial controls ahead of the first machine.
5. **Medium — uneven process information.** Original inspection, manual and sheet-metal rows show only model/type and quantity. Known work/measurement ranges and forming capacity require expansion. The explorer surfaces more of this information, but generic Operating specification / Confirm during RFQ cells are often unhelpful. Show process-specific fields; mark an absent source value as Not listed, reserving RFQ review for the next action.
6. **Medium — mobile original requires sideways comparison.** At a requested 390px mobile viewport, model and sets are visible while precision, envelope and specification action are offscreen inside the scrolling table. The long introduction consumes the first screen. The explorer's stacked-card treatment is the better mobile pattern (also verified in its implementation session).
7. **Medium — evidence usability remains incomplete in the explorer.** Stable record IDs support internal source tracing, and public literature is more accurately described. However, customers cannot inspect the private originating document; a Network record label is not independent verification. The evidence block is too verbose and repeated per machine. A concise source-type label plus a sanitized excerpt, if approved and reviewed, would be stronger. Do not expose partner identities or imply current calibration/installed capability verification.
8. **Future — neither design is yet a full capability finder.** No comparable-axis sorting, shortlist comparison or material-specific capability filtering. Those require normalized source data; do not treat raw dimensions as automatic part-fit proof. The explorer's public-reference filter measures evidence availability, not manufacturing suitability, so it should be secondary.

## Proposed next iteration (not implemented)

- One concise heading/description and one process selector; retain the explorer's milling configuration control.
- Compact desktop table: Model & configuration | Documented working capacity | Precision and basis | Listed quantity | Specs & sources.
- Process-specific headers/values: separate rotary capacity for milling, documented diameter/length for turning, forming length/material limits where listed for sheet metal, measurement range/method for inspection.
- Source evidence and operating details in expandable rows; small source-basis labels next to potentially ambiguous claims.
- Mobile stacked cards, explicit missing data and a nearby drawing-review action.
- Reconcile counts and labels before visual polish. Keep both current pages until a combined version is explicitly approved.

Reference: IBM Carbon data-table guidelines support compact rows, column comparison, toolbar controls and progressive disclosure for supplementary data: https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines . The recommendation is an application-specific judgment based on the observed Lattice pages.
