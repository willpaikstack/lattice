# Admin RFQ detail and database synchronization — 2026-10-13

## Scope and evidence

The configured Development database is the source for Quote Submissions and its new `/admin/quotes/[requestId]` page. A read-only inspection found one submitted RFQ, `rfq_c3020521d15d95737b53d3a1a33cfaaf1cbaf93a`, containing two parts and three files. The old administrative list mixed database records with local mock/demo data. The detail path had no page component, and the workbench deliberately ignored existing file-to-part associations.

The queue now lists only non-demo database requests, including locally; it does not merge `.data` RFQs or browser drafts. Database failure surfaces a retryable error instead of an alternate record source. Strict database reads/writes apply to submission API persistence/idempotency lookup, admin issuance and decisions, and supplier-evidence metadata. Development-only repository fallback remains available to explicitly local test/mock workflows outside these administrative entry points. Nothing was bulk deleted or migrated.

New RFQ links open the dedicated detail route. Legacy `?requestId=…` review URLs redirect there; `view=quote` and decision links retain the existing quotation workbench. A nonexistent database RFQ returns not-found, while database access errors reach the retryable route error boundary. Read-only queue/detail views refresh on focus and every 30 seconds while visible; workbench edits are excluded from this polling.

## Schema mapping

| Persisted source | Operator presentation |
| --- | --- |
| `Request.id`, `title`, `status`, `createdAt`, `updatedAt` | Full request identity, title, status and timestamps. |
| `Request.buyerCompanyId` / `buyerCompany` relation | Company context; genuinely unassigned records stay unassigned. Broken name-guessed customer-profile links are omitted. |
| `Request.requester*`, `shipTo*` | Saved requester/contact/delivery snapshot, never invented from the current operator account. |
| `Request.intakeDeclaration` JSON | Intended use, restriction declaration, policy version, and optional end-use notes. |
| `Request.requiresQualityApproval` | Whether Customer Admin quality approval is required before shipment. |
| `RequestLineItem.partName`, `quantity`, `material`, `surfaceFinish`, `generalTolerance` | Selected part label, quantity, material, full finish text, and tolerance. Finish text retains submitted color/cosmetic details when selected. |
| `RequestLineItem.qualityDocumentation` | Complete inspection/documentation list. |
| `RequestLineItem.notes` | Full whitespace-preserved manufacturing notes and generated requirements, including drawing-required threads/fits/tolerances/markings/corners when selected. These are submitted as notes, not newly invented structured fields. |
| `RequestLineItem.manufacturingDetails` JSON | Per-part process, optional target ship date, CAD envelope in mm and original units; nonempty historical part/revision information remains visible. Material/finish catalog keys remain in the saved record; the submitted labels are displayed. |
| `UploadedFile.lineItemIndex` | Explicit association to the saved part ordering. Files are never assigned by their position in the file array. |
| `UploadedFile.name`, `type`, `sizeBytes`, `storageKey`, `cadPreviewUrn` | File identity/size, private original downloads, saved CAD translation and selected drawing preview. |
| Operator review / supplier quote attachments / supplier responses | Saved review notes, assignment, received evidence and supplier response state, with links to existing operational actions. |

`storedRequestInclude` orders parts/files by creation timestamp then ID to stabilize the submission's index contract. Unindexed, negative or out-of-range file associations remain in Shared RFQ files. Old missing associations are not backfilled by guessing. Missing historical bytes/translations cannot be recreated from metadata alone; downloads/preview limitations are explicit.

## CAD and drawings

- CAD readiness is checked from the saved Autodesk URN; no re-upload or new translation is initiated by admin review. The existing interactive viewer is loaded only when its preview is ready.
- PDF drawings use lazy-loaded PDF.js, paginated canvas rendering, fit-width/zoom controls, text fallback for assistive technology, cancellation and cleanup. Drawing bytes are fetched through the existing authenticated/authorized file endpoint. The PDF.js worker is served from the installed package at `/api/pdf-viewer-worker`, versioned in its URL and explicitly included in standalone build tracing.
- Loading PDF bytes before passing them to PDF.js avoids a live-browser streaming-reader error (`onPull` on an undefined stream sink). The native embedded PDF view showed a blank panel in this browser. The restrictive file response sandbox remains in place; this implementation does not embed active uploaded documents.
- Images preview inline; DWG/DXF/other formats retain original downloads and an explicit native-application fallback. Private file reads have `private, no-store` caching.
- Technical reference: [Mozilla PDF.js examples](https://mozilla.github.io/pdf.js/examples/).

## Validation

- Focused action, component, repository, submission API, file-access, mapping, PDF rendering and route tests pass. Final count is recorded in the work log.
- Changed-file lint and whitespace checks pass. Typecheck has no newly introduced production-source errors; it remains blocked by pre-existing stale test fixtures in `request-form.test.tsx` and `request-form-completion.test.ts` that reference removed intake fields. No release build is claimed.
- Authenticated local browser: one database RFQ in the queue, direct detail navigation, first/second interactive CAD models, correct part-specific settings, and the saved PDF attachment rendered in-page. The test PDF attachment is the existing “Lattice - How It Works.pdf”, not a fabricated engineering drawing. A 390px viewport had no document-level horizontal overflow. A temporary expired admin session was re-established before remaining checks; no auth boundary was bypassed.
- Evidence: `output/qa/admin-rfq-detail-2026-10-13/drawing-preview.png`, `second-part-cad.png`, and `mobile-detail.png`.
- No actual RFQ/customer/supplier record was changed, quote/decision issued, email sent, or deployment performed. Existing file bytes and customer input were only read.

## Design options

The in-conversation concepts are synthetic proposals, not database records:

- **Part review**: select a part; keep its CAD/drawing beside requirements. Recommended for detailed engineering review and larger packages.
- **All-part dossier**: expanded per-part cards show the complete package without switching. Best for a quick overview and short RFQs, with more scrolling on large requests.
- **Tabbed workbench**: Technical package, Supplier sourcing and Customer quote areas share one RFQ context. Best when sourcing/pricing grows more complex; introduces more navigation.

The current operational detail is a baseline with part selection, preview and saved requirements. The alternatives have not been applied as a final product redesign. Their inline source is thread-scoped; product decisions should be written here/DECISIONS when William selects a direction.
