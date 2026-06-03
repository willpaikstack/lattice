# Lattice Customer Quote Template

The editable source template served by **DOC-001 - Customer quote Excel template** is `resources/admin/lattice-os-zintilon-quote-template.xlsx`.

The preferred operating workflow is not to manually edit Excel for normal app-issued quotes. Enter quote data in the admin app first: unit prices, lead time, shipping cost, shipping method, shipping terms, quote dates, delivery date, and quote notes are captured in `/admin/quotes`. DOC-001 remains the editable source/reference template for shaping the final customer quote PDF format.

DOC-001 is intentionally a single-tab workbook named `Quote` so Excel's print/export behavior creates one continuous quote PDF. The sheet structure is:

- customer-facing quote header, prepared-for, ship-to, quote details, summary of order, line items, notes, totals, and manufacturing assumptions
- line-item table where `Process`, `Material`, and `Finish` appear as distinct lines inside `Part details`, with a separate `Production Region` column
- Fictiv-style summary band where `SUMMARY OF ORDER` and `ORDER TOTAL` appear on the same line
- General Terms and Conditions of Sale copied from the Hubs reference structure, with Hubs/Protolabs references replaced by Lattice/Lattice OS
- no separate Inputs, Terms, or Vendor Patterns tabs

The template is also connected to live RFQ data from the admin quote workflow. Each RFQ drawer in `/admin/quotes` includes an **Excel quote** download that generates `/admin/quotes/[requestId]/quote-template.xlsx` from the selected request. Once a customer quote has been saved, the same drawer also includes **Download quote PDF**, which generates `/admin/quotes/[requestId]/quote.pdf` for manual download. The generated workbook and PDF fill customer, RFQ, file, line-item, unit-price, lead-time, shipping, quote-date, validity, DFM note, and total fields from the app's request and latest saved customer quote data.

Editable quote cells in DOC-001 are highlighted pale yellow. Because DOC-001 is a formatting/source template, remove or restyle yellow input highlighting before sending a final customer PDF if needed.

Use this template after receiving customer designs/CAD files and completing manufacturability review. Replace bracketed placeholders before sending. The current customer quote format should follow the Fictiv-style structure most closely: branded header, prepared-for and ship-to blocks, quote details, summary of order, line items, notes, production assumptions, and acceptance/payment terms.

---

# Quote [QUOTE-NUMBER]

**Prepared for:** [Customer company]  
**Contact:** [Customer name, email]  
**Prepared by:** Lattice OS  
**RFQ / Project:** [Project name or RFQ title]  
**Quote date:** [Month DD, YYYY]  
**Quote valid until:** [Month DD, YYYY]  
**Estimated ship date:** [Month DD, YYYY or "TBD after purchase order"]  

## Summary

Thank you for sending the design package for [project / part family]. Based on the supplied files, quantities, materials, and requested requirements, Lattice can support the work as quoted below.

This quote includes:

- Manufacturing review of the supplied design files
- Procurement and production coordination through qualified manufacturing partners
- Inspection and shipment according to the assumptions listed below

## Design Package Reviewed

| File / Drawing | Revision | Notes |
| --- | --- | --- |
| [file-name.step] | [Rev A] | [Primary CAD model] |
| [drawing-name.pdf] | [Rev A] | [Critical dimensions and tolerances] |
| [additional-file] | [Revision] | [Notes] |

## Quote Line Items

| Item | Part Details | Production Region | Qty | Unit Price | Line Total |
| --- | --- | --- | ---: | ---: | ---: |
| 1 | [Part name]<br>Process: [CNC machining / sheet metal / fabrication]<br>Material: [Material]<br>Finish: [Finish] | [Overseas / Domestic] | [Qty] | $[0.00] | $[0.00] |
| 2 | [Part name]<br>Process: [Process]<br>Material: [Material]<br>Finish: [Finish] | [Production region] | [Qty] | $[0.00] | $[0.00] |

**Subtotal:** $[0.00]  
**Shipping estimate:** $[0.00 or "Billed at actual"]  
**Tax:** [Excluded unless explicitly listed / estimated at $0.00]  

## Total Quote

**Total:** $[0.00]

## Lead Time

Estimated production lead time is **[X-Y business days]** after all of the following are complete:

- Written quote acceptance
- 100% payment in advance
- Final CAD/drawing package confirmed for release
- Any open manufacturability questions resolved

Shipping transit time is not included unless stated above.

## Manufacturing Assumptions

This quote is based on the following assumptions:

- Customer-supplied CAD and drawings are complete and represent the latest revision.
- General tolerances: [e.g. +/- 0.005 in unless otherwise specified].
- Critical tolerances are only those explicitly called out on the drawing.
- Material certification: [Included / available on request / not included].
- Inspection: [Standard dimensional inspection / first article / CMM report].
- Finish and cosmetic requirements: [As specified / standard shop finish / not included].
- Packaging: [Standard protective packaging / customer-specific packaging].

## Open Questions / Clarifications

Before release to production, please confirm:

1. [Clarification needed]
2. [Clarification needed]
3. [Clarification needed]

If these items change the manufacturing scope, Lattice may revise the price or lead time before production starts.

## Exclusions

Unless explicitly listed above, this quote excludes:

- Design engineering or CAD redesign
- Formal quality documentation beyond the stated inspection package
- Expedited freight
- Import duties, taxes, tariffs, or customs fees
- Assembly, kitting, or post-processing not listed in the line items

## Acceptance

To accept this quote, reply with written approval and complete payment referencing **Quote [QUOTE-NUMBER]**. Standard payment terms are **100% Payment in Advance**.

Accepted by: _______________________________  
Company: _______________________________  
Date: _______________________________

## Lattice Notes

Internal notes not sent to customer:

- Supplier source: [Supplier / shop name]
- Supplier quoted cost: $[0.00]
- Target margin: [X%]
- Operator owner: [Name]
- Follow-up date: [Month DD, YYYY]

---

# Example Filled Quote

# Quote LQ-2026-0142

**Prepared for:** Apex Robotics  
**Contact:** Maya Chen, maya@apex.example  
**Prepared by:** Lattice OS  
**RFQ / Project:** Sensor Mount Bracket Pilot Run  
**Quote date:** May 26, 2026  
**Quote valid until:** June 9, 2026  
**Estimated ship date:** 12-15 business days after purchase order

## Summary

Thank you for sending the design package for the Sensor Mount Bracket pilot run. Based on the supplied CAD model, drawing, material callout, and quantity requirement, Lattice can support the work as quoted below.

## Design Package Reviewed

| File / Drawing | Revision | Notes |
| --- | --- | --- |
| sensor-mount-bracket.step | Rev B | Primary CAD model |
| sensor-mount-bracket-drawing.pdf | Rev B | Critical dimensions and tolerance callouts |

## Quote Line Items

| Item | Part Details | Production Region | Qty | Unit Price | Line Total |
| --- | --- | --- | ---: | ---: | ---: |
| 1 | Sensor Mount Bracket<br>Process: CNC machining<br>Material: 6061-T6 aluminum<br>Finish: Clear anodize | Overseas | 50 | $86.00 | $4,300.00 |
| 2 | Setup and programming<br>Process: CNC machining<br>Material: N/A<br>Finish: N/A | Overseas | 1 | $425.00 | $425.00 |

**Subtotal:** $4,725.00  
**Shipping estimate:** Billed at actual  
**Tax:** Excluded unless explicitly listed  

## Total Quote

**Total:** $4,725.00

## Lead Time

Estimated production lead time is **12-15 business days** after written quote acceptance, 100% payment in advance, and final design release.

## Manufacturing Assumptions

- General tolerances are +/- 0.005 in unless otherwise specified.
- Critical tolerances are limited to dimensions called out on the supplied drawing.
- Clear anodize is quoted as a standard commercial finish.
- Standard dimensional inspection is included.
- Material certification is available on request before production release.

## Open Questions / Clarifications

1. Please confirm whether material certification is required with shipment.
2. Please confirm whether the quoted pilot run should be packaged individually or bulk packed.

## Acceptance

To accept this quote, reply with written approval and complete payment referencing **Quote LQ-2026-0142**.
