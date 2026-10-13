# Part configuration audit — 2026-10-11

## Scope and evidence

Inspected the existing authenticated local draft at `/requests/new?draft=local_draft_mv2p257o_phnfwy`, including its desktop layout, material selector, quality-document selector, ISO tolerance help, and a temporary 390 × 844 viewport. The session is a Lattice Admin viewing the customer RFQ interface. No field values, files, or RFQs were changed or submitted. Restored the default viewport and closed the menus/dialog. Source review supplements browser observations; payment, genuine customer-role access, upload replacement, draft recovery, and submission were not exercised.

Screenshots:

- Desktop: `output/qa/part-configuration-desktop-2026-10-11.png`.
- Phone width: `output/qa/part-configuration-mobile-2026-10-11.png`.

This adds a fresh visual pass to the source-only [October 10 configuration audit](request-quote-configuration-2026-10-10.md). No application behavior changed.

## Highest-priority findings

### P1 — Mobile content is clipped inside the part card

At 390px viewport width, the card/grid have 299px client width and 402px scroll width. The card's `overflow-hidden` masks the excess; the document itself does not show matching horizontal overflow. The CAD viewer, drawing help, Inspections & Certificates heading, and right-aligned controls visibly extend beyond the visible card. Stacking the columns at smaller breakpoints is insufficient because their content still establishes a larger minimum width.

Recommendation: allow grid children to shrink (`min-width: 0`), use an explicit shrinkable single-column track, reduce mobile padding, wrap headings/help, and size the viewer to its available width. Verify all controls at 390px and narrower supported widths, including an open selector and a long filename. Keep any deliberate horizontal scroll confined to the component that needs it.

Source: `LineItemConfigurationCard` in `src/components/request-form.tsx`.

### P1 — Unreviewed manufacturing assumptions can be submitted

The source initializes project process as CNC milling and requested date as 14 days from initial state creation. The configuration UI does not expose either field, but `handleSubmit` sends both. It also defaults each new part to SS 304, quantity 1, ISO Medium and as-machined finish. These visible part defaults count toward readiness without requiring confirmation.

Recommendation: expose the manufacturing process and requested delivery date or represent them as explicitly unconfirmed. Require deliberate material selection or clearly acknowledge suggested defaults in review. A restored draft must show its actual saved timing, rather than implying a fresh relative date. Decide whether process belongs to each part for mixed-process requests.

### P2 — Review/Submit steps are promised but absent

The progress indicator renders Upload, Configure, Review and Submit. `currentStep` supports only 1 or 2. The enabled Request Quote button submits directly from Configure. There is no package review screen.

Recommendation: implement Review with all parts, files, quantities, material, finish, drawing-dependent requirements, documentation and delivery assumptions, followed by Submit RFQ; otherwise simplify the indicator and instructional text to the actual flow.

### P2 — Submission has no visible pending state or repeat-click guard

`handleSubmit` starts a POST without setting a pending state, and the button is disabled only for incomplete configuration. The route creates a submitted request for each accepted POST. Duplicate submission was not exercised, but the current code leaves a repeat-click risk and gives no useful indication during a slow save.

Recommendation: disable submission immediately, show a submitting label, retain the draft on failure, and protect RFQ creation with a submission identifier on the server. Verify retry and double-click behavior without creating duplicate RFQs.

### P2 — Tolerance dialog does not manage keyboard focus

Opening ISO tolerance help left focus on its underlying trigger. A subsequent Tab action moved focus to Manufacturing notes behind the modal. The modal source provides Escape handling and dialog semantics but no focus transfer/trap.

Recommendation: move focus into the dialog, keep background controls inert while open, trap Tab/Shift+Tab, and restore focus to its trigger when closed. Review the drawing and delete dialogs for the same pattern.

## Feature and usability recommendations

- **Material/finish compatibility:** the SS 304 configuration receives the same finish menu, including anodizing choices, as all other materials. No compatibility filtering is passed into the finish selector. Introduce operator-approved compatibility rules and explain selections that require review; do not silently change a user's choice.
- **Completion feedback:** readiness is calculated, but the configuration footer exposes only a disabled/enabled action. Add a live per-part missing-items list with links to unresolved fields, especially required drawing and missing stored bytes.
- **Material aliases:** the visible material menu separately lists 304 Stainless Steel and SS 304 with the same UNS/designation metadata. Consolidate aliases into canonical choices while making aliases searchable. Preserve distinct grades and documented commercial variants.
- **Rename discoverability:** quote title editing requires a double-click, or Enter while the button is focused. Add an obvious edit affordance and conventional single-click activation. Preserve keyboard access.
- **Drawing identity:** empty upload copy says only Required for some part specifications. State the exact active drawing requirement near the upload, and show the complete CAD filename/revision as well as its shortened part name. Use explicit Replace CAD wording.
- **Inspections versus approval:** documentation selection is per part, while approval before shipment applies to the RFQ and sits after the additional-upload area. Keep that distinction, but place the project-wide approval explanation near the inspection summary or in review. Standard Inspection being included is useful; clarify differences between the two dimensional-report choices.
- **Repeated parts:** collapse/delete and add-part controls exist. Add a collapsed summary and a carefully scoped Copy specifications to other parts action for repeated configurations; exclude files, quantities, and drawing-specific flags unless explicitly chosen.
- **Autosave reassurance:** the header displays a static autosave promise. Show actual Saving, Saved and Save failed states, including whether shared persistence or only this browser succeeded.

## Design assessment

The neutral palette, restrained borders, clear labels, model preview and material identity details provide a credible engineering interface. The material chooser groups grades and supports search; standard inspection is visibly included; quality documentation and tolerance references are available close to their selectors. The actual solid CAD model rendered in this session, which provides current local viewer evidence beyond credential authentication.

The desktop card is visually unbalanced: preview and inspection occupy the top of the left column while the right column continues through finish, tolerances and notes. This leaves substantial empty left-column space. Large repeated headings/padding and a tall additional-upload panel increase scrolling. For multiple parts the burden compounds. Keep the style, but tighten section spacing, make Add another part compact, group manufacturing specifications coherently, and keep a summary/action footer accessible. Use small helper text for ambiguous engineering requirements rather than requiring a page change for every explanation. A progress indicator that accurately reflects the real workflow matters more than adding visual decoration.

## Recommended sequence

1. Repair mobile clipping and disclose manufacturing process/date/material assumptions.
2. Add an honest review flow, submission pending/idempotency protection, and visible readiness feedback.
3. Repair modal focus and establish reviewed material/finish compatibility.
4. Refine naming, material aliases, spacing, part summaries, multi-part copying and actual autosave status.

These are recommendations for product review, not approval to implement a new workflow.
