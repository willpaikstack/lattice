# Design QA: Admin Order Progress Redesign

**Evidence**
- Source visual truth: `/var/folders/vx/vw_hvl8j30g217j4mfnjrxb80000gn/T/codex-clipboard-72d9a27d-5418-4e1c-892d-df37e57b12d4.png`
- Browser-rendered implementation: `/Users/willsclaw/lattice/.audit/order-progress-redesign-2026-08-01/implementation-desktop.png`
- Focused implementation region: `/Users/willsclaw/lattice/.audit/order-progress-redesign-2026-08-01/implementation-form-focused.png`
- Mobile implementation: `/Users/willsclaw/lattice/.audit/order-progress-redesign-2026-08-01/implementation-mobile.png`
- Full comparison: `/Users/willsclaw/lattice/.audit/order-progress-redesign-2026-08-01/source-vs-implementation.png`
- Focused comparison: `/Users/willsclaw/lattice/.audit/order-progress-redesign-2026-08-01/source-vs-form-focused.png`
- Desktop viewport: `2463 x 1246` CSS pixels. Source and implementation captures are both `2448 x 1238` pixels, so no density resampling was needed for the full comparison.
- Mobile viewport: `390 x 844` CSS pixels; browser capture is `375 x 812` pixels.
- State: source shows `Ready to ship`; the live implementation sample shows `Awaiting supplier acknowledgment`. Status content differs intentionally because the implementation uses the current local order record. Layout, hierarchy, controls, and state treatment were compared.

**Findings**
- No actionable P0, P1, or P2 differences remain.
- Typography: the implementation retains the app's existing sans-serif family and compact enterprise UI scale. Heading, label, helper, and preview hierarchy are clear without oversized display text.
- Spacing and layout: the redesign is substantially shorter than the source by design. The lifecycle, primary milestone fields, collapsible internal metadata, customer note, preview, and publish action form a clear top-to-bottom workflow with consistent spacing and restrained radii.
- Colors and visual tokens: neutral surfaces remain consistent with the admin workspace. Semantic status colors are used as compact cues rather than as the dominant palette, and contrast is sufficient in tested states.
- Image and icon fidelity: the form does not require photographic assets. All interface symbols use the existing Lucide icon library; no placeholder or handcrafted visual assets are present.
- Copy and content: labels now distinguish `Internal owner` from `Waiting on`, and the preview makes the customer-visible result explicit. Suggested milestones reduce blank-state effort.
- Responsive behavior: at mobile width, fields stack without page-level horizontal overflow. Only the lifecycle strip scrolls horizontally (`333px` client width, `820px` content width), preserving all seven states.

**Interaction Coverage**
- Verified status selection updates the status badge, lifecycle position, suggested milestone, and responsible party.
- Verified `Shipped` reveals tracking inside Internal details.
- Verified `Delivered` removes active-milestone requirements in component tests.
- Verified the customer preview mirrors entered content and the publish action stays disabled until required fields are present.
- No browser console warnings or errors were observed.

**Comparison History**
- Initial implementation exposed blank milestone data for older orders. Fixed by pre-filling the status-specific suggested milestone and responsible party when no milestone is stored.
- Post-fix desktop, focused, and mobile captures show the corrected defaults with no remaining P0/P1/P2 issues.

**Follow-up Polish**
- [P3] A hidden-scrollbar treatment could make the mobile lifecycle strip slightly quieter while retaining touch scrolling, but the visible scrollbar currently provides a useful discoverability cue.

**Implementation Checklist**
- [x] Add lifecycle and semantic status cues.
- [x] Reduce the primary form to status, milestone, date, and waiting-on fields.
- [x] Move internal metadata into a collapsible section and show tracking only when relevant.
- [x] Add customer-facing preview and completion-aware validation.
- [x] Verify desktop, mobile, conditional states, focused tests, lint, and browser console.

final result: passed

---

# Design QA: RFQ Upload-First Redesign

**Evidence**
- Source visual truth: `/Users/willsclaw/.codex/generated_images/019fbe9a-74cc-7430-ae4e-4828eb22f536/exec-1eae6b18-0b5a-45a4-bad6-d9ea6b1d766d.png`
- Browser-rendered implementation: `/Users/willsclaw/lattice/.audit/rfq-upload-redesign-2026-08-01/implementation-desktop.png`
- Mobile implementation: `/Users/willsclaw/lattice/.audit/rfq-upload-redesign-2026-08-01/implementation-mobile-full.png`
- Full comparison: `/Users/willsclaw/lattice/.audit/rfq-upload-redesign-2026-08-01/comparison-desktop.png`
- Desktop viewport: `1440 x 1024` CSS pixels at device scale factor `1`; implementation capture is `1440 x 1024` pixels. The `1487 x 1058` source was proportionally normalized and padded to `1440 x 1024` before comparison.
- Mobile viewport: `390 x 844` requested, with a `375px` browser content viewport. DOM measurement confirmed `375px` document width with no page-level horizontal overflow; the progress strip intentionally scrolls within its `327px` container.
- State: the source includes two example drafts, while the implementation browser session has no saved drafts. Component tests cover the populated draft state, including filtering submitted requests and rendering continuation actions.

**Findings**
- No actionable P0, P1, or P2 visual differences remain in the RFQ redesign.
- Typography: the implementation preserves the existing Geist-backed product type and closely matches the source hierarchy, weights, line lengths, and compact UI text.
- Spacing and layout: title, autosave message, four-step progress, upload surface, and draft placement match the source composition. The empty live state naturally ends after the upload surface instead of fabricating draft rows.
- Colors and visual tokens: neutral off-white, white, black, and gray tokens remain consistent with the selected image and the customer workspace. Borders, shadows, and radii stay restrained.
- Image and icon fidelity: no photographic assets are required. Upload, autosave, navigation, and step indicators use the existing Lucide icon library and Lattice logo asset.
- Copy and content: the page now uses `Request a quote`, supported format and file-size guidance, autosave reassurance, and draft-specific continuation language. Submitted requests are intentionally excluded from the draft list.
- Responsive behavior: document width remains within the mobile viewport. The stepper scrolls horizontally so all four stages remain available without compressing labels.

**Interaction Coverage**
- Verified the initial upload control is present and accessible by label.
- Verified actual drafts link back to `/requests/new?draft=[id]` and submitted requests are not shown in the continuation section.
- Existing test coverage continues to verify multi-file upload, CAD preview translation, draft file persistence, technical drawings, configuration, validation, and RFQ submission.
- Browser console review found one pre-existing app-shell hydration warning caused by persisted navigation order differing from the server render. The RFQ page recovers visually and the warning is outside this redesign's changed surface.

**Comparison History**
- Initial implementation closely matched the selected source. The live browser state lacked draft data, so populated draft behavior was normalized through focused component coverage rather than fabricated browser records.
- Post-implementation comparison confirms the same hierarchy, upload emphasis, typography, spacing rhythm, and neutral visual system with no RFQ-specific P0/P1/P2 issues.

**Follow-up Polish**
- [P3] Replace the horizontally scrolling mobile stepper with a compact current-step summary if customer testing shows that swipe discovery is weak.
- [P3] Address the pre-existing app-shell navigation hydration warning in a separate change to remove the local development issue badge.

**Implementation Checklist**
- [x] Lead with upload and remove the previous card-like hero.
- [x] Add Upload, Configure, Review, and Submit progression.
- [x] Make autosave visible before file selection.
- [x] Restrict draft continuation to unsubmitted drafts.
- [x] Preserve upload, preview, configuration, validation, persistence, and submission behavior.
- [x] Verify focused tests, TypeScript, lint, desktop comparison, mobile width, and browser console.

final result: passed
