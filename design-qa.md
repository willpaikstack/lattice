**Comparison Target**

- Source visual truth: `/Users/willsclaw/.codex/generated_images/019fe1fd-9e4f-7592-ba0f-fa56cbce10a3/exec-fbd94820-7c6c-409c-8d19-e75b115bf61d.png`
- Browser-rendered implementation: `/Users/willsclaw/lattice/.audit/equipment-card-2026-08-08/equipment-card-desktop.png`
- Full desktop viewport evidence: `/Users/willsclaw/lattice/.audit/equipment-card-2026-08-08/equipment-card-desktop-viewport.png`
- Responsive evidence: `/Users/willsclaw/lattice/.audit/equipment-card-2026-08-08/equipment-card-mobile-top.png` and `/Users/willsclaw/lattice/.audit/equipment-card-2026-08-08/equipment-card-mobile-bottom.png`
- Side-by-side comparison: `/Users/willsclaw/lattice/.audit/equipment-card-2026-08-08/equipment-card-reference-comparison.png` (reference left, implementation right)
- Route and state: `/equipment`, CNC Milling selected, Beijing Jingdiao JDGR200T expanded, light theme, signed-in admin operating the customer workspace.
- Desktop viewport: 1440 × 1600 CSS px at device scale factor 1. Source pixels: 1923 × 818. Source was proportionally normalized to 1057 px wide for comparison. Implementation card: 1057 × 390 CSS/pixels at device scale factor 1; normalized source height: 450 px.
- Mobile viewport: 390 × 1000 CSS px at device scale factor 1. The card uses a two-column specification grid and stacked guidance/actions without horizontal page overflow.

**Findings**

- No actionable P0/P1/P2 visual, responsive, accessibility, copy, or interaction mismatches remain.
- [P3] The repository's existing Jingdiao image has a dark marketing background while the generated reference uses a clean white cutout. This is an intentional content-fidelity tradeoff: the implementation retains the known repository asset instead of substituting a newly generated representation of a real machine.

**Required Fidelity Surfaces**

- Fonts and typography: the implementation uses the app's existing sans-serif stack and preserves the reference hierarchy. The model name is the only large display value. All six technical values use the same 15 px semibold style and line height; labels use the same 12 px style. Long values wrap without changing weight or size.
- Spacing and layout rhythm: the implementation preserves the reference's compact identity header, unified six-field rail, three-part guidance row, and shallow action footer. At 390 px it intentionally expands vertically into a two-column specification grid and stacked guidance rows while retaining consistent spacing.
- Colors and visual tokens: white card surface, stone borders/text, blue data-sheet link, and black RFQ action match both the reference and the existing Lattice customer workspace. No customer-facing green verification/provenance state remains.
- Image quality and asset fidelity: the existing project image renders sharply with `next/image`, `object-contain`, and an explicit `Representative image` caption. No placeholder, CSS drawing, or generated replacement is used.
- Copy and content: the implementation matches the selected design's customer-safe content: supplier-reported capability, both envelopes, axes, spindle speed, control, Best for, Limitation, Qualification note, data sheet, and `Evaluate my part`. Supplier identity, source, review date, generic verification, and manufacturer-source actions are absent.

**Interaction and Browser Checks**

- The single accessible disclosure button collapses and reopens the Jingdiao details; `aria-expanded`, control label, and region visibility update correctly.
- `View technical data sheet` resolves to the Jingdiao PDF and opens as an external document.
- `Evaluate my part` resolves to `/requests/new`.
- Existing section filters, search, sorting, and card open/closed behavior remain covered by focused tests.
- Browser console check after the final desktop render: no warnings or errors.

**Comparison History**

1. Initial browser comparison found one P2 readability issue: `Supplier-reported capability` was truncated with an ellipsis in the six-column desktop rail.
2. Fix applied: removed forced label truncation so long labels wrap naturally while all values retain the same size and baseline treatment.
3. Post-fix evidence: `/Users/willsclaw/lattice/.audit/equipment-card-2026-08-08/equipment-card-reference-comparison.png`. The full label is visible, the implementation remains flatter than the source as requested, and no actionable P0/P1/P2 differences remain.

**Implementation Checklist**

- Done: compact responsive equipment-card layout.
- Done: consistent technical-value typography without per-value icons.
- Done: customer-safe guidance and qualified precision language.
- Done: internal-only provenance/review metadata removed from the customer card.
- Done: accessible accordion structure and working RFQ/data-sheet actions.
- Done: focused tests, typecheck, lint, production build, desktop comparison, mobile checks, interactions, and console inspection.

**Follow-up Polish**

- Optional P3: replace dark-background product imagery only when an approved same-model or actual-machine cutout is available from the supplier or manufacturer.

final result: passed

---

## 2026-08-10 — Plastics functional-selection rail

- Source visual truth: `/Users/willsclaw/.codex/generated_images/019fdde4-5359-7ce1-9212-6749e67ec507/exec-d0ec8a44-6a97-4e6e-8983-f3153067197a.png`
- Browser-rendered implementation: `/Users/willsclaw/lattice/.codex/plastics-functional-traits-viewport.png`
- Side-by-side comparison: `/Users/willsclaw/lattice/.codex/plastics-functional-traits-comparison.png` (selected design left, implementation right)
- Route and state: `/materials/plastics-polymers`, light theme, desktop viewport 1515 × 1078 CSS px at device scale factor 1.
- Source pixels: 1487 × 1058. Implementation pixels: 1515 × 1078. The source was proportionally normalized to 1515 × 1078 for the comparison; both use a 1.405 aspect ratio.

**Findings**

- No actionable P0/P1/P2 differences remain after the initial comparison identified an overly tall hero treatment. The plastics hero now uses the selected design's shallower 5:1 crop.
- The common-grade cards retain the target's single white-card treatment and replace the property rows with one restrained four-item functional rail. Mechanical-property copy and values are absent.

**Required Fidelity Surfaces**

- Fonts and typography: existing Lattice display and body hierarchy remains intact; the functional labels are compact, regular-weight supporting text and the trait values carry the sole emphasis.
- Spacing and layout rhythm: the shallower hero restores the intended compact handoff from overview to common grades; each rail aligns to the card's content grid with one quiet top divider.
- Colors and visual tokens: the white card, warm-gray dividers, charcoal type, and low-contrast functional icons match the selected neutral material-guide aesthetic.
- Image quality and asset fidelity: the approved plastics hero and grade imagery render through `next/image` with the expected crop; no substitute imagery or CSS-drawn imagery was introduced.
- Copy and content: the exact functional vocabulary is present and the page makes the correct RFQ data-sheet confirmation clear.

**Interaction and Browser Checks**

- Confirmed the route loads without console errors.
- Confirmed `Common grades` is visible and no `Reference properties` label is present on the plastics page.
- At 390 × 844, the page has no horizontal overflow (375 px `clientWidth` and `scrollWidth`) and no console errors.
- Focused component/page tests cover the common cards and expanded directory behavior.

**Comparison History**

1. Initial comparison found a P1 hero-height mismatch: the implementation's inherited 16:5 treatment was substantially taller than the selected plastics direction.
2. Fix applied: the Plastics / polymers hero uses a scoped 5:1 aspect ratio, retaining the existing treatment for every other material family.
3. Post-fix evidence: `/Users/willsclaw/lattice/.codex/plastics-functional-traits-comparison.png`. No actionable P0/P1/P2 differences remain.

**Implementation Checklist**

- Done: four-trait functional selection rail for all curated plastics grades.
- Done: exact resin/data-sheet RFQ guidance.
- Done: removed customer-facing plastics mechanical-property tables from common and expanded rows.
- Done: focused tests, typecheck, console check, and visual comparison.

**Follow-up Polish**

- No follow-up required for the selected direction.

final result: passed
