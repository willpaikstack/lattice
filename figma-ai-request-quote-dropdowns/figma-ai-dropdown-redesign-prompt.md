# Figma AI Prompt: Request Quote Dropdown Redesign

Redesign the dropdown/select experience for the Lattice OS Request Quote page using the attached JPG/SVG files as context.

## Product Context

Lattice OS is a premium B2B manufacturing platform for submitting RFQs, configuring parts, reviewing quotes, and managing production orders. The Request Quote flow is where a buyer uploads CAD files and configures manufacturing requirements before Lattice creates an RFQ package.

This page should feel like a high-end operations console: calm, precise, trustworthy, and efficient. It should not feel like a generic form or a consumer checkout page. The target quality bar is closer to Apple/Airbnb-level product design, but adapted for a dense industrial workflow.

## What To Redesign

Focus specifically on the dropdowns/select controls in the RFQ configuration form:

- Material
- Surface Finish
- General Tolerances
- Manufacturing Process
- Quality Documentation

Use the attached current-state assets to understand the current content, option labels, field sizes, page context, and the problems with the native browser dropdown UI.

## Current Problems

The current dropdowns are native browser selects, so the open menus feel visually disconnected from the rest of the app. They have harsh borders, oversized native option rows, default blue selection styling, and inconsistent shadows. The long Surface Finish menu in particular feels clumsy and visually heavy.

The redesigned dropdowns should feel custom, refined, and integrated into Lattice OS.

## Design Direction

Create a polished custom dropdown component system with these states:

- Closed
- Hover
- Focus
- Open
- Selected option
- Keyboard-highlighted option
- Disabled
- Error or missing required value
- Long-list scrolling state

The closed field should feel quiet and precise, with a subtle border, balanced height, strong readability, and a clear chevron affordance. The open menu should feel elevated but restrained, with soft shadow, rounded corners, careful spacing, and no harsh browser-default styling.

For long lists, especially Surface Finish, design a menu that remains usable without overwhelming the page. Consider search, grouped options, pinned common options, helper metadata, or compact row treatment if it improves clarity.

## Content Requirements

Preserve the manufacturing-specific content and labels from the attached assets. Do not replace the dropdowns with generic placeholder options.

The design must support:

- Short options like `SS 304`
- Long options like `As machined (Ra 3.2 um / Ra 126 uin)`
- Technical manufacturing language
- Many options in one dropdown
- A selected value that may be wider than the field on smaller screens

## Visual Requirements

Use the existing Lattice OS visual language:

- Off-white page background
- White surfaces
- Graphite/black primary text
- Muted gray secondary text
- Quiet 1px borders
- Restrained blue focus/accent states
- Subtle shadows only where elevation is useful
- Small-radius, professional B2B interface style

Avoid loud color, decorative gradients, oversized marketing UI, pill-heavy styling, or anything that feels playful rather than precise.

## Output Needed

Create a Figma design showing:

- The dropdowns in context on the Request Quote page
- A component/spec board with each dropdown state
- An open Material dropdown
- An open Surface Finish dropdown with long-list behavior
- An open General Tolerances dropdown
- An open Manufacturing Process dropdown
- An open Quality Documentation dropdown
- Mobile/responsive behavior if the dropdown field width is constrained

Prioritize an implementation-ready component system that can be recreated in React/Tailwind without relying on native browser select styling.
