# Bubble UI/UX Reference for Lattice OS

Source inspected: William's open Bubble editor for the `Lattice` app on macOS.

Purpose: capture what is useful from the Bubble prototype so the local owned-code Lattice OS app can inherit the product intent and improve the UI/UX without copying Bubble implementation constraints.

Detailed page-by-page runtime audit: [`docs/bubble-page-audit.md`](./bubble-page-audit.md).

---

## 1. High-level observation

The Bubble prototype is already pointing toward a **light-mode B2B operations dashboard** rather than the current local app's darker cyan startup-dashboard style.

The Bubble UI feels closer to:

- clean SaaS admin console
- procurement / RFQ control center
- light workspace with left navigation
- dashboard cards and activity lists
- manufacturing-resource catalog structure

This is a better direction for Lattice than the current local UI's dark/cyan look.

---

## 2. Pages visible in Bubble

The Bubble editor's page manager shows these web pages:

- `index`
- `old_index`
- `account_details__team_members`
- `project_management`
- `analytics`
- `request_quote`
- `checkout_page`
- `sample_upload_page`
- `fabrication_capabilities`
- `test_page_dashboard`
- `materialscatalog_page`
- `thank_you_page`
- `materialspage_-_copy`
- `reset_pw`
- `my_orders`
- `404`
- `my_quotes_`

Visible reusable elements include:

- `Base - Reusable element`
- `RE - Sidebar Navigation`
- `Floating Group - Header`
- `Material Card - Reusable`
- `Materials Dropdown`
- `RFQ - General Tolerance Dropdown`
- `RFQ - Materials`
- `RFQ - Surface Finish Dropdown`
- `Quality Documentation Require...`

There is also a folder/section for reusable elements related to the Request Quote page.

---

## 3. Main dashboard / index page structure

The visible Bubble `index` page includes:

### Left sidebar

The sidebar appears to be a persistent app navigation rail.

Visible sections:

- top logo area
- primary action button: `Request Quote`
- `ADMIN`
  - Home
  - Analytics
  - Project Management
- `MANAGE`
  - Our Quotes
  - Our Orders
- `RESOURCES`
  - Materials
  - Capabilities

UI traits:

- light background
- muted gray text/icons
- section labels in uppercase with letter spacing
- simple line icons
- one prominent action button near the top
- fixed-width sidebar, around 240px

### Main dashboard content

Visible main page heading:

- `Hi Current User's First Name`

Visible metric cards:

- `Active RFQs`
  - `34`
  - `43 unread quotes`
- `Orders`
  - `1,253`
  - `10 status changes`

Visible activity/inbox section:

- `Inbox`
- rows with placeholder notification bodies

Visible transactions section:

- `Transactions`
- subtitle: `Here are your latest quotes with status changes`
- `View All` button
- table-like list with:
  - User
  - Amount
  - sample user: Jasmine Jones
  - sample amount: `$900.00`

---

## 4. Design language worth keeping

### Keep: light B2B operations feel

Bubble is closer to the right product feel than the current local dark UI.

Recommended direction:

- light background
- black/dark gray text
- calm neutral borders
- large readable headings
- structured cards
- restrained accent color
- professional rather than flashy

### Keep: persistent sidebar navigation

The sidebar is useful because Lattice will likely have several operational areas:

- Dashboard / Home
- RFQs / Quotes
- Orders
- Projects
- Materials
- Capabilities
- Team / Account settings

The local app should eventually use a real app shell with persistent navigation rather than each page feeling isolated.

### Keep: prominent `Request Quote` action

The Bubble prototype correctly makes `Request Quote` a primary call-to-action.

In local Lattice OS, this maps to:

```text
/requests/new
```

### Keep: dashboard cards

The `Active RFQs` and `Orders` cards are a good pattern for the Lattice command center.

They should eventually become real metrics:

- active RFQs
- waiting on buyer info
- ready for supplier RFQ
- supplier quotes received
- orders in progress
- late/at-risk work

### Keep: resource catalog concept

The Bubble pages for `materials`, `fabrication_capabilities`, and reusable RFQ dropdowns suggest a strong product idea:

Lattice should not just be a request form; it should guide users through manufacturing-specific choices.

Examples:

- materials catalog
- fabrication capabilities
- tolerances
- surface finishes
- quality documentation requirements

This is important and should inform the local app roadmap.

---

## 5. Things to improve when rebuilding locally

### Improve: replace generic placeholder content

Bubble currently has placeholders like:

- `Parent group's Notification's Body`
- `Jasmine Jones`
- `$900.00`

The local app should use realistic manufacturing/procurement content:

- buyer company names
- RFQ titles
- part names
- process types
- supplier quote states
- due dates
- owner assignments
- next actions

### Improve: make information architecture clearer

Bubble has pages for quotes, orders, projects, materials, capabilities, request quote, checkout, upload, account/team.

For local Lattice, the likely top-level navigation should be more intentional:

- Dashboard
- RFQs
- Orders
- Suppliers
- Materials
- Capabilities
- Team / Settings

### Improve: separate buyer-facing and operator-facing experiences

Bubble mixes buyer/customer-facing actions like `Request Quote` with admin/operator areas like Analytics and Project Management.

The local app should define roles more clearly:

- Buyer portal
- Lattice operator console
- Supplier-facing quote workflow
- Admin/settings

### Improve: make status/action orientation stronger

The Bubble dashboard shows metrics and transactions, but the local Lattice app should emphasize operational next actions:

- needs review
- missing buyer info
- ready to send to suppliers
- waiting on supplier quotes
- quote comparison ready
- purchase order needed
- order in production

---

## 6. Recommended local UI direction

Based on the Bubble prototype, the local Lattice OS UI should move toward:

```text
Light-mode B2B operations console
with a persistent left sidebar,
clean metric cards,
RFQ/order tables,
and manufacturing-specific guided forms.
```

The current local app should be redesigned away from:

- dark/cyan startup dashboard look
- isolated page layouts
- generic app shell

And toward:

- white / off-white workspace
- neutral gray borders
- black text
- subtle blue/indigo or industrial accent
- left sidebar app navigation
- dashboard cards
- table/list-heavy operational screens
- clear next-action buttons

---

## 7. Mapping Bubble concepts to local app routes

| Bubble concept | Local Lattice route/component |
|---|---|
| `index` dashboard | `/` command center/dashboard |
| `request_quote` | `/requests/new` buyer request form |
| `my_quotes_` / `Our Quotes` | `/operator/requests` or future `/quotes` |
| `my_orders` / `Our Orders` | future `/orders` |
| `project_management` | future `/projects` or `/operator/projects` |
| `analytics` | future `/analytics` |
| `materials_catalog_page` | future `/materials` |
| `fabrication_capabilities` | future `/capabilities` |
| `account_details__team_members` | future `/settings/team` |
| `sample_upload_page` | future upload step inside RFQ/request flow |
| reusable RFQ dropdowns | typed React form components for materials/tolerances/finishes |

---

## 8. Recommended next build step

Create a visual redesign sketch for the local app inspired by Bubble, then implement it.

First redesign target:

```text
Local Lattice app shell + dashboard + operator queue
```

Specifically:

1. Add persistent light-mode app shell with left sidebar.
2. Redesign `/` as a dashboard similar in spirit to Bubble's `index` page.
3. Redesign `/operator/requests` as a clean RFQ operations table/list.
4. Keep `/requests/new` but make it visually align with the new light B2B design.

Suggested implementation files:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/components/app-shell.tsx`
- `src/components/request-form.tsx`
- `src/components/operator-queue.tsx`

---

## 9. Visual principles for the redesign

Use these as design rules:

- Light theme first.
- Sidebar navigation should be persistent on app pages.
- Use metric cards for command-center summaries.
- Use tables/lists for operational RFQ/order work.
- Prefer plain language over clever labels.
- Make primary actions obvious: `Request Quote`, `Review RFQ`, `Send to Suppliers`, `Compare Quotes`.
- Make manufacturing attributes first-class: process, material, tolerance, finish, quantity, due date, files, quality requirements.
- Avoid decorative dark gradients unless there is a deliberate brand reason.

---

## 10. Key takeaway

Bubble should be used as the UI/UX reference for product intent:

- app shell
- sidebar
- dashboard cards
- RFQ/order/resource areas
- material/capability catalogs
- guided RFQ fields

The local owned-code app should not copy Bubble's implementation, but it should inherit the useful structure and improve it into a cleaner, more scalable Lattice OS design system.
