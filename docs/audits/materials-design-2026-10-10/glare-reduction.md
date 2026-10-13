# Reduce glare on three material cards

2026-10-10. Built-in ImageGen edit mode; one lighting-only edit per existing image. Inspected all input and output images. Removed strong reflected bands, preserving gray metal tones, machining marks, portrait framing, and opaque background.

## Final workspace paths

- alloy-steel: `public/materials/alloy-steel-matte-v5.png` (previous `alloy-steel-machined-v4.png` retained).
- stainless-steel: `public/materials/stainless-matte-v5.png` (previous `stainless-ground-v4.png` retained).
- precision-alloys: `public/materials/precision-alloy-matte-v5.png` (previous `precision-alloy-ground-v4.png` retained).

Only the three atlas image overrides changed. Restore their previous paths to roll back. Other cards, sidebar, and family guides are unchanged.

## Exact prompt (used for each image)

```text
Use case: lighting-weather
Asset type: edited material surface swatch for a manufacturing catalog.
Input image: edit target.
Primary request: REMOVE the strong specular glare stripe from this metal surface. Replace the bright reflected band with very even diffuse lighting across the entire image. The surface should read as matte satin metal with only very subtle broad tonal variation; no bright vertical or diagonal stripe and no hotspot anywhere.
Constraints: change lighting/reflection only; preserve the original metallic gray family, surface machining/grinding marks, solid metal texture, portrait dimensions, framing and opaque background. Keep metal recognizable, never cloth, stone or flat featureless color. No text, logo, additional objects or background. Substantially reduce light/dark contrast across the surface, including the narrow central crop used by the card.
```

