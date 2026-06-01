# Current UI Notes

## Current Homepage (`/`)

Current content:

- Brand mark and `Lattice`
- Eyebrow: `Invite-only manufacturing procurement`
- H1: `Lattice`
- Supporting copy: `A private RFQ and procurement workspace for teams moving from drawings to quotes, supplier follow-up, and production orders.`
- Primary action: `Log in`
- Secondary action: `Join waiting list`
- Background image: `/equipment/hermle-five-axis-cell.jpg`

Current issues / opportunities:

- The page is clean but too sparse and under-explains the product value.
- It does not give enough signal that Lattice is a serious RFQ/procurement operating system.
- The hero image is useful, but the overlay-heavy treatment makes the product feel more like a holding page than a high-end web product.
- The login and waiting-list choices are correct and should remain constrained.

## Current Login Page (`/login`)

Current content:

- Brand mark linking back to `/`
- Eyebrow: `Invite-only access`
- H1: `Log in`
- Supporting copy: `Access the private RFQ and procurement workspace for active Lattice teams.`
- Form fields: Email, Password
- Button: `Continue`
- Link: `Join the waiting list`
- Form action currently points to `/dashboard` for demo access.

Current issues / opportunities:

- The login page is functional but feels generic.
- It should feel connected to the homepage as part of the same public-entry system.
- It should make invited users feel like they are entering a private operational workspace.
- It can include subtle manufacturing/procurement context around the form, but should not distract from fast login.

## Flow Constraints

Keep the flow simple:

1. New or public user lands on `/`.
2. Invited user clicks `Log in`.
3. Non-invited user clicks `Join waiting list` / `Request access`.
4. Login page gets the user into the workspace.

Do not add:

- public signup
- open marketplace browsing
- pricing page navigation
- blog/resources navigation
- multi-step onboarding
- unnecessary product tour

## Responsive Requirements

Design both pages for:

- desktop
- tablet / narrow desktop
- mobile

Make sure text never overlaps or becomes tiny. On mobile, keep the primary action obvious and avoid hiding the login path.
