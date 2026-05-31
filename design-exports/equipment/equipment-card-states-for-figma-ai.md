# Equipment Card States For Figma AI

Use this content when asking Figma AI to redesign the Vendor Equipment page. The design must show both collapsed and expanded equipment card states.

## Required Card States

Design both of these states in the same page mockup:

1. Collapsed equipment row/card
2. Expanded equipment row/card

The catalog will contain many equipment records, so the collapsed state should be compact and highly scannable. The expanded state should support deeper technical review without making the whole page feel heavy.

## Collapsed State Requirements

Collapsed cards should let a buyer/operator compare machines quickly.

Include:

- Expand/collapse affordance
- Equipment section
- Quantity
- Make/model
- Equipment type
- Short summary
- Key capacity signals

Example collapsed content:

```text
Section: CNC Milling
Quantity: 1 set
Make/model: Beijing Jingdiao JDGR200T
Equipment type: 5-axis CNC milling machine
Summary: High-speed small-envelope 5-axis Jingdiao machine.

Capacity signals:
- Tolerance: +/-0.005 mm
- Envelope: 500 x 280 x 300 mm
- RPM: 32,000
```

Additional collapsed examples:

```text
Section: CNC Milling
Quantity: 4 sets
Make/model: Beijing Jingdiao JDGR400T
Equipment type: 5-axis CNC milling machine
Summary: Jingdiao 5-axis milling capacity for small to mid-size precision parts.
Capacity signals: +/-0.005 mm, 450 x 680 x 400 mm, 20,000 RPM
```

```text
Section: QC & Inspection
Quantity: 3 sets
Make/model: ZEISS CONTURA 7/10/6 RDS
Equipment type: Coordinate measuring machine
Summary: ZEISS CMM capacity for dimensional inspection and first-article verification.
Capacity signals: CMM, dimensional inspection, calibration traceability
```

## Expanded State Requirements

Expanded cards should feel like a compact technical data room for one machine.

Include:

- Same top identity as collapsed state
- Large machine image or equipment image
- Details/specification grid
- Fabricator notes
- Supplier data sheets/download links
- Source/provenance
- External machine/source link

Example expanded content:

```text
Section: CNC Milling
Quantity: 1 set
Make/model: Beijing Jingdiao JDGR200T
Equipment type: 5-axis CNC milling machine
Summary: High-speed small-envelope 5-axis Jingdiao machine.

Machine image:
/equipment/jingdiao-jdgr200t.jpg

Technical details:
- 3-axis envelope: 500 x 280 x 300 mm
- 5-axis envelope: Dia. 260 x H300 mm
- Best tolerance: +/-0.005 mm
- Max RPM: 32,000
- Control: JD50

Fabricator notes:
- High spindle speed makes this relevant for small fine-feature parts.

Supplier data sheets:
- Jingdiao JDGR200T high-speed machining center
- Source: JINGDIAO

Source/provenance:
- Source: Zintilon
- Source date: 2025-08-12
- Include image source link
- Include external machine page icon/link
```

## Layout Guidance

For collapsed rows:

- Make rows feel closer to a premium comparison table than large marketing cards.
- Keep vertical height controlled.
- Make quantity, process, tolerance, envelope, and RPM easy to compare.
- Use subtle chips or compact spec cells.

For expanded rows:

- Keep the expanded state nested under the same card, not as a modal.
- Use a two-column layout on desktop: image on the left, technical details and provenance on the right.
- On mobile, stack image, specs, notes, data sheets, and source.
- Use clear section labels, but avoid noisy borders everywhere.
- Source/provenance should be visible but visually secondary.

## What To Improve

- The current collapsed cards are readable but could compare faster.
- The current expanded state has the right content but needs better spacing, image treatment, detail hierarchy, and visual polish.
- The design should clearly distinguish "quick scan" information from "deep review" information.
- Make the expand/collapse affordance more elegant and discoverable.

## Prompt Snippet

Add this to the Figma AI prompt:

```text
Important: show both collapsed and expanded equipment card states. The collapsed state should be compact and optimized for comparing many machines. The expanded state should reveal a machine image, technical detail grid, fabricator notes, supplier data sheets, source/provenance, and external links. Use the Beijing Jingdiao JDGR200T as the expanded example and include at least two additional collapsed equipment rows below it.
```
