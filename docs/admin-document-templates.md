# Lattice Admin Document Templates

Internal document templates are available from `/admin/resources`. This file is durable project context for AI agents working across machines; update it whenever a document ID, backing file, template structure, or workflow changes.

## Resource Map

| ID | Resource | App route | Backing file / generator | Purpose |
| --- | --- | --- | --- | --- |
| DOC-001 | Customer quote Excel template | `/admin/resources/customer-quote-template` | `resources/admin/lattice-os-zintilon-quote-template.xlsx` | Editable one-sheet customer quote source meant to export/print as one continuous PDF. |
| DOC-002 | Supplier purchase order template | `/admin/resources/supplier-purchase-order-template` | `src/lib/admin-document-templates.ts` | Supplier-facing PO workbook for releasing accepted work to Chinese machine shops. |
| DOC-003 | Domestic invoice template | `/admin/resources/domestic-invoice-template` | `src/lib/admin-document-templates.ts` | Customer-facing invoice workbook for accepted orders or billing milestones. |
| DOC-004 | Quote PDF template/reference | `/admin/resources/quote-template` | `resources/admin/quote-pdf-template.pdf` | Reference PDF layout used while shaping Lattice quote output. |

Supporting quote references and brand assets:

- `resources/admin/quote-references/fictiv-quote-paik-042726-reference.pdf` - Fictiv quote reference; use as the primary style inspiration for quote spacing and structure.
- `resources/admin/brand/lattice-os-signature-banner.png` - Lattice OS banner asset used in quote/PDF branding experiments.
- `resources/admin/lattice-customer-quote-template.xlsx` - older generated four-sheet customer quote workbook retained as a historical/reference artifact, not the current DOC-001 download.

## Customer Quote

Download: **DOC-001 - Customer quote Excel template**

Use after reviewing the RFQ, supplier quote basis, manufacturability notes, logistics, and customer-facing assumptions. Commercial inputs should normally be entered in `/admin/quotes`; DOC-001 is the editable source/reference template for the customer quote PDF format.

Primary sheet:

- `Quote` - single continuous customer quote sheet with the quote header, line items, notes, totals, manufacturing assumptions, and General Terms and Conditions of Sale. It is intentionally one tab so Excel can export one continuous PDF.

Current DOC-001 requirements:

- The workbook must have one tab only: `Quote`.
- The top of the sheet contains the customer quote: Lattice OS header, address, `mfg@latticeos.co`, prepared-for, ship-to, quote details, summary of order, line items, notes, totals, manufacturing assumptions, and acceptance language.
- The `SUMMARY OF ORDER` band should include `ORDER TOTAL` on the same line, Fictiv-style.
- Line items should not have separate `Process`, `Material`, or `Finish` columns. Those values belong inside the `Part details` cell as distinct lines: part/file package, `Process:`, `Material:`, and `Finish:`.
- Line items should include a `Production Region` column.
- The totals box should include part production subtotal, shipping, tax, tariffs/duties, and order total. Do not include an `Engineering / setup` row unless William explicitly re-adds it.
- The bottom of the same sheet contains **General Terms and Conditions of Sale** copied from the Hubs reference structure.
- Replace any Hubs or Protolabs references with Lattice/Lattice OS. The current legal/contact identity is Lattice OS, `169 Madison Ave, #17525 New York, NY 10016`, `mfg@latticeos.co`.
- Remove the table of contents from the General Terms section.
- Do not put General Terms on a separate tab; the goal is a single continuous Excel-to-PDF export.
- DOC-001 currently downloads as `lattice-os-customer-quote-template.xlsx`.

Related app-generated quote artifacts:

- `/admin/quotes/[requestId]/quote-template.xlsx` generates a request-specific, data-connected Excel workbook from saved RFQ data. That route is separate from DOC-001.
- `/admin/quotes/[requestId]/quote.pdf` generates a manual-download customer quote PDF from the latest saved quote version.
- DOC-001 is the human-editable design/source template; the app-generated routes are operational outputs.

## Supplier Purchase Order

Download: **DOC-002 - Supplier purchase order template**

Use after a domestic customer accepts a quote, the final CAD/drawing package is locked, and Lattice has selected the Chinese machine shop. This template is supplier-facing and should only include the manufacturing release information needed for the selected shop.

Primary sheets:

- `Supplier PO` - PO number, supplier contact, related customer quote, shipping terms, payment terms, release date, line items, supplier prices, lead time, inspection documents, supplier notes, totals, and release checklist. Yellow cells indicate internal operator input areas.
- `Supplier Terms` - standard supplier-facing file control, change control, quality, nonconformance, confidentiality, payment release, and shipment language.

Before sending, confirm the final CAD/drawing revision, quantity, material, finish, tolerance, inspection scope, packaging, shipment handoff, and any customer-approved DFM changes.

## Domestic Invoice

Download: **DOC-003 - Domestic invoice template**

Use when Lattice bills a domestic machine shop or customer after PO acceptance, shipment milestone, or another agreed billing trigger. This template is customer-facing and should align with the accepted quote, customer PO, and order record.

Primary sheets:

- `Invoice` - invoice number, bill-to contact, customer PO number, related quote/order, payment terms, remittance instructions, line items, tax treatment, freight, tariffs/duties, sales tax, and amount due. Yellow cells indicate internal input areas and should be removed or avoided on final customer-delivered invoice exports.
- `Invoice Terms` - standard payment, scope, tax/duty, dispute, late payment, and confidentiality language.

Before sending, verify the customer PO number, quote/order reference, billing address, payment terms, tax treatment, shipment or milestone status, and AP follow-up owner.
