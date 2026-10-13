# Equipment explorer — 2026-10-12

New authenticated route: `/equipment-explorer`. Keep `/equipment` intact. The new resource is directly below How Lattice works, including first introduction to a saved sidebar order. Later explicit user reordering remains respected.

## Design and behavior

Warm neutral Lattice shell, charcoal primary action, blue technical links, restrained slate specification panels. Six process entry points lead to a default technical directory with a desktop card alternative. Smaller screens use stacked cards. Model/control/specification search, milling configuration, listed-capacity and public-reference filters compose together. Twelve records per page, empty-state recovery, and inline specifications/evidence disclosures. RFQ links use the existing `/requests/new` flow.

The 150 browsable records comprise 76 milling, 11 turning, 10 sheet-metal, 2 EDM, 36 inspection and 15 supporting records. This uses the existing customer-visible population rather than claiming all 170 raw records are published. Counts describe records, which can represent fleets; there is no summed machine/set total or live-availability claim. No automatic part-fit or tolerance eligibility calculation is implied.

## Source of truth

`getEquipmentExplorerData()` is a server-only, explicit safe projection of the existing customer and vendor catalogs. Customer text continues through the shared privacy sanitizer. `EQ-` plus the first eight uppercase SHA-256 hex characters of the internal vendor equipment slug gives each record a stable customer-safe reference. Operators resolve that ID against `vendorEquipment`, then follow `source.sourceDocumentId` into `vendor-source-documents.ts` and its archived document. No supplier identity, source file path, internal source ID, review date, calibration record or internal serial number is serialized to the page. Public literature is limited to existing explicit technical-reference URLs; it is supplementary model literature, not proof of the installed configuration. Missing fields/references are shown honestly.

## Scoped source corrections

The new projection applies these corrections without modifying the original page or raw records. This was a targeted source-label/configuration review, not a complete certification of 150 machine records.

- `jucheng-precision-equipment-list-20260414`, page 1: table labels report machining tolerance and operation size. New labels are Listed tolerance and Operation size; two-number values remain two-dimensional, with no invented axis basis. The inspection entries use the same cautious operation-size wording. Haas 650 and Mazak 700 are explicitly listed as five-axis machines (rows 11–12), so this projection uses five-axis rather than the earlier imported three-axis label.
- `best-prototypes-equipment-list`, pages 1–2: CNC table headings distinguish X/Y/Z Axis Travel, Positioning Accuracy, and Repeatability. The new projection respects that separation. Non-milling entries with an ambiguous envelope are called Listed dimensions and excluded from the working-capacity filter; these may describe machine dimensions rather than usable part capacity.
- `zintilon-processing-equipment-statistics` (`zintilon-processing-equipment-list-20250812.pdf`), pages 1–2: Taichuan 640 combines two four-axis machines and eight three-axis machines, so it is identified as a mixed fleet and excluded from a single-configuration filter. Tongzhen Taizhen 850 (row 24) and Jingdiao JDHGT400T (row 28) are in the three-axis group and use that classification here.

The legacy catalog retains other imported claims whose original measurement basis has not been exhaustively revalidated. Per-job review remains necessary, especially for rotary clearance, fixturing, tool access and finished-part tolerances. Extend the source audit before describing the catalog as independently verified.

## Validation

- Focused source projection, privacy, filter, interaction, route access, proxy and legacy equipment tests: 24 passed.
- Saved sidebar placement test: passed. Full sidebar test run: 26 passed; one pre-existing Request Quote CTA test expects old white-button classes while current code uses charcoal. This task did not change that CTA.
- Typecheck and scoped ESLint passed.
- Browser: inspected desktop directory/cards and mobile stacked specifications/source disclosure at a 390px requested viewport (375px document content width). No horizontal document overflow in the mobile check. Hermle C400 retains separate three-axis and five-axis envelopes and links its existing technical PDF with a configuration caveat.
- No deployment; no RFQ submitted; no changes to the original equipment page or equipment source catalog.
