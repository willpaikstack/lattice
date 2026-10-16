# Customer materials catalog deduplication audit — October 16, 2026

## Recommendation

Keep the current 12 customer-facing families, but do not present the current 307 family-directory entries as 307 distinct materials. Normalize repeated names into canonical material records, group conditions and verified equivalent designations under those records, and keep alternate spellings as search aliases. Treat the RFQ dropdown as the practical naming reference while fixing its remaining duplicate choices too.

Before claiming a material can be selected in a quote, align the directory with the RFQ options or clearly mark the family directory as broader reference coverage and route unsupported choices through **Request an unlisted material**. The RFQ dropdown has 114 raw options, of which 109 remain selectable after five alias options are hidden. This is much narrower than the 307 names shown across the Materials family directories.

## Evidence and scope

- Read-only review of the live Production `/materials` page in the open customer browser. It displays 12 family cards and their current counts/examples; no record or page content was changed.
- Source review of `customerMaterialCatalog`, `cncMaterialLibrary`, `vendorMaterialOfferings`, `materialFamilies`, `rfqMaterialOptions`, and the RFQ alias/search helper.
- Executed the source data locally to count the customer directory and list every grade by family. The 12 displayed family counts sum to 307 directory entries.
- Compared the active family directory with the 114-option RFQ catalog and its five hidden alias values. The quote selector is not a complete one-to-one catalog today, and its remaining naming inconsistencies are included below.

This is a nomenclature and presentation audit. It does not verify supplier stock, certifications, or technical equivalence. Any merge that depends on an alloy standard, certification, temper, resin formulation, or procurement capability needs a materials owner/source check before implementation.

## High-priority findings

| Priority | Finding | Recommendation |
| --- | --- | --- |
| High | Family-directory counts mix canonical grades, supplier spellings, generic family labels, conditions, and variants. For example, Plastics / polymers shows 86 grades, although several records are names for the same base resin. | Count canonical selectable material records. Put temper, condition, filled grade, certification, and other meaningful variants under the canonical record rather than counting aliases as separate materials. |
| High | The customer directory and RFQ dropdown disagree on what is selectable. The directory has 307 records, while the RFQ offers 109 selectable records after aliases are hidden. | Choose one canonical catalog contract and have the page and RFQ derive names/aliases from it. Until coverage is actually aligned, describe the page as reference coverage and do not imply every entry is quotable directly. |
| High | Alias cleanup in the RFQ selector is incomplete. The helper hides `SS 304`, `SS 316`, `Brass C360`, `Copper C110`, and `Bronze C932`, but records still retain their original aliases. It leaves near-duplicates such as `304 Stainless Steel` and `304/304L Stainless Steel`, and `316 Stainless Steel` and `316/316L Stainless Steel`. | Use one canonical choice per procurement requirement. Treat alternate labels as search terms. Keep a dual-certified 304/304L or 316/316L selection only if it is a deliberate, verifiable requirement distinct from ordering either grade. |
| High | The nickel-alloy and precision-alloy directories overlap. `Invar` and `Invar 36` occur in both families; the RFQ selector also has both `Invar` and `Invar 36`. Kovar occurs in both family directories. | Make Precision alloys the sole home for Invar/Kovar/soft-magnetic alloys. Use one Invar 36 record with `Invar` as an alias where source evidence supports that mapping. Keep Kovar once. |
| High | Plastics has the largest concentration of duplicate or overlapping names. | Consolidate high-confidence synonyms and create a small set of base resin records with meaningful formulation/grade variants. See family recommendations below. |

## Recommended canonicalization by family

| Family | Audit observations | Recommended presentation |
| --- | --- | --- |
| Aluminum — 21 offerings | The page already collapses multiple tempers into base designations such as 6061 Aluminum; the RFQ dropdown lists temper choices separately. 2017 and 2017A both appear in the directory and should not be merged without a standards check. | Keep the current one-offering-per-alloy approach. Show known tempers beneath each alloy and link to the precise condition in RFQ configuration. Resolve the count label to clarify that “offerings” groups temper choices. |
| Stainless steel — 53 grades | 304/304L and 316/316L are dual-grade labels beside 304/304L base choices and individual 304, 304L, 316, and 316L in the RFQ menu. The directory lists three 2205 names (`2205 Duplex Stainless Steel`, `Duplex 2205 / S31803`, `Duplex 2205 / S32205`). The RFQ list also carries 420 and 420C with the same UNS, but 420C may encode a meaningful carbon specification. 1.2085 is also listed under Tool steel. | Make one 304 record and one 316 record, with 304L/316L represented as distinct low-carbon grades or selectable conditions where the source specifies them. Keep dual certification explicit only when verified. Consolidate 2205 labels under one canonical 2205 entry with standards/UNS identities shown as verified attributes; don't silently conflate specifications. Review 420/420C and the 1.2085 family assignment before merging. |
| Mild steel — 24 grades | `Steel 1010` and `AISI 1010` are naming duplicates. `Steel 1045 / 45#` already combines common names. `1018S` needs verification against 1018 rather than automatic merging. | Use `AISI 1010` once and list `Steel 1010` as an alias. Keep distinct chemistry/specification grades distinct; flag 1018S for source review. Put A36 and A514 in structural steel subgroups rather than the catch-all group. |
| Brass — 5 grades | The RFQ already treats Brass C360 as an alias for Brass 360. Brass 260 is distinct. | Keep `Brass 360` and `Brass 260`; make C360 an alias. Retain generic Brass and H59/H62 only if current sourcing confirms they are separately meaningful customer choices. |
| Copper — 7 grades | `Copper C110` is an alias of RFQ `Copper 110` but remains the directory label. Copper 101 is distinct from C110. Bronze is nested on the Copper page even though the RFQ treats copper/brass/bronze as one family. | Use `Copper 110` with C110/red copper as reviewed aliases; keep Copper 101 separate. Put bronze and beryllium copper in an explicitly named copper-alloy subgroup or a Copper alloys family, not among elemental copper grades. |
| Alloy steel — 22 grades | `16MnCrS5` and `1.7139 / 16MnCrS5 Alloy Steel` appear to describe the same designation. The 1.7131 / 16MnCr5 grade is different and should remain separate. 4140 Annealed and 4140 Normalized are conditions rather than new base chemistries. `17-4PH H900 Steel` duplicates a grade/condition already shown under Stainless steel. | Consolidate the duplicate 16MnCrS5 name after source confirmation; preserve 16MnCr5 separately. Put 4140 conditions under one 4140 record. Keep 17-4 PH in Stainless steel with H900 as a condition; remove the cross-family duplicate. |
| Tool steel — 7 grades | The family includes 12L14, 1215, and 1.0718, described in the source group as free-machining bar stock, not tool steels. `1.2085` overlaps Stainless steel. | Move 12L14/1215/1.0718 to a free-machining steel subgroup under Mild/alloy steel, based on intended customer taxonomy. Resolve 1.2085 once to its source-verified primary family. Keep A2 and O1 distinct. |
| Titanium — 14 grades | The directory shows `Titanium` alongside Grades 1–4 and alloy grades. Generic Titanium is not a grade and can look like another purchasable material. Grade 5 and 6Al-4V are already combined. | Keep Grade 1–4 and named alloys. Rename any generic record to “Titanium — grade to drawing” and place it in an unlisted/specification-needed path rather than counting it as a grade. Keep Grade 5 / 6Al-4V together. |
| Inconel/Incoloy — 53 grades | The family includes Alloy 20 and Alloy 28 while its group is titled Inconel / Incoloy; these are separate families. Invar and Kovar overlap Precision alloys; `Invar` and `Invar 36` appear side by side. | Rename the family to Nickel alloys / superalloys, include nickel-based corrosion alloys such as Alloy 20 and 28 under an accurate subgroup, and move precision-alloy entries to Precision alloys. Preserve distinct Inconel, Incoloy, Monel, Hastelloy, and nickel grades. |
| Precision alloys — 7 grades | It repeats Invar, Invar 36, and Kovar from Inconel/Incoloy. | Keep Kovar, one Invar 36 record (with “Invar” alias if confirmed), and distinct 4J/1J grades here. |
| Magnesium / zinc alloys — 8 grades | The Magnesium subgroup currently includes Zamak 3 and Zamak 5 because its `/AM/i` matcher matches “Zamak”; the Zinc subgroup only contains ZN. Generic Magnesium and Zinc are families, not specific grades. | Correct the group classifier. Separate AZ/AM magnesium grades from Zamak zinc grades. Keep generic Magnesium/Zinc as “grade to drawing” request prompts or remove them from grade counts. |
| Plastics / polymers — 86 grades | Several obvious naming clusters appear: Acrylic / PMMA; PTFE / Teflon; UHMW / UHMW PE; Polycarbonate / PC; Polyethylene / PE; Polypropylene / PP; Nylon 6/6 / Nylon 66; multiple POM/acetal/Delrin names; and Ultem / PEI. Garolite G-10 / FR4 appears beside both G-10 and FR4. | Create canonical polymer records with aliases, then show meaningful resin/grade variants under each: POM-C vs POM-H; ESD/FDA/filled grades; Delrin 100 AF and glass-filled grades; PA6 vs PA66; filled PEEK; PEI/Ultem grade variants; and flame-rated FR4 vs G-10 where specifications differ. Never merge solely because a trade name and polymer family share a base chemistry. |

## RFQ catalog corrections to make alongside the page

1. Keep aliases out of the selectable rows but searchable. The existing helper is the right general pattern; extend it to cover verified aliases consistently across the customer directory and RFQ list.
2. Review and resolve the remaining paired labels: 304 vs 304/304L; 316 vs 316/316L; Invar vs Invar 36; 4340 vs E4340 naming; and all copper/brass/bronze aliases. Preserve distinct temper, heat treatment, carbon limits, and certification conditions.
3. Change customer display labels to one convention per family, such as designation first and material family second (`304 Stainless Steel`, `4140 Alloy Steel`, `Copper 110`). Keep abbreviations and vendor names searchable, not independently selectable.
4. Retain old stored RFQ values and historical quote labels. Any new canonical value/alias mapping must not rewrite existing customer selections or issued quotes.

## Suggested sequence

1. Establish the canonical record and alias contract, and resolve high-confidence duplicates in copper/brass/bronze, Invar/Kovar, and polymer names.
2. Fix cross-family placement and classifiers (17-4 PH, 1.2085, free-machining steels, Zamak).
3. Review stainless dual grades and 2205 naming with the procurement/material source before applying merges.
4. Align RFQ-selectable coverage with the Materials directory; update displayed counts only after canonical records are stable.
5. Preserve legacy values through an alias/display layer; do not migrate RFQs, quotes, or invoices as part of a catalog presentation cleanup.

No application changes or customer data edits were made in this audit.

## Stainless follow-through — October 16, 2026

Implemented locally: the stainless directory collapses `2205 Duplex Stainless Steel`, `Duplex 2205 / S31803`, and `Duplex 2205 / S32205` to one customer row; the row displays both UNS designations and explains that the governing spec must be confirmed during RFQ review. The common-grade profiles now match the directory labels `304/304L` and `316/316L`, and the directory displays their UNS designations. 420 and 420C remain separate pending source verification. `stainlessCatalogPresentationMode` in `src/lib/customer-material-catalog.ts` switches between normalized and original source-label presentation. No historical RFQ values were migrated. No automated tests or deployment were performed.
