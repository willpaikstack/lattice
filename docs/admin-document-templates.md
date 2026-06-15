# Lattice Admin Document Templates

Internal document templates are available from `/admin/resources`. This file is durable project context for AI agents working across machines; update it whenever a document ID, backing file, template structure, or workflow changes.

## Resource Map

| ID | Resource | App route | Backing file / generator | Purpose |
| --- | --- | --- | --- | --- |
| DOC-001 | Retired | Removed from `/admin/resources` on 2026-06-05 | Historical workbook: `resources/admin/lattice-os-zintilon-quote-template.xlsx` | Former editable one-sheet customer quote source. Keep only as historical/source material for request-specific workbook generation unless explicitly revived. |
| DOC-002 | Supplier purchase order PDF template and order-specific supplier PO | `/admin/resources/supplier-purchase-order-template`; `/admin/orders/[requestId]/supplier-purchase-order.pdf` | `src/lib/purchase-order-pdf.ts` | Supplier-facing PO PDF template and accepted-order supplier PO generator for releasing work to Chinese machine shops, with a separate supplier terms page. |
| DOC-003 | Domestic invoice PDF template | `/admin/resources/domestic-invoice-template` | `src/lib/invoice-pdf.ts` | Customer-facing invoice PDF template for accepted orders or billing milestones, with a separate remittance-instructions page. |
| DOC-004 | Customer quote PDF template - Rev 1 | `/admin/resources/quote-template` | `src/app/admin/resources/quote-template/route.ts` + `src/lib/quote-pdf.ts` | Frozen Rev 1 generated customer quote PDF template used by the admin quote workflow. |

Supporting quote references and brand assets:

- `resources/admin/quote-references/fictiv-quote-paik-042726-reference.pdf` - Fictiv quote reference; use as the primary style inspiration for quote spacing and structure.
- `resources/admin/brand/lattice-os-signature-banner.png` - Lattice OS banner asset used in quote/PDF branding experiments.
- `resources/admin/quote-pdf-template.pdf` - older static quote PDF reference retained as a historical artifact; DOC-004 now uses the live generated PDF route.
- `resources/admin/lattice-customer-quote-template.xlsx` - older generated four-sheet customer quote workbook retained as a historical/reference artifact.

## Customer Quote

DOC-001 retired on June 5, 2026. It is no longer displayed in `/admin/resources`, and `/admin/resources/customer-quote-template` has been removed.

Related app-generated quote artifacts:

- `/admin/quotes/[requestId]/quote-template.xlsx` generates a request-specific, data-connected Excel workbook from saved RFQ data. That route is separate from DOC-001.
- `/admin/quotes/[requestId]/quote.pdf` generates a manual-download customer quote PDF from the latest saved quote version.
- `/admin/resources/quote-template` is **DOC-004 Rev 1** and generates the frozen current customer quote PDF template from the same renderer used by the admin quote workflow. It downloads as `lattice-os-customer-quote-template-rev-1.pdf`.
- The old DOC-001 workbook file remains available to code as historical/source material where request-specific quote workbook generation still depends on it.

DOC-004 Rev 1 freeze:

- Approved on June 4, 2026.
- Visual direction: Hubs-inspired typography and color, embedded Arial/Arial Bold fallback fonts, dark slate text, blue email links, white sections, black hairline dividers, compact quote/production detail rows, and a Hubs-style General Terms closing address block. The visible top-left seller name and General Terms company name are Nexus Manufacturing Technologies, Inc. Shipping terms are stored in quote feedback but intentionally hidden from the customer PDF for now. Quote totals show `Sales Tax` calculated by default as 8.25% of the part-production subtotal, and the customer PDF does not show a separate tariffs/duties line.
- Treat future quote PDF design changes as Rev 2 or later unless William explicitly reopens Rev 1.

## Supplier Purchase Order

Download: **DOC-002 - Supplier purchase order PDF template**

Use after a domestic customer accepts a quote, the final CAD/drawing package is locked, and Lattice has selected the Chinese machine shop. This template is supplier-facing and should only include the manufacturing release information needed for the selected shop.

Primary PDF pages:

- `Supplier purchase order` - seller header, PO number/date, release date, required ship date, related quote, payment terms, supplier/factory, destination/consignee, manufacturing release details, line items, supplier prices, lead time, inspection documents, supplier notes, totals, and supplier instruction.
- `Supplier PO terms` - release checklist plus standard supplier-facing file control, change control, quality, nonconformance, confidentiality, payment release, and shipment language.

Preview and download:

- `/admin/resources` embeds DOC-002 in the same in-app PDF viewer pattern used by DOC-003 and DOC-004.
- `/admin/resources/supplier-purchase-order-template?preview=1` serves the PDF inline for browser preview.
- `/admin/resources/supplier-purchase-order-template` downloads `nexus-supplier-purchase-order-template.pdf`.
- `/admin/orders/[requestId]/supplier-purchase-order.pdf?preview=1` serves an order-specific supplier PO inline for purchased orders with a selected structured supplier quote.
- `/admin/orders/[requestId]/supplier-purchase-order.pdf` downloads `nexus-supplier-po-<order-reference>.pdf`.

Order-specific generation rules:

- The admin RFQ response drawer captures the selected Chinese shop quote details and per-line supplier quote structure used by the PO renderer.
- Supplier quote PDF attachments are source evidence only; they do not make an order-specific supplier PO ready without structured supplier line items.
- If a purchased order has no selected structured supplier quote, admin order detail shows `Supplier PO pending structured shop quote` and the PDF route returns not found instead of using customer quote prices.

Before sending, confirm the final CAD/drawing revision, quantity, material, finish, tolerance, inspection scope, packaging, shipment handoff, and any customer-approved DFM changes.

## Domestic Invoice

Download: **DOC-003 - Domestic invoice PDF template**

Use when Nexus bills a domestic machine shop or customer after PO acceptance, shipment milestone, or another agreed billing trigger. This template is customer-facing and should align with the accepted quote, customer PO, sales order/order record, shipment or milestone status, and remittance instructions. DOC-003 remains available as a generic resource-library template, and placed orders now have order-specific invoice routes:

- `/orders/[requestId]/invoice.pdf`
- `/admin/orders/[requestId]/invoice.pdf`
- `/supplier/orders/[requestId]/invoice.pdf`

Route behavior:

- Routes return a PDF only for `PURCHASED` requests.
- `?preview=1` serves the PDF inline for browser review.
- Without `?preview=1`, the same PDF downloads as an attachment.
- The current generated order invoice uses a stable order-derived invoice reference for repeatable rendering. Future accounting work should connect these routes to durable issued `Invoice` records and annual invoice numbers without creating duplicate invoice records on repeated downloads.

Primary PDF pages:

- `Invoice` - seller header, invoice ID/date, customer ID, payment terms, due date, quote number, customer PO, shipping terms, bill-to and ship-to blocks, line items, subtotal, shipping/freight, sales tax, amount paid, amount due, and payment note.
- `Remittance instructions` - ACH payment details, beneficiary, bank fields, remittance email, required payment references, and standard invoice terms.

Preview and download:

- `/admin/resources` embeds DOC-003 in the same in-app PDF viewer pattern used by DOC-004.
- `/admin/resources/domestic-invoice-template?preview=1` serves the PDF inline for browser preview.
- `/admin/resources/domestic-invoice-template` downloads `nexus-domestic-invoice-template.pdf`.

Reference invoices used for the current structure: a Protolabs-style invoice with compact invoice identifiers, bill-to/ship-to blocks, item table, subtotal/sales-tax/total, and lockbox remittance details; and a Fictiv-style two-page invoice with invoice identifiers, PO/sales-order fields, amount due, and a separate remittance-instructions page.

Before sending, verify the customer PO number, sales order/order reference, quote reference, shipping terms/Incoterms, billing and shipping addresses, payment terms, due date, tax treatment, remittance instructions, shipment or milestone status, and AP follow-up owner.
