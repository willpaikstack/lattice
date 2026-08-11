# Aluminum offering directory design audit

Date: 2026-08-10

## Scope

The `All aluminum offerings` section on `/materials/aluminum`, focused on whether series-level accordions remain useful with 21 total offerings and mostly one to five items per group.

## User goal

Quickly establish that Lattice can source a relevant aluminum alloy in the required condition, stock form, and documentation state—and understand enough about that option to continue confidently into an RFQ.

## Evidence

1. `01-current-grouped-offerings.png` — 6000 series expanded with a table beneath it.
2. `02-current-collapsed-groups.png` — all series collapsed, showing eight sparse accordion rows.

## Assessment

### Strengths

- The page has a strong visual overview and a useful Common grades section before the long-tail directory.
- Individual offering rows already expose the right selection-oriented fields: alloy, UNS, available condition, use, form, machinability, and expandable properties.
- The accordion controls are semantically exposed as buttons, and expanded rows disclose real detail rather than duplicating summary content.

### Risks

- Eight accordions divide only 21 offerings, with four groups containing one or two items. The grouping costs more attention than it saves.
- Series descriptions dominate the collapsed state while the actual purchasable alloys are hidden. This makes the catalog feel smaller and more abstract.
- Users must repeatedly open groups to compare alloys across series, even though comparison is the primary task.
- “Other grades” weakens trust because it mixes inventory taxonomy with unresolved catalog hygiene.
- The directory communicates technical reference data better than it communicates supply-chain evidence. It answers “what is this alloy?” more clearly than “why should I trust Lattice to source it?”

### Accessibility risks visible from this screen

- The disclosure controls appear reasonably large, but repeated expand/collapse interactions add unnecessary keyboard and assistive-technology navigation.
- Light gray secondary descriptions and counts should be contrast-tested against the white background.
- A redesigned table must preserve horizontal scrolling at narrow widths and expose an accessible label or cue that more columns are available.

## Recommended direction: flat, evidence-led alloy directory

Replace the series accordions with one continuously visible offering table. Add compact filter chips above it: `All`, `1000`, `2000`, `3000`, `5000`, `6000`, `7000`, and `Casting/tooling`. Show the series as a quiet badge in each row rather than a structural container.

Each collapsed row should show:

1. Alloy and UNS designation.
2. Available conditions/tempers.
3. Common stock forms.
4. Best-fit application.
5. A customer-safe supply status such as `Common network stock`, `Sourced to order`, or `Confirm availability`, only where supported by real operational data.
6. Documentation signals such as `MTR available`, `Heat/lot traceability`, or `PMI available`, only where supported.

Expanded detail should retain selection guidance, machinability, and the five-property reference table with condition and source. This separates three customer questions cleanly: Is it available? Can it work for my part? What evidence supports the claim?

## Information hierarchy

1. `Available aluminum alloys` — 21 alloys, with a concise availability qualification.
2. Trust summary — documentation and verification practices that apply across the network.
3. Series filter chips — optional narrowing, never required to see inventory.
4. Flat offering rows — all alloy names visible by default.
5. Expanded technical detail — properties, selection guidance, source, and condition.

## Grouping rule

Use accordion grouping only when a family has enough entries that scanning the full list becomes burdensome—roughly six or more offerings per group and at least three substantial groups. Otherwise use a flat list with filters. The template may choose its presentation based on catalog density while retaining the same row component.

## Evidence limits

This audit used the rendered desktop screen and DOM structure. Keyboard focus visibility, screen-reader announcements, color contrast ratios, mobile horizontal-scroll affordance, and the truth of supply-chain documentation claims require implementation-level verification.
