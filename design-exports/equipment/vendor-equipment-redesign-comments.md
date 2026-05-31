# Vendor Equipment Redesign Comments

Use these comments in Figma alongside the current UI screenshot or SVG import.

## Overall Direction

Redesign this as a premium manufacturing equipment catalog. It should feel calm, precise, and high-trust, but still dense enough for operators and buyers to use every day.

## Comments To Add

1. Sidebar and shell
   - Keep the persistent Lattice sidebar, but make the current page state and navigation hierarchy feel more refined.
   - The sidebar should feel like part of a premium operations console, not a placeholder menu.

2. Header
   - Preserve the title and intro content, but make the top area feel more designed.
   - Add clearer hierarchy between page purpose, catalog note, and summary metrics.
   - Avoid turning this into a marketing hero.

3. Summary metrics
   - Keep 200+ production machines, 27 sheet metal equipment, and 8 ZEISS CMMs.
   - Make these metrics feel like trust/capacity signals, not generic dashboard cards.

4. Section navigation
   - Add a compact way to jump between sections: CNC Milling, CNC Lathe, QC & Inspection, Manual Machines, Sheet Metal, Finishing, EDM, Die Casting, Additive Manufacturing.
   - This could be sticky, tab-like, or a compact anchor rail.

5. Filters and sorting
   - Search, sort, and preset filters are useful but currently feel plain.
   - Improve the control layout, active states, spacing, and scanability.
   - Preserve process-specific filters like 5-axis, 4-axis, +/-0.005 mm, Large envelope, CMM, ZEISS, Laser cutting, Forming, Welding, Wire EDM, SLA, and SLM.

6. Equipment rows
   - Rows should be easier to compare quickly.
   - Prioritize make/model, process, quantity, tolerance, work envelope, RPM/power/control, and short summary.
   - Consider a structured row/table hybrid rather than purely card-like blocks.

7. Expanded detail state
   - Design one strong expanded equipment example.
   - Include machine image, details grid, fabricator notes, supplier data sheets, source/provenance, and external machine link.
   - The expanded state should make technical details feel trustworthy and organized.

8. Visual style
   - Use a light, neutral industrial palette: warm white, graphite, soft gray, subtle steel blue or muted green accents.
   - Thin borders, crisp typography, restrained shadows.
   - Avoid decorative gradients, blobs, glassmorphism, generic SaaS widgets, and oversized rounded cards.

## Prompt Addition

Use the imported current UI as the starting point. Preserve the information architecture and interactions, but redesign the visual hierarchy, spacing, controls, equipment comparison rows, and expanded detail state so it feels like a senior Apple/Airbnb product designer refined a serious manufacturing operations tool.
