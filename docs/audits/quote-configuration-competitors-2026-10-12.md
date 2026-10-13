# Quote configuration comparison — October 12, 2026

## Scope

Fresh browser audit of the authenticated Lattice configuration draft at `/requests/new?draft=local_draft_mv2p257o_phnfwy` and the four vendor tabs William opened in Chrome. Inspected configuration controls, supporting panels, end-use choices, and manufacturing feedback without changing existing part specifications, selecting classifications, placing orders, or submitting Lattice's RFQ. This was a desktop product audit, supplemented by source inspection; it does not certify production behavior, supplier capability, or regulatory compliance.

- **Xometry:** current quote Q06-2365-9121, including its part editor. CNC, same A10201 filename as Lattice.
- **Hubs / Protolabs Network:** the supplied tab was at the empty upload page. Used its built-in CNC sample to inspect the actual editor, end-use dialog, pricing/origin choices, and DFM report. This created an unsubmitted sample quote, 46NFXPPJK-V1; no user CAD was uploaded.
- **Fictiv:** current quote paik_101126, part configuration modal, process/material editor, and manufacturability feedback. Its existing part is configured as sheet metal, so process-specific controls differ from Lattice CNC.
- **Protolabs:** the supplied new-quote page had zero files. Inspected that page's export-control prompt, then the existing expired CNC quote 1104-984 in the same Burnerhead project, including configuration, advanced requirements, certificates, and Manufacturing Analysis. Its expired pricing is not a current price benchmark. An ad-blocker notice was present; not all integrations may have been available.

Hubs is now branded Protolabs Network. It remains a separate quoting experience from the Protolabs factory platform inspected here. Do not infer identical capability from their shared brand.

Evidence screenshots: `output/qa/quote-competitors-2026-10-12/{lattice-configure,xometry-configure,hubs-end-use,fictiv-end-use,protolabs-configure}.png`. Screenshots are local evidence, not publication assets. No private file download URLs or session tokens are copied into this report.

## Assessment

Lattice already covers the main manually reviewed RFQ inputs: multi-part CAD upload and interactive preview, material search and grade metadata, quantity, general tolerances, finish and finish-dependent details, technical drawings, manufacturing notes, drawing-required flags, several inspection reports, MTR, and a request-level shipment approval hold. The recent readiness checklist, no-default-material behavior, truthful progress indicator, pending submission, and modal focus changes remain visible.

The main gaps are **eligibility, manufacturing intent, engineering identity, and actionable review information**. These are more urgent than an instant price engine or a larger menu of manufacturing services. Lattice's managed overseas manufacturing model should guide the priorities.

## What each vendor demonstrates

| Vendor | Directly observed strengths | Relevant lesson for Lattice |
| --- | --- | --- |
| Xometry | ITAR/EAR/CUI controlled handling; supplier qualification requirements; process/subprocess; inserts; multiple marking methods; numeric tolerance and roughness choices; eight DFM check categories; dimensions in mm/in; CAD revision; repeat-part flag; volume discounts; price/speed and origin options. | Make manufacturing requirements explicit and distinguish documentation from supplier qualifications. |
| Hubs / Protolabs Network | Restricted-upload notice before upload; prototype/commercial end-use dialog; compact part specification summary; Apply to all in part editor; model size/volume; DFM warnings; custom requirements; separate US/global and speed choices; landed-cost explanation. | Strong reference for pre-upload eligibility, end use, readable summaries, and explaining delivery assumptions. |
| Fictiv | Mandatory prototype/commercial classification; process/material editor; inserts; hole/thread configuration; standard/advanced inspection reports, conformity and material certificates; revision history; DFM warning and response actions; quantity savings; drawing generation; material assistant; visible account-manager support. | Capture end use explicitly and turn engineering feedback into an actionable revision/reply workflow. |
| Protolabs | Export-control question at upload; finish separate from coating; threading, fits, inserts, markings, tightest tolerance, custom requirements and certificates; bulk selection; CAD revision; dimensional summary; analysis comparing mill/lathe paths. | Separate the physical manufacturing operations and use progressive disclosure for uncommon requirements. |

These are observed controls, not proof that every service is available for every material, geography, account, or part. Features not mentioned were not necessarily absent.

## Priority A — implement before accepting broader customer packages

| # | Gap in Lattice configuration | Evidence / comparison | Recommendation and scope |
| --- | --- | --- | --- |
| 1 | No customer-facing export/restricted-data intake gate. Existing internal compliance-review fields do not collect ITAR/EAR classification or prevent upload. | Xometry controlled handling; Protolabs upload prompt; Hubs prohibited-upload notice. | **Yes, highest priority.** Collect an explicit answer before CAD/drawing upload, draft-file storage, and APS translation. No default answer. Restricted or unsure packages stop before file transmission and enter text-only operator triage. Treat CUI and customer US-only handling as separate restrictions from export classification. Do not advertise a supported ITAR route without an approved operational path. |
| 2 | No prototype/commercial end-use classification. | Fictiv requires it; Hubs explains it affects tariff-inclusive pricing. | **Yes.** Require Prototype / Commercial / Mixed or unsure, with definitions. Store request-level intent with per-part overrides when mixed. Preserve it on submitted RFQs, quotes and operational records. It informs review; it must not automatically grant a customs exemption. |
| 3 | Process exists but is hidden and defaults to CNC milling. No process on each RFQ line item. | Xometry process/subprocess; Hubs technology; Fictiv process/material; Protolabs mill/lathe analysis. | **Yes.** Expose CNC milling / turning / Help me choose on each part. Offer other processes only when operator-approved capabilities and configuration rules exist. Do not copy a competitor's full service catalog. |
| 4 | Requested timing is hidden and initialized to 14 days ahead. | Competitor price/lead-time and shipping summaries. | **Yes.** Show requested delivery date, destination summary and Flexible / Needed by this date. Separate customer requested arrival from supplier production lead time and Lattice's confirmed quote date. Do not imply a guaranteed date at RFQ submission. |
| 5 | No visible manufacturing-origin or customer sourcing restriction. | Xometry origin; Hubs US/global manufacturing choices. | **Yes, as an eligibility requirement.** Explain Lattice's overseas manufacturing/file-processing model before upload. Ask whether domestic-only, approved-country, or other sourcing restrictions apply. Block/review incompatible requests. Do not add a selectable US manufacturing promise when that fulfillment route is unavailable. |
| 6 | All materials receive the same finish list. SS 304 still exposes anodizing options; duplicate material aliases remain. | Lattice browser/source; competitors organize process, material and finishing together. Dynamic compatibility was not exhaustively tested in their editors. | **Yes.** Use operator-approved material/process/finish compatibility rules; explain unsupported combinations and preserve invalid saved selections for correction. Canonicalize aliases while keeping them searchable. Distinct grades and tempers must remain distinct. |
| 7 | No structured part number, customer revision, or drawing revision at intake. Replace Part does not provide an engineering change history. | Xometry V0/Revise CAD; Fictiv Rev 1/history; Protolabs CAD Revision and Upload Revision. | **Yes.** Add part number, CAD revision and drawing revision. Bind them to file-to-part associations and record replacement history. RFQ/quote revision records elsewhere in Lattice are not a substitute for per-part engineering identity. |
| 8 | No explicit inserts/hardware installation request. | Xometry, Fictiv and Protolabs expose inserts. | **Yes, simple version.** Add Inserts / hardware required, require a drawing and specification or part number. Capture supply responsibility and quantity if needed. Use manual operator review before promising installation. Hole recognition can wait. |
| 9 | No explicit CoC request or separate supplier qualification / traceability request. MTR already exists. | Xometry separates certificates and supplier qualifications; Fictiv conformity/material certificates; Protolabs CoC/CoA. | **Yes for CoC and traceability.** Distinguish a part conformance document, material test report/heat-lot linkage, and a shop's certification. Use a custom reviewed requirement for ISO/AS/medical qualification until supplier eligibility can be enforced. AS9102 report format does not establish supplier AS9100 certification. This changes the previous limited selector scope and needs deliberate product approval. |
| 10 | Drawing precedence and exceptions to standard tolerances are not explicit. | Xometry explains when selected tolerance tiers override drawing requirements; other platforms pair drawings with custom requirements. | **Yes.** Clearly state the agreed manufacturing standard, require review of drawing/model conflicts and exceptions, and carry approved deviations into the quote. Require deliberate agreement before changing any drawn requirement; do not import Xometry's override policy automatically. |
| 11 | Pre-upload confidentiality/data-processing explanation is missing from this flow. | Hubs upload privacy/NDA explanation; Lattice APS documentation confirms translation sends CAD to Autodesk. | **Yes.** Add concise file-handling and confidentiality links plus a text-only NDA/restrictions inquiry. Explain actual processing and supplier-access scope. Obtain a signed NDA before upload if the customer requires one; do not imply a generic secure-upload badge resolves special handling restrictions. |

## Priority B — add next to improve RFQ completeness and usability

| # | Missing or partial feature | Evidence / comparison | Recommendation and scope |
| --- | --- | --- | --- |
| 12 | Tighter tolerances, threads and fits are mostly yes/no flags. | Xometry numeric tolerance tiers; Protolabs tightest-feature tolerance and fits; Fictiv thread configuration. | **Yes, incrementally.** Keep the drawing as engineering authority; capture tightest tolerance with units, critical features, thread/inserts specifications and fit class. Allow an explicit operator-review option instead of forcing a precise value the customer does not know. |
| 13 | Part markings have no structured method or content. | Xometry engraving/laser/ink/bag-and-tag choices; Protolabs and Hubs marking choices. | **Yes.** Method, text/serial requirement and drawing location; require a drawing when needed. Do not silently choose a marking process. |
| 14 | One finish field combines surface condition and coating; roughness requirements beyond the chosen finish are not explicit. | Protolabs separates Finish and Coating; Xometry supports finish combinations and separate smallest roughness. | **Yes.** Separate roughness/cosmetic expectations from coating; support approved combinations and masking/critical surfaces via drawings. Heat treatment/hardness can initially be a custom reviewed requirement rather than a promised catalog service. |
| 15 | No readable model envelope/unit summary alongside the part identity. | All four exposed dimensional metadata; Xometry showed mm and in together. | **Yes.** Display CAD-derived dimensions and units and flag scale ambiguity. Lattice already has native viewer measurement tools; this recommendation is about persistent, readable metadata, not replacing those tools. Validate extraction and avoid treating the display as certified dimensional inspection. |
| 16 | No engineering manufacturability feedback panel. CAD translation/rendering is the only automated analysis here. | Xometry DFM checks; Hubs corner/wall/hole checks; Fictiv stock-thickness warning with response actions; Protolabs Manufacturing Analysis. | **Yes for manual DFM now/next.** Operator-reviewed concerns with drawing/model references, impact and Accept deviation / Upload revision / Ask a question. Keep acceptance/version history. Automatic geometry analysis is a later project; APS preview alone is not DFM. |
| 17 | Only one drawing attachment per part; no supporting-specification package at configuration. | Xometry supporting files; Fictiv attach drawing from quote; Hubs custom requirements. | **Yes if buyers need it.** Multiple drawings/spec PDFs with explicit roles and part associations; customer-wide specs can be package-level. Existing submitted CAD/drawing association is already present, so this is an extension rather than a missing basic mapping. Restrict formats and avoid treating an arbitrary uploaded PDF as a technical drawing. |
| 18 | No scoped bulk-copy/batch editing or compact collapsed engineering summary. | Hubs Apply to all; Protolabs selected-parts editing; Xometry summary cards; Fictiv parts table. | **Yes.** Copy selected material/finish/tolerance/doc choices to compatible parts, preview affected parts and validate afterward. Exclude files, revisions, quantities and part-specific callouts by default. Show material, process, quantity, revision and readiness in collapsed cards. |
| 19 | No alternate-quantity price-break request. | Xometry volume discounts; Fictiv quantity savings. | **Yes, manual quote version first.** Let a customer request pricing for quantities such as 10/50/100; suppliers return explicit alternatives. Do not display calculated savings without an actual quoted basis. |
| 20 | Static autosave reassurance; no visible save-state distinction or easy support action near configuration. | Lattice static header; Xometry activity log; Fictiv last-modified/activity and account-manager contact; Hubs Contact sales. | **Yes.** Show Saving / Saved / Save failed, last saved time and whether shared persistence succeeded. Add an operator support link carrying RFQ context without automatically sending a message or files. |
| 21 | Replace/reorder lacks convenient reusable part/configuration history in this page. | Xometry repeat-part and recent CAD; Fictiv library and revision history; Protolabs Parts & Molds / production catalog. | **Yes later in this phase.** Link to a previous Lattice order/part and its approved revision. Existing reorder flow already helps; add traceable reuse, not a separate duplicate record system. |

## Defer or keep excluded

| Feature | Evidence | Recommendation |
| --- | --- | --- |
| Instant pricing, automated quantity discounts and guaranteed economy/standard/express dates | Xometry/Hubs; Fictiv pricing/speed; Protolabs quote pricing | **Defer automation.** First offer operator/supplier-backed alternative quantities and delivery options. An intake screen may show an honest quote-turnaround expectation once operations can meet it. |
| Automated DFM geometry classification, hole recognition and process optimization | All four DFM experiences; Fictiv holes; Protolabs mill/lathe comparison | **Defer automation, build the manual feedback workflow first.** Requires reliable geometric analysis, process-specific limits and reviewed output. |
| AI material advice and automatic technical-drawing generation | Fictiv Materials.AI and Generate a drawing | **Defer.** Engineering intent, revision identity and a usable supplied drawing are higher priorities. AI output must not become an unreviewed manufacturing specification. |
| Customer self-service source inspection or build-and-hold first article release | Xometry | **Keep excluded under the current decision.** Lattice already deliberately removed these selector options. FAIR documentation and quality approval before shipment are separate workflows. Reconsider only with a designed staged-production/release process. |
| US-only/ITAR fulfillment route, broad certified-supplier badges, more manufacturing technologies | Competitor eligibility and service catalogs | **Do not add promises without a verified fulfillment path.** Capture a restriction/custom requirement and accept or reject it through operator review. |
| Share/forward-to-purchaser, customer approval roles and CAD library | Xometry/Fictiv/Protolabs | **Defer configuration-specific expansion.** Review existing Lattice quote sharing, order reuse and company permissions before building another collaboration surface. Never make a private CAD package publicly shareable by default. |
| A separate Review progress-bar step | Protolabs has a real review stage | **Keep Lattice's approved three steps.** Put an accurate package summary/checklist beside Submit. A competitor's stage names do not require restoring a removed step. |

## ITAR and end use: proposed UI

### Before the first upload

**Restricted data or manufacturing requirements**

“Do any parts or files require ITAR/EAR-controlled handling, CUI handling, US-only access/manufacturing, or another restriction incompatible with overseas manufacturing?”

- No known restrictions — customer must explicitly select it.
- Yes — stop file upload and offer text-only operator review.
- I'm unsure — stop file upload and offer text-only operator review.

Explain the supported sourcing and data-processing path immediately below the question. Have the precise policy and wording reviewed for Lattice's actual operations. A customer's answer is a screening input, not regulatory clearance. Recheck eligibility when the customer adds/replaces parts or changes restrictions, and enforce it server-side in file-storage and APS endpoints as well as in the browser.

ITAR technical data can include drawings and manufacturing information, so screening cannot start only after CAD is uploaded: [22 CFR 120.33](https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-120/subpart-C/section-120.33). BIS explains controlled technology releases and item classification separately: [deemed exports](https://www.bis.gov/learn-support/deemed-exports/what-deemed-export), [classification guidance](https://www.bis.gov/licensing/classify-your-item). ECCN and HTS codes serve different purposes. End-user/destination restrictions still require review; a “No ITAR” answer does not establish overseas eligibility.

### At the top of Configure

**Intended use — required, no preselected answer**

- Prototype: development, testing, evaluation or quality control.
- Commercial: production/sale or incorporation into sold products.
- Mixed / other / unsure: explain which parts and the intended use for operator review.

For a mixed request, let the customer specify each part's use. Internal tooling and other cases that do not fit the two simple definitions should not be forced into an inaccurate answer. Keep this separate from export/data restrictions and from tax-exempt status. Do not automatically infer tariffs, customs exemption or HTS classification from this field.

## Layout recommendation

1. **Before Upload:** concise eligibility/data-policy gate.
2. **Request requirements above cards:** intended use, delivery target/destination and sourcing restriction summary.
3. **Each part:** identity/revision → process/material/quantity → finish/coating → tolerances/threads/inserts → drawings/documents → custom requirements.
4. **Advanced requirements:** progressive disclosure for uncommon engineering details, with active requirements summarized even when collapsed.
5. **Submission area:** compact package summary, per-part readiness and honest submit/save status. Keep the existing three-step progress bar.

Retain Lattice's restrained visual style. Reduce large repeated headings and empty left-column space, replace the oversized additional-CAD panel with a compact Add another part control, add a visible quote-name edit affordance, and make the summary/action readily accessible. The current desktop material dropdown truncates grade metadata at the inspected window width; preserve full identity in an accessible detail/tooltip view.

## Proposed implementation sequence

1. Eligibility gate and file-processing policy; end-use classification; visible process and requested delivery.
2. Part/revision identity, inserts, CoC/traceability, compatibility and drawing/conflict rules.
3. Compact summaries/bulk operations, readable units, richer advanced requirements and additional supporting files.
4. Manual DFM and alternative quantity/lead-time quoting.
5. Automated analysis, pricing and AI tools only after operational inputs and supplier feedback are reliable.

All items above are recommendations for William's review, not approval to change application behavior.
