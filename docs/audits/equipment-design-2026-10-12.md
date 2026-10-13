# Equipment page audit and design proposals

Date: 2026-10-12. Status: proposals for William's review. No application implementation, data changes, or deployment.

## Recommendation

Choose **Technical directory**: preserve the table as the working surface, shorten the introduction, use one process selector, and attach each specification's claim basis to its value. This best matches Lattice's customer operations console and machine-shop comparison tasks. **Process atlas** provides an alternative that closely echoes the approved Materials overview. **Specification workbench** makes detailed record review easier at the cost of reducing simultaneous comparison.

The three interactive concepts use the existing customer palette: warm neutral canvas, white content surfaces, charcoal Request Quote action, dark headings, restrained blue links, and compact gray-blue reference notes. They are design previews containing eight selected catalog examples, not a replacement catalog or new product routes. The mark/sidebar are approximations; implementation must reuse the actual shared shell and official logo. ImageGen was unnecessary for these information-layout proposals; generated machine imagery would not improve technical evidence.

The portable preview source is [concepts.html](equipment-design-2026-10-12/concepts.html), an inline Visualize fragment rather than a Next.js page. Show it through Visualize or wrap it with that skill's renderer for browser review; the host supplies the variant carousel and Lucide icons. It includes no API calls or external writes. Initial examples are CNC Milling; process choices show additional sampled records. Full catalog counts are context, not a claim that the preview renders all records.

## Scope and evidence

Inspected the running authenticated local `/equipment` page and the Materials overview, plus `equipment/page.tsx`, `equipment/equipment-catalog.tsx`, `customer-equipment.ts`, `vendor-equipment.ts`, the equipment page tests, `material-family-atlas.tsx`, shared shell source, repository memory, and prior equipment work history. Reviewed desktop appearance and the current control/row structure. This is a heuristic audit, not user research, an independent validation of supplier specifications, or proof of Production parity. The current application was not tested as a genuine customer or at mobile width; the proposed previews were checked separately for responsive behavior.

## Research and compatible styles

- **Enterprise technical directory:** [IBM Carbon data-table guidance](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) supports a unified toolbar, readable rows, progressive disclosure, and enough width for dense comparisons. Adopt the interaction structure and disciplined spacing within Lattice's existing palette rather than replacing its visual identity with Carbon.
- **Catalog / atlas:** the locally approved Materials overview establishes an app-native pattern: compact family cards, concise purpose descriptions, visible coverage counts, blue browse links, and a qualification note. Applied to equipment, process-level cards can orient a buyer before showing specific machine records. They should not become a 150-card machine gallery.
- **List and specification panel:** [Nielsen Norman Group's workplace table research](https://www.nngroup.com/articles/data-tables/) supports adjacent comparison values, visible filtering, and a nonmodal detail panel for a full record. A specification panel can show the selected machine without repeatedly expanding and lengthening the catalog. It prioritizes inspection of one record over comparing many records.
- **Manufacturer specification conventions:** [Haas VS-3-5AX product information](https://haascnc.com/machines/vertical-mills/extra-large-vmc/models/vs-3-5ax) distinguishes model-specific travel/capacity and notes that options may change specifications. The design implication is to show exact field labels and units, distinguishing machine travel from confirmed part fit. This is a presentation reference, not validation of Lattice's supplier fleet or a recommendation to buy machinery.

These sources inform design judgment; they do not establish that any proposed layout improves conversion or customer trust without validation.

## Findings

| Priority | Evidence | Recommendation |
| --- | --- | --- |
| High | Unfiltered headline says 162 machine models while rendered groups total 150 matching models (76 milling, 11 lathe, 36 QC, 15 manual, 10 sheet metal, 2 EDM). Headline counts customer-visible records before grouping into `equipmentSections`. | Derive headline and filter counts from the same displayed population. Use “catalog records” until unique-model identity is reconciled; some entries are fleets and names/aliases repeat. |
| High | `totalSets` adds the first numeric substring of each quantity string. Data includes descriptions such as `30+ sets`, `16 instruments`, and fleets without a numeric count. | Omit the 664 aggregate until quantities have typed units, fleet handling, lower-bound semantics, and deduplication. Counts are network coverage, not current machine availability. |
| High | Any detail label matching tolerance/accuracy becomes “Positional accuracy (X/Y/Z)”. Hermle/Makino source labels say `Best tolerance`, while Baoling says `Machining accuracy`. | Preserve those distinctions and show “Supplier reported.” A machining tolerance claim does not establish axis positioning accuracy or a guaranteed finished-part tolerance. |
| High | Table envelope extraction takes the first matching field. Hermle C400 lists separate 3-axis and 5-axis envelopes. AFMING GMU-600 shows two dimensions beneath the generic X × Y × Z header; turning entries include diameter-only values. | Use “Reported envelope” with the exact basis next to the value. Show all documented envelope variants in details. Do not invent missing dimensions or infer permissible part size. |
| Medium | Process dropdown and equipment-type rail mostly select the same category and can intersect into an accidental empty result. Rail omits an EDM shortcut while EDM appears in the dropdown/table. | Use one process selector or one complete process navigation. New axis/control/numeric filters require a reliable normalized field first. |
| Medium | “Equipment” and “Equipment catalog” each have an introduction; photo-preservation commentary takes space above working content despite no active photo UI. | One heading, one useful introduction, then a compact RFQ qualification note and the working controls. Keep preservation details in internal documentation. |
| Medium | Table rows truncate long model names and technical values. Accuracy conditions such as “per 300 mm” can be lost from the visible scan. | Wrap names and conditions; align numeric values with tabular figures; retain units and claim basis. Prefer compact, legible rows over truncation. |
| Medium | Current QC/manual/sheet-metal schemas are appropriately simpler; the main table has an 800px minimum width. | Preserve category-specific columns. On phones use labeled record summaries with expandable details or a full-width detail view. Avoid making customers pan across every record. Current mobile behavior needs a separate live check. |
| Medium | Source records and photos retain internal provenance while the active client deliberately excludes supplier identities. Earlier memory describes a card/photograph workflow that no longer matches the active table. | Keep provenance private. If photos return, retain actual/same-model/representative labels and exact-model specification links. Audit proposes no supplier badges, verification seals, calibration claims, or live-availability status. |

## Alternatives and proposed behavior

### Technical directory — recommended

One heading; compact qualification banner; accurate coverage count; search and a single process selector; full-width category-specific table. Model/type identify the record, followed by reported envelope, precision claim, and sets for machining categories. Each numeric claim retains a basis label. Row disclosure shows RPM, control, other documented envelopes, and exact-model references where present. Name sorting and a pinned table header are useful implementation candidates; numeric sorting must wait for normalized values. Preview includes search, process switching, and specification disclosure.

Smallest visual/interaction change. Strongest support for scanning and comparison. It should preserve the established CAD-first Request Quote entry point; machine selection must not promise a specific manufacturing route.

### Process atlas

Six compact process cards show current displayed record counts and purpose descriptions, followed by the selected process's directory. Styling mirrors Materials without requiring machine photographs. Preview cards switch the directory excerpt in place; a production route or section-navigation decision remains unapproved. Good for learning network breadth, but slower when a buyer already knows the model and needs direct lookup. Consider as an optional browse mode rather than an obligatory first step.

### Specification workbench

Search/process toolbar; compact machine list; nonmodal specification panel. Selection displays known machine fields, with separate 3-/5-axis envelopes when available and the supplier-reported claim label. At narrow widths the list and detail stack; production should preserve list position/search when moving to a full-width detail view. Preview switches records and supports search/empty/reset states. Good for careful inspection, but fewer records can be compared simultaneously. No multi-machine comparison or saved shortlist is proposed in this first pass.

## Data boundaries and follow-through

The current customer projection already supplies names, quantities, section, summaries, details, exact-model reference links, and photo classifications. Layout changes can use those fields. Reliable precision/envelope sorting, “fits my part” filters, availability badges, machine reservations, certificates, and automatic route selection require additional structured data or operational evidence and are outside these proposals.

Review a design before editing the app. Then reconcile counts and technical labels, implement the approved layout, and verify keyboard/focus behavior, genuine customer privacy, empty/reset states, mobile record reading, exact-model references, and preservation of all equipment data. Update the feature map when behavior actually changes. No design decision has been approved in this session.

Preview validation: script syntax checked; desktop directory disclosure, atlas process selection, and carousel changes exercised; directory summaries visually checked at 390px and 320px. Workbench selection/search/empty/reset were checked in the local preview. Viewport overrides were restored. These are preview checks, not application tests or accessibility certification.
