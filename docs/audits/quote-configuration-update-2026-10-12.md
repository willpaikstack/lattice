# Updated quote configuration comparison — October 12, 2026

## Basis and scope

This updates the [earlier competitor audit](quote-configuration-competitors-2026-10-12.md) against the current Lattice source and the customer's screenshots. Competitor observations come from that earlier authenticated desktop inspection of Xometry, Hubs/Protolabs Network, Fictiv and Protolabs; their pages were not re-audited in this session. This is a feature/design comparison, not end-to-end verification or a supplier capability assessment.

Customer part number, CAD revision and Drawing revision controls have now been removed at William's request. Historical values and replacement-file references remain in existing data. This report treats their removal as the chosen simplification, not a request to restore them.

## Overall assessment

Lattice now has a credible configuration flow for a manually reviewed manufacturing RFQ. It covers the core inputs and has a simpler quote header and separate part cards. The largest remaining differences are actionable engineering review, purchasing requirements and efficiency for multipart requests. Competitor instant pricing and automated DFM are substantially larger operational products; copying their UI alone would not provide those capabilities.

## Gaps closed since the earlier audit

| Area | Current Lattice position | Comparison |
| --- | --- | --- |
| Manufacturing process | Per-part Milling, Turning and Sheet Metal; Milling default | Addresses the hidden-process gap. Keep the menu aligned with actual offered capabilities. |
| Intended use | Mandatory Prototype/Commercial popup page; editable compact summary dropdown | Similar intake pattern to Fictiv/Hubs. Both choices persist for admin review. |
| Restrictions | Explicit Yes/No popup and editable summary; declared restricted work blocks quoting | Similar screening UX to the inspected vendors. Lattice begins CAD transmission/APS processing before the answer, so this is not a pre-transmission gate. |
| Material/finish compatibility | Material/process-aware options plus server validation | Prevents the previously observed SS 304/anodizing mismatch. Supplier availability still needs review. |
| Model size and units | CAD envelope, model units and mm/in display | Closes the readable-dimension gap. Bounds are a reference, not inspection measurements. |
| Submission clarity | Readiness checklist, pending button and retry deduplication | Stronger explanation of what is missing and clearer submission state. |
| Layout | Separate quote/part cards; compact quote-wide summaries | Better visual separation. Removed three identity/revision fields reduces early form clutter. |
| Preview latency | Upload/translation, polling and model preload overlap both popup pages | Uses intake time productively. Conversion time remains dependent on Autodesk and the model. |

## Delivery evidence clarification

The earlier audit observed quoted lead-time, speed and arrival information; it did not establish a customer-entered Requested delivery date field on all four platforms. A Flexible / Needed by date control is a recommendation for Lattice’s manually reviewed RFQ workflow, not a demonstrated shared competitor field. The saved Xometry screenshot shows Price and Lead Time with arrival dates; the Hubs screenshot shows speed/lead-time choices behind the end-use panel.

## Remaining features and recommendations

| Feature | Earlier competitor evidence | Current Lattice gap | Recommendation |
| --- | --- | --- | --- |
| Requested delivery | All four expose timing/pricing context; Hubs distinguishes production and shipping | Hidden date initialized 14 days ahead; no explicit customer request | **Implement next.** Flexible / Needed by date, with arrival clearly distinguished from manufacturing lead time. Confirm achievable delivery in the quote. |
| CoC and material traceability | Fictiv conformity/material documents, Xometry certificates, Protolabs CoC/CoA | MTR and inspection reports exist; explicit CoC and heat/lot linkage are missing | **Implement next.** Separate CoC, MTR and traceability requests; carry requirements into admin review and fulfillment. |
| Inserts/hardware | Xometry, Fictiv and Protolabs | No dedicated installation request | **Implement next.** Drawing-backed hardware requirement with specification, quantity and supply responsibility. Operator review determines feasibility. |
| Engineering concerns and deviations | All four expose manufacturability feedback; Fictiv offers response actions | Viewer conversion is not DFM; no structured part-specific concern/response workflow | **Implement manual review next.** Concern, location, proposed change, impact, and customer response. Record accepted deviations with the quote. Defer automated DFM. |
| Drawing/model conflicts | Earlier Xometry precedence explanation and competitor custom requirements | No explicit agreed precedence/deviation flow | **Implement next.** Resolve conflicts during review and record agreed exceptions before manufacturing. |
| Multipart copy and collapsed summaries | Hubs Apply to all, Protolabs batch editing, Xometry summaries | Parts repeat configuration; collapsed header mainly identifies the file | **Implement soon.** Copy selected compatible settings and show process/material/quantity/readiness in collapsed cards. Exclude file references and part-specific callouts from default copying. |
| Save-state feedback | Fictiv activity/modified context; Lattice static reassurance | “Drafts autosave” does not distinguish saving, saved locally/shared, or failed | **Implement next.** Explicit save status and recovery guidance; distinguish browser persistence from shared persistence. |
| Alternate quantities | Xometry volume discounts, Fictiv quantity savings | One quantity per part | **Implement soon.** Request supplier-backed price breaks, e.g. 10/50/100. Avoid fabricated automatic discounts. |
| Threads, fits and critical tolerances | Xometry numeric tiers, Protolabs fits/tightest tolerances, Fictiv thread controls | Mostly yes/no flags supported by drawings | **Implement incrementally.** Optional critical-feature details and units. Keep the drawing authoritative and avoid requiring duplicate specification entry. |
| Marking requirements | Xometry methods, Protolabs/Hubs marking choices | Yes/no plus drawing requirement | **Implement when demand warrants.** Method, text/serialization and location; retain operator feasibility review. |
| Supporting documents | Xometry supporting files and competitor custom requirements | One drawing attachment per part | **Implement when customers need it.** Multiple documents with explicit roles; distinguish a technical drawing from general specifications. |
| Supplier qualifications | Xometry qualification requests; competitor certification context | No verified selectable qualification catalog | **Capture for review only initially.** A requested certification must not imply supplier eligibility or availability. |
| Confidentiality and special handling | Earlier Hubs privacy/restrictions messaging | Limited intake explanation; APS begins before classification | **Resolve before wider rollout.** Define and communicate actual processing/access scope and the path for an NDA or special handling requirement. This remains separate from the Yes/No UI. |
| Instant pricing, automated DFM, AI material advice/drawing generation | Various inspected competitor platforms | Not implemented | **Defer.** Prioritize complete RFQs, supplier-backed quotes and reliable manual engineering review. |

## Design recommendations

1. Keep the quote header as a quiet summary of choices already made during intake. Avoid requiring a second confirmation.
2. Replace the large additional-CAD drop zone with a compact Add another part action, optionally expanding the drop target on demand.
3. Show process, material, quantity and missing requirements when each part is collapsed.
4. Add a visible quote-name edit affordance; double-click-only discovery is weak.
5. Reduce unused left-column space and oversized repeated section headings. Preserve proximity between drawings, documentation and related engineering requirements.
6. Keep uncommon requirements behind progressive disclosure, but show active requirements in the summary.

## Recommended sequence

1. Visible requested delivery, save-state feedback and CoC/traceability.
2. Inserts and drawing-conflict handling; manual engineering concerns with customer responses.
3. Multipart copy, collapsed summaries and compact additional upload.
4. Alternate quantity quoting and richer engineering details as demand develops.

No tests were run for the field removal. No RFQ was submitted or competitor quote changed in this session.
