# UNS verification and canonical update from supplied CSV

Date: October 19, 2026. Reviewed all 19 identifier-bearing proposals in the supplied `materials-missing-uns_1.csv`; 13 exact catalog references added, six conditional identities retained unresolved. Designation-system labels in the CSV are not UNS identifiers and were not imported as codes.

## Added identifiers

| Family | Catalog grade | UNS | Verification scope | Source |
|---|---|---|---|---|
| Aluminum | 1070 Aluminum | A91070 | AA 1070; do not rename or merge with 1070A. | [Reference](https://www.knight-group.co.uk/material/aluminium-wire/) |
| Aluminum | 2007 Aluminum | A92007 | Exact AA/EN AW-2007 reference; replaces the legacy missing-UNS placeholder. | [Reference](https://lipol-al.eu/alloys/en-aw-2007.html) |
| Aluminum | 2017 Aluminum | A92017 | AA 2017; T4 remains a separate condition; does not merge with 2017A. | [Reference](https://titanium.com/alloys/aluminum-alloys/aluminum-alloy-2017/) |
| Stainless steel | 303Sulf | S30300 | Sulfur-bearing Type 303; not the selenium-bearing 303Se grade. | [Reference](https://www.carpentertechnology.com/hubfs/7407324/Material%20Saftey%20Data%20Sheets/303.pdf) |
| Stainless steel | 309 | S30900 | Type 309, not 309S; UNS-only update. | [Reference](https://www.ulbrich.com/uploads/brochures/Ulbrich-Corporate-Brochure_Aug-2018.pdf) |
| Stainless steel | 347H | S34709 | 347H high-carbon identity; do not substitute ordinary 347. | [Reference](https://www.alleima.com/en/products/tube-pipe/tubular-products/reheater-tubes/) |
| Tool steel | ST TOOL M2 | T11302 | M2 high-speed tool-steel reference; original supplier label and selection key retained. | [Reference](https://www.carpentertechnology.com/hubfs/7407324/Material%20Saftey%20Data%20Sheets/M2%20.pdf) |
| Nickel & specialty alloys | Alloy X | N06002 | Supplier explicitly cross-references Alloy X and HASTELLOY X to N06002. | [Reference](https://www.knight-group.co.uk/wp-content/uploads/MS007-Knight-Group-Precision-Strip-Flyer.pdf) |
| Nickel & specialty alloys | Alloy R41 | N07041 | R-41 alloy identity; no supplier certification or brand provenance inferred. | [Reference](https://haynesintl.com/en/alloys/alloy-portfolio/high-temperature-alloys/haynes-r-41/) |
| Nickel & specialty alloys | Alloy S | N06635 | Producer identifies Alloy S as N06635 in cast and wrought reference listings. | [Reference](https://www.metaltek.com/alloy/specialty-alloys-severe-corrosion-and-heat-resistant-alloy-s/) |
| Magnesium / zinc alloys | AM60B | M10602 | ASTM B94 die-casting reference. CSV M10600 belongs to AM60A. Ingot form requires separate verification. | [Reference](https://standards.iteh.ai/catalog/standards/astm/d92b55de-13b7-49ef-a9ee-8a164f69d141/astm-b94-18) |
| Magnesium / zinc alloys | AZ31B | M11311 | Wrought AZ31B reference; no temper or mechanical properties inferred. | [Reference](https://standards.nasa.gov/sites/default/files/standards/MSFC/A/0/MSFC-STD-3029.pdf) |
| Magnesium / zinc alloys | AZ91D | M11916 | ASTM B94 die-casting reference; ingot form requires its own designation. | [Reference](https://standards.iteh.ai/catalog/standards/astm/d92b55de-13b7-49ef-a9ee-8a164f69d141/astm-b94-18) |

## Conditional identifiers not assigned

| Catalog entry | Reason |
|---|---|
| A413 Aluminum | A14130 is verified for A413.0 castings, but the catalog entry does not establish casting versus ingot form. |
| Nitronic 40 Stainless Steel | Producer lists S21900 and S21904; exact intended variant is not selected. |
| Steel 1045 / 45# | G10450 applies to SAE 1045; do not assign it to the bundled GB grade 45 requirement. |
| Invar | Generic name does not resolve K93601 versus K93603 or an exact procurement specification. |
| Zamak 3 | SAE J468 identifies Z33521 for ingot and Z33520 for die casting; CSV reverses those forms. Catalog form remains unspecified. |
| Zamak 5 / ASTM AC41A | CSV lists separate ingot/casting references; select applicable product form and standard edition before assigning one. |

Zamak source: [SAE J468](https://saemobilus.sae.org/standards/j468_198812-zinc-alloy-ingot-die-casting-compositions). ASTM editions can use different conventions; preserve the purchase-standard edition with form-specific reference data.

## Implementation

- Added exact family/grade records with source URLs and scope notes to `src/lib/material-uns-references.ts`; the reference lookup now contains 102 records.
- Verified canonical UNS overrides legacy N/A placeholders in the quote projection; exact-variant composition metadata retains its existing precedence.
- The catalog full directory and featured-card view models consume the same canonical UNS references.
- Existing sourcing eligibility, material values, aliases, tempers and historical RFQ data are unchanged. The UNS-only update does not import new chemistry or certify a supplier.
- TypeScript and scoped ESLint pass. No automated tests, authenticated browser review, push or deployment in this update.
