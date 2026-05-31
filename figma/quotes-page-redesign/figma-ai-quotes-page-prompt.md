
Redesign the Lattice OS **Quotes** page using the attached current UI screenshots/SVG as the starting point. This is a buyer-facing RFQ and quote tracking page for a manufacturing procurement platform.

The product context: Lattice OS helps domestic companies and machine shops route CNC machining and fabrication RFQs through a vetted supplier network. The Quotes page is where a buyer tracks submitted RFQs, missing-info requests, supplier review, priced quotes, and purchased quote history.

Please redesign only the main `/quotes` page content area. Keep the existing left sidebar/app shell direction consistent with the current Lattice OS design. The page should feel like a high-end B2B operations tool designed by a very strong Apple/Airbnb-caliber web product team: calm, precise, structured, premium, and highly scannable.

Important: do **not** add status filter tabs/chips back to the quote list. Those filters were intentionally removed. The list should remain search-only for now.

Current content and behavior to preserve:
- Page eyebrow: Marketplace workspace
- Page title: Quotes
- Page description: Track RFQ packages, pricing, lead times, supplier review, and buyer actions in one scannable queue.
- Summary metrics:
  - Active RFQs
  - Ready to accept
  - Needs info
- Search input for RFQ, part, or material
- Quote rows that open quote detail pages
- Row fields:
  - RFQ reference
  - status badge
  - quote/RFQ title
  - part name and material
  - process
  - quantity and due date
  - price
  - lead time
  - updated date
  - next step and short explanation
- Footer count: showing visible quotes out of total quotes

Design goals:
- Make the page easier to scan at a glance without making it feel sparse.
- Improve visual hierarchy between the summary metrics, search, and quote rows.
- Make the quote statuses feel meaningful and trustworthy, not like generic colored labels.
- Make buyer action states stand out clearly, especially Needs info and Ready to accept.
- Make pending values feel deliberate and readable.
- Improve the table/list row layout, spacing, hover state, and clickable affordance.
- Consider whether the rows should remain table-like, become dense cards, or use a hybrid list/card layout, but keep the result suitable for frequent operational use.
- Design polished desktop and mobile responsive states.

Constraints:
- Keep the design grounded in the current Lattice OS neutral/light operational palette.
- Avoid large marketing-style hero sections, decorative blobs/orbs, oversized empty cards, or generic SaaS fluff.
- Do not introduce a separate status filter bar.
- Do not hide core quote information behind menus or accordions.
- Do not redesign unrelated pages.

Output a redesigned Quotes page that can be implemented in React/Tailwind using the current app shell.

