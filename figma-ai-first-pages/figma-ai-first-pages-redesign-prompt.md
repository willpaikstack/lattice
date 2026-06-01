# Figma AI Prompt - Redesign Lattice Public Entry Pages

Redesign the first two public-entry pages for Lattice OS:

1. Homepage at `/`
2. Login page at `/login`

Use the attached current screenshots, source files, and product context as reference, but redesign the pages substantially. The goal is to create a premium, invite-only first impression for a serious manufacturing RFQ and procurement platform.

## Product Summary

Lattice OS is a private manufacturing RFQ, quote, procurement, and supplier-network workflow platform. It helps domestic companies and machine shops submit CAD-backed RFQs, receive quotes, manage supplier follow-up, and convert accepted quotes into production orders through a vetted overseas supplier network.

This is not a generic SaaS dashboard, and it should not feel like a broad marketing site. It should feel like a controlled, high-trust operating system for manufacturing procurement.

## Design Goal

Create homepage and login designs that feel like they were designed by a top-tier web product team at the level of Apple, Airbnb, Stripe, Linear, or Ramp, but grounded in manufacturing operations.

The result should feel:

- private
- premium
- precise
- manufacturing-literate
- trustworthy
- restrained
- operational
- modern without feeling trendy

## Required Screens

Create complete designs for:

### 1. Homepage `/`

Purpose: a minimal invite-only entry page with just enough product context to make Lattice feel credible and valuable.

Required elements:

- Lattice brand mark and name
- Clear invite-only positioning
- Strong homepage headline
- Short product explanation
- Primary CTA: `Log in`
- Secondary CTA: `Join waiting list` or `Request access`
- A visual system that communicates manufacturing RFQ/procurement, supplier network, CAD files, quotes, and production order flow

Keep navigation intentionally minimal. Do not add a full marketing nav.

Suggested content direction:

- Headline may remain `Lattice`, or become a literal category/offer such as `Private manufacturing procurement` if it improves clarity.
- Supporting copy should explain that Lattice moves teams from CAD files and drawings to quotes, supplier follow-up, and production orders.
- The first viewport should make the product feel tangible, not vague.

### 2. Login Page `/login`

Purpose: fast, private access for invited teams.

Required elements:

- Lattice brand mark/name, linked conceptually back to the homepage
- Eyebrow: `Invite-only access`
- H1: `Log in`
- Supporting copy
- Email field
- Password field
- Continue button
- Link for users without access: `Join the waiting list` or `Request access`

The login form should be prominent and extremely clear. Surrounding visual context should support trust, not distract.

## Design Direction

Preserve:

- invite-only positioning
- minimal public options
- the idea that this is a private workspace
- manufacturing/procurement domain language
- brand name: `Lattice`

Improve:

- hierarchy
- polish
- product specificity
- trust
- page-to-page consistency
- responsiveness
- visual richness
- the relationship between homepage and login page

## Visual Requirements

Use real manufacturing/product-system cues rather than generic decorative graphics. Good visual directions include:

- a high-quality manufacturing image treatment
- a subtle CAD/RFQ/procurement interface preview
- a refined system diagram showing CAD file -> RFQ -> quote -> order
- a product-shell preview that hints at the logged-in app without becoming a full dashboard mockup
- restrained industrial materials, precision, machining, inspection, or supplier-network details

Avoid:

- generic gradients
- purple/blue SaaS hero clichés
- abstract blobs/orbs
- fake stock-photo business people
- a busy marketing homepage
- open signup language
- pricing cards
- feature walls
- generic AI/productivity copy
- cartoon manufacturing illustrations

## Layout Requirements

Design desktop and mobile responsive versions.

Homepage:

- First viewport should be complete, premium, and clear.
- It should still hint that the product continues beyond the fold if you choose to include a lower section.
- Keep actions visible and obvious.

Login:

- Login form should be usable immediately.
- Ensure excellent field states, hover/focus states, and button styling.
- Include error/loading/signed-in state suggestions if helpful, but keep the primary design focused.

## Copy Constraints

Use concise copy. Prefer operational specificity over broad marketing language.

Approved phrases / concepts:

- Private manufacturing procurement
- Invite-only manufacturing procurement
- RFQ workspace
- CAD-backed RFQs
- Supplier follow-up
- Quotes
- Production orders
- Vetted supplier network
- Drawing-to-order workflow

Do not use:

- “AI-powered”
- “revolutionary”
- “one platform for everything”
- open marketplace positioning
- consumer-style lifestyle copy

## Deliverable

Produce a polished Figma design with:

- Homepage desktop
- Homepage mobile
- Login desktop
- Login mobile
- Clear component states for buttons, inputs, and links
- Enough visual detail for an engineer to implement faithfully in the existing Next.js/Tailwind app

Keep the design consistent with Lattice OS becoming a premium B2B operations console after login, while making the public entry pages feel more memorable and trustworthy than the current implementation.
