# Design QA — Manufacturing Proof Landing Page

## Target

- Reference: `.codex-audits/landing-page-2026-08-11/mockups/02-manufacturing-proof-v2.png`
- Route: `http://localhost:3010/`
- Desktop viewport: 1440 × 1024
- Mobile viewport: 390 × 844

## Comparison history

1. Initial implementation: failed — desktop headline wrapped to three lines and sat too high relative to the reference.
2. First refinement: failed — expanded text area revealed the second line beneath the image layer.
3. Final refinement: passed — headline matches the two-line composition, keeps the CNC subject unobstructed, and maintains the reference hierarchy through the proof strip and inspection section.

## Functional QA

- `How it works` moves focus to the workflow section: passed.
- `Start your quote` navigates to `/simple-quote`: passed.
- Desktop and 390 px mobile layouts remain readable without horizontal overflow: passed.
- Browser console errors: none.

## Severity audit

- P0: none.
- P1: none.
- P2: none.

Final result: passed

---

## 2026-08-11 — Polymer material-behavior disclosure

- Source visual truth: `/Users/willsclaw/.codex/generated_images/019fdde4-5359-7ce1-9212-6749e67ec507/exec-46e0beeb-bed6-48aa-a6ba-feda0796cc9d.png`
- Browser-rendered implementation: `/Users/willsclaw/lattice/.codex/plastics-material-behavior-implementation.png`
- Side-by-side comparison: `/Users/willsclaw/lattice/.codex/plastics-material-behavior-comparison.png` (selected direction left, implementation right)
- Route and state: `/materials/plastics-polymers`, first long-tail polymer profile expanded, light theme, desktop and 390 × 844 responsive checks.

**Findings**

- No actionable P0/P1/P2 differences remain. The implementation preserves the selected visual's compact centered disclosure, flush expanded region, small `Material behavior` eyebrow, and 2 × 2 trait structure.

**Required Fidelity Surfaces**

- Fonts and typography: compact disclosure text and trait labels preserve the page's existing hierarchy; trait values are the clear visual emphasis.
- Spacing and layout rhythm: the disclosure is a shallow continuation of each row, while the open state adds breathable 2 × 2 details without a nested card.
- Colors and visual tokens: white surface, hairline stone dividers, and neutral line icons match the source direction.
- Image quality and asset fidelity: no image assets were added or changed; existing material imagery stays intact.
- Copy and content: the exact four functional dimensions are preserved with contextual notes that direct exact-grade confirmation to RFQ review.

**Interaction and Browser Checks**

- Opening `Material behavior` exposes the functional-trait grid; the native disclosure toggles correctly.
- At 390 px, the expanded state has no horizontal overflow (375 px `clientWidth` and `scrollWidth`).
- Browser console: no errors.

**2026-08-11 refinement**

- The disclosure control now measures 27 px high in-browser and has a reduced visual weight.
- The expanded desktop grid was rechecked: both right-hand cells report a `0px` bottom border; only the intended central vertical divider remains.

**2026-08-11 ownership refinement**

- Selected visual target: option showing the behavior trigger below machinability.
- Live implementation: `Behavior details` is aligned with the machinability column, while its expanded detail grid spans the complete row.
- Browser check: disclosure opens correctly, all four traits are present, desktop panel width matches its 871 px row, and the document has no horizontal overflow.

**2026-08-11 disclosure coordination**

- Opening the first and then second `Behavior details` disclosure leaves exactly one native `details[open]` element on the plastics page.
- The active panel continues to expose its functional traits after the first panel closes.

**Implementation Checklist**

- Done: shared native disclosure for common and directory polymer rows.
- Done: flush 2 × 2 detailed trait layout.
- Done: focused tests, typecheck, lint, desktop/mobile interaction checks, and visual comparison.

final result: passed

---

# How It Works workflow timeline — design QA

**Source visual truth**

- Selected reference: `/Users/willsclaw/.codex/generated_images/019ffcff-34a2-70d0-9522-303b3146ba49/exec-292ee34a-f47c-47dd-9691-c7ce4a515f09.png`
- Source pixels: `1491 × 1055`.
- Intended state: light-theme desktop workflow with four horizontal steps, a shallow directional path, compact semantic icons, and no redundant supporting paragraph under the section title.

**Implementation evidence**

- Browser-rendered desktop: `/Users/willsclaw/lattice/.codex/how-it-works-workflow/desktop-final.png`
- Browser-rendered mobile: `/Users/willsclaw/lattice/.codex/how-it-works-workflow/mobile-workflow.png`
- Side-by-side comparison, reference left and implementation right: `/Users/willsclaw/lattice/.codex/how-it-works-workflow/comparison.png`
- Route: `http://localhost:3000/how-it-works#workflow-steps`

**Viewport and normalization**

- Desktop override: `1440 × 1200`; the in-app browser reported a `1265 × 720` CSS viewport at DPR 2 and produced a normalized `1265 × 712` screenshot.
- Mobile override: `390 × 844`; the page reported a `375px` content width and the saved browser capture is `375 × 812`.
- The side-by-side evidence scales both source and implementation to `1200px` width and pads them to the same comparison height. Browser chrome and the existing first-job context are treated as expected surrounding-page differences.

**Full-view comparison evidence**

- The desktop implementation preserves the reference hierarchy: eyebrow, large workflow heading, numbered directional path, and four equal step columns.
- The production page intentionally retains the approved, more detailed workflow copy and the existing first-job guidance above the section. These product constraints increase vertical density but do not change the selected horizontal composition.
- The wider page container gives the four columns enough room without colliding with the collapsed contents rail.

**Focused-region comparison evidence**

- The final focused workflow capture confirms that the path passes through the center of all four numbered milestones, curves shallowly between them, and ends in one right-facing arrow.
- Lucide `FileText`, `ClipboardCheck`, `Handshake`, and `FileCheck2` icons replace the earlier generic or oversized icon treatment and remain visually consistent with the rest of the page.
- Column dividers, centered headings, body hierarchy, and warm background align with the selected reference while using the page's existing slate tokens.

**Required fidelity surfaces**

- Fonts and typography: existing project font, weights, tracking, and slate hierarchy are preserved; the desktop title gains the reference's stronger display scale.
- Spacing and layout rhythm: four equal desktop tracks, centered milestones, restrained column rules, and generous timeline separation match the reference's left-to-right rhythm.
- Colors and visual tokens: the existing warm page background and slate palette are retained; the directional path uses a quiet slate-blue rather than the earlier bright or heavy treatment.
- Image quality and asset fidelity: the transparent workflow-path asset is sharp at the rendered size, has no background halo, and is reserved for the non-semantic decorative curve; milestones and copy remain semantic HTML.
- Copy and content: all approved manufacturing-package, validation, production-launch, and quality-review copy remains intact.

**Comparison history**

1. Initial browser render: P2 — the path crossed the tops of the numbered circles rather than their centers, weakening the intended sense of continuity.
2. Fix: increased the path layer height and aligned milestone centers with the path baseline.
3. Post-fix evidence: `desktop-final.png` shows a continuous centered path through all four milestones; no actionable P0/P1/P2 differences remain.

**Interaction and browser checks**

- Desktop horizontal sequence: passed.
- Mobile stacked sequence: passed.
- Mobile horizontal overflow: none (`clientWidth` and `scrollWidth` both `375px`).
- Browser console errors or warnings after the final render: none.

**Implementation checklist**

- [x] Directional path and numbered milestones align.
- [x] Four semantic icons match their workflow steps.
- [x] Desktop layout reads left to right.
- [x] Mobile layout stays stacked and readable.
- [x] Focused tests, typecheck, lint, and browser checks pass.

**Follow-up polish**

- None required for this scoped change.

final result: passed

---

# How It Works benefit disclosures — design QA

**Source visual truth**

- Desktop: `/Users/willsclaw/.codex/visualizations/2026/08/15/01a0069a-6077-7920-b293-47931e7a1106/lattice-value-audit/01-current-section.png`
- Mobile: `/Users/willsclaw/.codex/visualizations/2026/08/15/01a0069a-6077-7920-b293-47931e7a1106/lattice-value-audit/02-mobile-section.png`
- Selected change: replace the static benefit grid with four full-width disclosure rows, collapsed by default, with one expanded panel at a time.

**Implementation evidence**

- Desktop expanded: `/Users/willsclaw/.codex/visualizations/2026/08/15/01a0069a-6077-7920-b293-47931e7a1106/lattice-value-implementation/04-desktop-expanded-final.png`
- Mobile expanded: `/Users/willsclaw/.codex/visualizations/2026/08/15/01a0069a-6077-7920-b293-47931e7a1106/lattice-value-implementation/05-mobile-expanded-final.png`
- Route: `http://localhost:3000/how-it-works#value`

**Viewport and normalization**

- Desktop browser viewport reported `1298 × 1354` CSS px at DPR 2. Source and implementation saved captures are both `1283 × 1338` px, so no additional scale normalization was required.
- Mobile browser override was `390 × 844` CSS px at DPR 2. Source and implementation saved captures are both `375 × 812` px, so no additional scale normalization was required.
- Theme: light. State: desktop `More capacity` expanded; mobile `Managed quality` expanded.

**Full-view comparison evidence**

- The surrounding page grid, reading-column width, heading hierarchy, warm page background, section rules, and origin-story placement remain consistent with the source capture.
- The intended section change is contained within `What Lattice adds`; it does not alter the workflow or closing sections.
- The full-width disclosure stack uses the existing slate borders, pale card fill, blue accent, radius, typography, and Lucide icon treatment already present on the page.

**Focused-region comparison evidence**

- Desktop: the four benefits remain visible at a glance, while the selected row exposes three supporting points without shifting content horizontally or creating unequal grid cards.
- Mobile: the disclosure stack reflows without horizontal overflow; summaries wrap naturally, the expanded content remains readable, and the next benefit stays reachable below it.
- Interaction: buttons expose `aria-expanded` and `aria-controls`, the open content is a labelled region, one panel remains open at a time, controls retain native keyboard activation, and reduced-motion styles are present.
- Browser console: no errors or warnings were reported during desktop and mobile interaction checks.

**Findings**

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: existing family, weights, sizes, line heights, and hierarchy are preserved.
- Spacing and layout rhythm: row padding, icon sizing, dividers, and expanded-list spacing align with the source page's established rhythm.
- Colors and visual tokens: existing slate, white, warm background, and `#1d73ff` accent are reused; no new competing palette was introduced.
- Image quality and asset fidelity: this section has no raster imagery. Icons use the project's existing Lucide library and remain sharp at both viewports.
- Copy and content: collapsed summaries are unchanged; expanded copy adds operational detail without exposing manufacturing-partner identity.

**Comparison history**

- Iteration 1: the initial keyboard-focus treatment appeared heavier than the page's surrounding controls in browser capture (P2 polish/fidelity issue).
- Fix: replaced the dark inset ring treatment with the page's blue focus-outline treatment while retaining a visible keyboard state.
- Post-fix evidence: final desktop and mobile captures show the intended open-state blue accent without the earlier heavy border.

**Implementation checklist**

- [x] Four summaries remain visible when collapsed.
- [x] Only one detail region opens at a time.
- [x] Desktop and mobile layouts visually verified.
- [x] Accessible state and keyboard behavior covered.
- [x] Browser console checked.
- [x] Focused tests, typecheck, lint, and diff whitespace checks pass.

**Follow-up polish**

- None required for this scoped release.

final result: passed
