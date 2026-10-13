# Steel card swatch replacements

2026-10-10. Built-in ImageGen; opaque backgrounds. Representative material surfaces for the Materials overview cards, not supplier or grade certification evidence.

Workspace assets:

- `public/materials/alloy-steel-machined-v4.png`
- `public/materials/tool-steel-ground-v4.png`

The atlas uses two local image overrides. Remove the `familySwatchOverrides` entries in `src/components/material-family-atlas.tsx` to restore the original swatches. Original v3 files, family dataset, and the original catalog component remain untouched.

Visual inspection: alloy steel has gunmetal reflection and machining scratches; tool steel has a brighter ground-metal finish with fine horizontal lines. Neither uses a woven or crosshatched surface.

## Alloy steel — exact final prompt

```text
Use case: product-mockup
Asset type: realistic material surface swatch for the Alloy steel card in a manufacturing material catalog.
Primary request: photographic macro close-up of solid machined alloy steel, clearly metal rather than fabric. Portrait composition 2:3. A flat steel billet surface fills the entire image, deep neutral gunmetal gray with soft silver directional specular highlights. Smooth rigid metal plane, shallow broad curved milling witness marks and subtle occasional straight machining scratches. Soft industrial studio light reflects across the surface as a broad luminous band. The central narrow vertical strip must remain unmistakably metallic when cropped to a 64 by 160 pixel card swatch.
Constraints: edge-to-edge material only, no background, no objects, no text or logo, opaque background. No woven patterns, no crosshatching, no mesh, no fibers, no leather, no glitter, no carbon fiber, no diagonal repeating textile-like pattern. Not an illustration or plastic. This is representative imagery, not a specific certified alloy specimen.
```

## Tool steel — exact final prompt

```text
Use case: product-mockup
Asset type: realistic material surface swatch for the Tool steel card in a manufacturing material catalog.
Primary request: photographic macro close-up of precision surface-ground tool steel. Portrait composition 2:3. Dense solid cool silver-gray steel fills the entire frame, with extremely fine linear grinding marks running horizontally and a subtle reflective sheen. A smooth rigid metallic plane, soft elongated studio reflection, slight tonal gradient across the surface; brighter than gunmetal alloy steel, understated and unmistakably steel. The central narrow vertical strip must remain clearly metallic when cropped to a 64 by 160 pixel card swatch.
Constraints: edge-to-edge material only, no background, no objects, no text or logo, opaque background. Avoid textile weave, crosshatching, knurling, checkerboards, mesh, fibers, carbon fiber, rough stippling, stone, cloth, leather or plastic. No sharp repeating diagonal patterns. This is representative surface imagery, not a specific certified grade.
```

