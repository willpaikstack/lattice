# RFQ intake requirements — October 12, 2026

## Implemented locally

- Per-part Manufacturing process: CNC Milling (default), CNC Turning, Sheet Metal Fabrication. Each choice persists separately; the request-level process summarizes the selected processes. Admin review, customer quote preparation and supplier quote preparation use the per-part values.
- Xometry-style restrictions dialog after local CAD selection, with no default answer. Per the later user-directed advance-processing change, valid CAD selection immediately uploads files and starts Autodesk translation during the unanswered popup. No → Continue opens a second intended-use page. Its Continue records the quote-wide Prototype/Commercial/Mixed-other choice and explanation, then reuses the existing upload/preview promises to open Configure. Back from intended use returns to restrictions without discarding the staged batch; translation polling and model preload remain active on both pages. Yes/Back/Close cannot retract transferred data; the explanatory note below the file list was removed at the user’s request. Each new/additional/replacement CAD batch opens the dialog with removable file rows (expandable beyond two). Back, Close, backdrop and Escape discard the staged batch. Yes explains the stop and keeps Continue faded and disabled; No enables a black Continue button. Restricted selections cannot advance or save a declaration through this action. Existing drafts can confirm/change the declaration using a separate Export restrictions dropdown below the quote name. Prototype/commercial use stays on the configuration page. The customer must choose Yes or No; the Unsure option was removed. Copy describes U.S. regulations and restricted handling without centering the dialog on a manufacturing country. Legacy unsure declarations remain blocked and require a fresh Yes/No decision. Restrictions declaration before upload, with no default answer. Current policy version: `overseas-intake-2026-10-12`. Restricted, unsure and obsolete declarations remain blocked. Unconfirmed/current-policy declarations with the explicit advance_cad_preview intent may process CAD-only files; drawings and RFQ submission still require unrestricted/current-policy declarations. Declared ITAR/export-restricted, CUI, US-only and incompatible restricted-handling work is refused in this overseas workflow. Unsure users must clarify eligibility before submitting files. This is a conservative product acceptance policy, not an automated legal classification or license determination. Existing drafts require an explicit current declaration; existing files are retained.
- Required Prototype / Commercial / Mixed-other end use, with no default, in a compact dropdown at the former intended-use card location. Option explanations appear inside the menu. Mixed-other requires explanatory text naming the intended use of the parts. The declaration and explanation are persisted and displayed in the admin inspector and quotation workbench. They do not automatically change tax/customs treatment.
- Updated October 13: previous-file history is disabled. Replacing CAD or removing/replacing a drawing keeps only current attachments in the quote; draft restoration and new submissions discard legacy history references. Replacement no longer waits for the prior file to save or promotes historical files on submission. Customer part/revision controls were removed October 12; legacy metadata remains readable. Existing storage objects and submitted RFQs are not bulk-deleted.
- Compatible finish menus backed by the same server submission rules. Saved incompatible choices stay visible with a corrective message and prevent submission; changing material/process does not silently rewrite finish intent.
- CAD envelope from Autodesk's loaded model bounds and unit scale, displayed as X/Y/Z with mm/in conversion. Model units and derived millimeter dimensions persist with the part and appear in admin review. Unknown units/infinite bounds produce no fabricated dimensions. This is a reference axis-aligned envelope from translated geometry, not certified inspection or analytic drawing dimensions. Replacing CAD clears the prior envelope. No model volume claim was added.

## Persistence and rollout

Two optional JSONB columns preserve structured requirements without rewriting existing RFQs:

- `Request.intakeDeclaration`: restriction status, policy version, intended use and explanation.
- `RequestLineItem.manufacturingDetails`: process, legacy part/revision identity, material/finish keys and CAD metadata. The legacy file-history field remains schema-compatible but is cleared for new intake.

Local PostgreSQL has the additive columns and Prisma Client was regenerated. SQL is saved at `scripts/rfq-manufacturing-schema-2026-10-12.sql`. Apply the same additive migration to a deployment's database before releasing this code there. Production was not changed. Shared drafts preserve the same data in their existing JSON package; syncing historical draft metadata does not transmit new file bytes or authorize manufacturing. New file uploads and translation remain gated.

Legacy submitted RFQs show Not declared in admin review. They are not retrospectively certified by this change. CAD/drawing associations are preserved in submitted and copied multi-part packages.

## Finish research and implementation rules

Research basis: [Protolabs Network surface-finishing service table](https://www.hubs.com/surface-finishing-services/) and [CNC finishing guide](https://www.hubs.com/knowledge-base/surface-finishes-cnc-machinings/), accessed October 12, 2026. These establish a conservative service matrix; they do not certify each Lattice supplier's availability or all theoretical substrates.

| Existing offered finish family | Material/process rule |
| --- | --- |
| As machined / smooth machining | CNC milling/turning; metals and plastics/composites, subject to supplier review of attainable roughness |
| As fabricated | Sheet-metal process with a metal material; explicit standard option without a CNC Ra promise |
| Fine machining / polishing | CNC metals |
| Bead blasting / brushing | Metals; CNC or sheet metal |
| Type II/III anodizing and combinations | Aluminum in the offered service; specialty titanium anodizing is a separate process and is not represented by these aluminum finish options |
| Chromate conversion and combinations | Aluminum in the offered service; other specialty conversion treatments require custom review |
| Powder coating | Metals; alloy, preparation and temperature suitability still need supplier confirmation |
| Electroless nickel | CNC aluminum, stainless steel and catalog mild-steel choices 1018/A36/1215; other steels/substrates require custom review |

An incompatible saved value is shown, explained and blocked from submission. An unset material disables finish selection until material is chosen. Special requirements can be described in notes for operator review; the form does not promise an unsupported finish by permitting a note. Material alias consolidation, passivation, new coating services and arbitrary custom finishing catalogs were not added in this session.

## Explanation of the hidden 14-day value

`makeProjectInitialState` in `src/components/request-form.tsx` initializes `dueDate` to the current time plus 14 days, then stores its date string. Submission sends it as RFQ metadata even though no customer date control is currently rendered. Saved drafts can retain an older value. It is not a displayed countdown, lead-time selection, guaranteed delivery date or operational scheduling system. This session did not change the delivery-date behavior because William asked for an explanation, rather than implementation of a date selector.

## What the other proposed features would entail

### Manufacturing-origin restrictions

Example control: **Sourcing requirement** → Overseas manufacturing allowed / US-only / Approved countries only / Unsure. An approved-country choice would collect the allowed destinations. If China is excluded, the current Lattice workflow should refuse the package or require a separately approved fulfillment route before any files are shared. Carry the constraint into supplier eligibility and quote approval; enforce it throughout routing, not merely in the UI. The new gate covers US-only and other declared restrictions, but no country-picker or domestic fulfillment route was added.

### Certificate of Conformance and heat/lot traceability

Example for a 50-part bracket order:

- CoC required: supplier-issued statement identifying the order, part number/revision and agreed requirements.
- Material Test Report: existing MTR selection, with the source report identifying the raw-material heat/lot.
- Heat/lot linkage required: evidence linking that raw-material report to the shipped parts or labeled packages.

The operator would request these deliverables in the supplier package, verify matching part/revision/lot information, and attach the correct documents to the order before release. A generic MTR that cannot be tied to the supplied lot is insufficient for an explicit traceability requirement. Store these as separate structured requirements, not one ambiguous Certificates checkbox. This changes the previous limited customer selector decision and remains proposed.

### Supplier certifications

Example requirement: **ISO 9001-certified manufacturing supplier required**. Customers request a qualification; operators verify the actual supplier certificate, scope, covered facility and validity. Matching must exclude suppliers that lack reviewed evidence. Save the evidence and reviewer decision with the supplier/award so a requirement cannot disappear during routing. ISO/AS supplier certification, a CoC, MTR and a FAIR document are different requirements. A requested certification should be shown as Pending review until verified; no new certification promises were added.

### Drawing/model conflicts and deviations

Example: CAD shows a Ø10 mm hole, while drawing Rev C shows Ø8 mm. The operator records the conflict, identifies the controlling file/revision and asks the customer to resolve it. A proposed deviation might say “Use Ø10 mm at feature 7.” Capture customer acceptance, person/time, affected features and exact revisions; carry that accepted exception into the customer quote and supplier package. Prevent quote/release while unresolved. Never silently alter a drawn requirement because a default tolerance was selected. This workflow remains proposed.

### NDA and file-processing disclosure

Explain who processes files, where manufacturing occurs, who receives supplier packages, and how confidentiality/restricted-access requirements are handled. If a customer requires a separate signed NDA before disclosure, provide a text-only inquiry and keep uploads blocked until the agreed document/review is complete. The request should not ask the customer to attach the confidential CAD to the NDA inquiry. Track agreement/version, covered parties and approval status. The implemented eligibility notice explains China manufacturing and Autodesk processing; it does not add a signed-NDA approval workflow or claim a new confidentiality guarantee.

### Critical tolerances, fits and threads

Example part fields: **Tightest tolerance: ±0.01 mm at drawing feature 7; Fit: H7 at feature 8; Thread: M6×1, 12 mm depth at feature 9.** Capture value/unit and feature reference or “see drawing/operator review.” Require the matching drawing and validate process/supplier capability. These details help quote review; the approved drawing remains the manufacturing authority. They extend the current yes/no flags; no extra engineering fields were added here.

### Markings

Example: **Laser mark “BR-104 Rev B,” serial numbers 0001–0050, on the face identified by drawing note 3.** Collect method, content/serialization scheme, location, orientation/size if required, and drawing reference. The operator confirms material/finish suitability and operation sequence, then includes it in the supplier package and inspection expectations. These are additional fields beyond the current Part Markings yes/no request; they remain proposed.

## Regulatory and SDK references

- [BIS end-use/end-user controls](https://www.bis.gov/regulations/ear/744): customer declarations do not replace destination/end-user/end-use review.
- [BIS item classification](https://www.bis.gov/licensing/classify-your-item): ECCN classification is separate from HTS/customs codes.
- [ITAR technical-data definition](https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-120/subpart-C/section-120.33): can cover manufacturing drawings/information.
- [Autodesk Viewer Model API](https://aps.autodesk.com/en/docs/viewer/v7/reference/Viewing/Model/) and the pinned [7.108.0 SDK source](https://developer.api.autodesk.com/modelderivative/v2/viewers/7.108.0/viewer3D.js): model bounds, `getUnitString` and `getUnitScale` (meters per model unit). Unknown units are not assumed to be meters.

## Validation

130 targeted Vitest cases passed across intake UI, server eligibility gates (including direct-upload transport), finishing rules, unit conversion, admin display, persistence, draft behavior, quote preparation and company-scoped file access. Full TypeScript and targeted ESLint passed. A real local PostgreSQL transaction wrote/read the new JSON metadata using regenerated Prisma Client and rolled back the synthetic RFQ/part. No permanent RFQ was created by that check. Live browser confirmed X/Y/Z extraction, mm/in conversion, process choices, revision fields, and no form-section horizontal overflow at 390px. Existing draft restrictions/end-use selections visible during the browser check were not selected by the agent. No existing RFQ was submitted and no customer part specifications were edited during browser inspection.

## Intended-use simplification — October 12, 2026

The popup and Configure dropdown now offer only Prototype and Commercial, with the user-provided reference copy. Mixed/other and its explanation control were removed. New submissions require one of the two choices; legacy mixed records remain readable for admin/history, but drafts require a fresh supported choice. Selecting an option clears obsolete mixed notes. Popup page changes continue to leave Autodesk translation and model preload running.
