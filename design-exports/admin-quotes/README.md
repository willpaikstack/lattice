# Quote submissions design options — 2026-10-07

Three concepts generated with built-in imagegen, using fictional records. These are design proposals; no app code, database records, or customer workspace behavior changed.

## Options

1. **Review queue** (`01-review-queue.png`): searchable RFQ table with a contextual inspector showing package completeness, supplier evidence, and customer quote state. Recommended for everyday triage and a gradual evolution of the current page.
2. **Workflow board** (`02-workflow-board.png`): RFQs grouped by their persisted operational status, with a selected record cockpit below. Best for seeing work distribution and clarification bottlenecks. Board navigation must not silently mutate status.
3. **Quotation workbench** (`03-quotation-workbench.png`): slim RFQ list, part requirements/files beside line pricing, and a persistent customer quote summary. Best for preparing multi-part quotes with fewer vertical jumps.

## Schema and workflow analysis

The queue's unit is a **Request (RFQ)**, not an individual part or supplier bid. A Request owns:

- `RequestLineItem[]`: part name, quantity, material, tolerance, finish, quality documentation, and notes.
- `UploadedFile[]`: CAD/drawing files, storage references, and CAD preview references. These files are RFQ-scoped; the schema does not explicitly relate each file to one part.
- `SupplierQuote[]`: shop, country, contact, invitation/received/declined/selected state, price, lead time, optional JSON line snapshots, and selection flag.
- `SupplierQuoteAttachment[]`: received supplier documents. Attachments are RFQ-scoped rather than explicitly linked to a SupplierQuote record.
- `CustomerQuoteVersion[]`: version/quote number, issued date, validity, customer/project snapshot, commercial terms, JSON line pricing, total, and generated document content.
- `StatusEvent[]`: status transition history.

Request-level fields include company/requester, process, optional requested due date and owner, completeness, internal/package notes, shipping/delivery, quote validity, and revision metadata. Database fields are not all exposed in the current quote drawer or necessarily in its client projection.

Persisted lifecycle: `DRAFT`, `SUBMITTED`, `NEEDS_INFO`, `READY_FOR_SUPPLIER_RFQ`, `QUOTED`, `PURCHASED`, `CLOSED`; archive is also a separate boolean. The quote queue excludes drafts and purchased records, exposes closed/archived records through Archive, and merges database/browser drafts in a separate section.

Current UI combines submitted/needs-info/supplier-ready records into **Quote Requested** and calls `QUOTED` **Quote Received**. That wording obscures the distinction between an incoming supplier quote and an issued customer quote. The concepts use explicit operational status and separate artifact indicators.

Current drawer workflow: attach supplier evidence and choose shop/country; review part requirements/files and enter unit prices/lead times; set shipping, validity, delivery, and customer note; explicitly issue the customer quote. Issued quotes open read-only with PDF access and explicit editing. Request information and No quote are separate decisions. Current issue action uses the same entered line prices for supplier and customer snapshots; an independently priced cost/margin model is not implemented.

## Implementation constraints and generated-image corrections

- Reuse the exact existing Lattice logo asset. Generated brand marks are illustrative and must not replace it. Retain the approved admin graphite/ivory/cobalt palette.
- **Supplier ready means ready to send to suppliers**, not that a supplier quote has arrived. Option 2's generated subtitle “Supplier quotes received” is inaccurate and must be corrected to “Ready to send to suppliers.” Received supplier evidence stays a separate indicator.
- Part-specific file chips suggest a contextual presentation; do not claim authoritative file-to-part relationships without adding or deriving a reliable association. Similarly, do not claim supplier attachments belong to an individual bid without an explicit association.
- Distinguish persisted statuses, completeness, supplier selection, and issued quote versions. Derived next-action hints are display logic, not new persisted lifecycle states.
- Due date is the requested RFQ due date, not an operator SLA. Missing owners/dates display as unassigned/not specified. Owner controls would require deliberate authorization/projection/action work.
- RFQ and customer quote identifiers are different; do not manufacture a customer quote number before issuance. Numbers, counts, dates, contacts, and record details in the mockups are fictional.
- Quote version history must use actual stored versions. Existing edit/reissue behavior must be reviewed before promising that every edit creates a new version.
- Option 3's pre-issue PDF preview is a proposed addition; current PDF access is for issued quotes. Do not imply unsent quote edits persist unless a draft-save feature is implemented.
- No invented cost/margin metrics, automated messages, new state transitions, or changes to the customer workspace.

Exact generation prompts are in `prompts.md`.
