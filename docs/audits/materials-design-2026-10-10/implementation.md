# Approved first-page family atlas

2026-10-10: William selected concept A for the first Materials page, requested reversibility, and explicitly excluded sidebar changes.

Implemented locally in `src/components/material-family-atlas.tsx`, mounted only by `src/app/(workspace)/materials/page.tsx`:

- Left-side texture swatches using existing material images.
- Short family descriptions, current catalog counts, three existing example grades, and explicit Explore family affordances.
- The concept's heading/subtitle, availability note, unlisted-material link, and reference-condition footer.
- One/two/three-column responsive layout, readable secondary text, and visible keyboard focus.

The shared sidebar, family guides, material datasets, RFQ flow, and inquiry form are unchanged. The image's invented grade examples and logo are not copied into the implementation.

## Rollback

The complete original component remains untouched at `src/components/material-family-catalog.tsx`. In `src/app/(workspace)/materials/page.tsx`, change:

```tsx
import { MaterialFamilyAtlas } from "@/components/material-family-atlas";
// ...
<MaterialFamilyAtlas families={materialFamilies} />
```

back to:

```tsx
import { MaterialFamilyCatalog } from "@/components/material-family-catalog";
// ...
<MaterialFamilyCatalog families={materialFamilies} />
```

That restores the original page without reverting other workspace changes. Restore the previous page-test assertions for the absent inquiry link and four-column breakpoint if keeping the old layout. The new component can remain unused or be removed afterwards.

## Verification

- Typecheck passed.
- Targeted ESLint passed.
- Existing Materials overview, family-guide, and inquiry suites passed: 6 tests across 3 files; overview expectations were updated for the new link/layout.
- Browser reviewed desktop (1440 × 1000) and mobile (390 × 844); no mobile horizontal overflow was observed. The new inquiry link reaches the existing form without submission.
- Saved `implemented-desktop.jpg` and `implemented-mobile.jpg` as actual application previews. The desktop sidebar shown is the existing customer shell.
- React checklist: server-rendered stateless component, stable family keys, no extra client state or effects, decorative images/icons excluded from accessible names, native full-card links with focus rings.

No deployment was performed. Existing unrelated workspace changes were left in place.
