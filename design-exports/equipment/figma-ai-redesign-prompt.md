# Figma AI Prompt: Vendor Equipment Redesign

Redesign the Vendor Equipment page for Lattice OS using the provided screenshots, SVG, README, card-state spec, and redesign comments as source context.

## Important

Use the current UI files as the starting point. Preserve the page's information architecture, data model, and core interactions, but redesign the visual hierarchy, layout, controls, collapsed equipment rows, and expanded equipment details so the page feels like a premium Apple/Airbnb-caliber web product for serious manufacturing operations.

## Product Context

Lattice OS is a manufacturing RFQ and procurement operations platform. The product should operate similarly to Xometry, Fictiv, Hubs, or Protolabs, but it is specifically built for machine shops.

The platform is backed by an extensive network of machine shops in China that offer lower-cost custom machining and fabrication services. Domestic companies and machine shops can use Lattice to outsource work to this network so they can access additional machines, labor, materials, and process capabilities without taking on additional CAPEX.

The platform is especially useful when a domestic shop would otherwise no-quote a job because it is at capacity, does not have the right machines, does not have the right materials, lacks the labor to take on the work, or wants to advertise capabilities that it can fulfill through the Lattice supplier network even if those capabilities are not available in-house.

The Vendor Equipment page helps buyers, domestic shops, and operators understand real vendor capacity before routing an RFQ. It is not a marketing page. It is a dense, high-trust equipment catalog. Users should be able to look at these machines and understand what kinds of parts can be manufactured on the platform, where the platform's limits are, and which equipment is relevant to a specific RFQ. All equipment on this page is sourced directly from machine-shop contacts in China.

## Primary Design Goal

Make the page easier to scan, compare, filter, and trust so users can quickly understand whether the Lattice supplier network can support a specific job that might otherwise be no-quoted.

## Preserve

- App shell/sidebar context
- Page title: Vendor Equipment
- Vendor resources eyebrow
- Intro copy and catalog grouping concept
- Summary metrics:
  - Production machines: 200+
  - Sheet metal equipment: 27
  - ZEISS CMMs: 8
- Equipment sections:
  - CNC Milling
  - CNC Lathe
  - QC & Inspection
  - Manual Machines
  - Sheet Metal
  - Finishing
  - EDM
  - Die Casting
  - Additive Manufacturing
- Search, sort, and section-specific filters
- Collapsed and expanded equipment card behavior
- Source/provenance and supplier data sheet concepts
- Clear evidence that equipment data comes from real supplier contacts, not generic capability claims

## Required Output

Create a redesigned desktop page showing:

1. The top page/header area.
2. Summary capacity metrics.
3. Equipment section navigation or category jumping.
4. CNC Milling section with search, sort, and filters.
5. At least two collapsed equipment rows.
6. One expanded equipment row using Beijing Jingdiao JDGR200T.
7. Clear visual treatment for technical specs, machine image, fabricator notes, supplier data sheets, source/provenance, and external machine link.
8. A responsive mobile version.

## Collapsed Equipment Row Requirements

Collapsed rows should be compact and optimized for comparing many machines. Include:

- Expand/collapse control
- Section
- Quantity
- Make/model
- Equipment type
- Short summary
- Key capacity signals such as tolerance, envelope, RPM, power, or control

## Expanded Equipment Row Requirements

The expanded state should feel like a compact technical data room for one machine. Include:

- Same identity/header as collapsed state
- Machine image
- Technical detail grid
- Fabricator notes
- Supplier data sheets
- Source/provenance
- External machine/source link

## Expanded Example

Use Beijing Jingdiao JDGR200T.

Content:

- Section: CNC Milling
- Quantity: 1 set
- Make/model: Beijing Jingdiao JDGR200T
- Equipment type: 5-axis CNC milling machine
- Summary: High-speed small-envelope 5-axis Jingdiao machine.
- 3-axis envelope: 500 x 280 x 300 mm
- 5-axis envelope: Dia. 260 x H300 mm
- Best tolerance: +/-0.005 mm
- Max RPM: 32,000
- Control: JD50
- Fabricator note: High spindle speed makes this relevant for small fine-feature parts.
- Supplier data sheet: Jingdiao JDGR200T high-speed machining center
- Source: Zintilon, 2025-08-12

## Design Direction

Premium, calm, precise, operational, and high-trust. Think Apple-level restraint and Airbnb-level clarity, but adapted for industrial manufacturing and daily RFQ/vendor-routing work.

## Visual Style

- Light theme
- Warm white / graphite / soft gray base
- Subtle steel blue or muted green accents
- Thin borders
- Crisp typography
- Restrained shadows
- Real equipment imagery
- Compact, structured, comparison-friendly layout

## Avoid

- Generic SaaS dashboard widgets
- Marketing landing page hero treatment
- Large gradients
- Decorative blobs or glassmorphism
- Overly rounded cards
- Excessive whitespace that reduces catalog efficiency
- Hiding important machine capacity behind purely visual cards
- A flashy AI-startup look

## Design Judgment

Prioritize scanability and comparison. A user should quickly answer:

- What type of equipment is this?
- How many are available?
- What tolerances/envelopes/capacity signals matter?
- Which machines fit this RFQ?
- Can I trust the source and documentation?
- Would this equipment let me accept a job I might otherwise no-quote?
