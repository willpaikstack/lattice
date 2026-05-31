Design a new buyer-facing Quote Detail page, the page that the user will see when they click on a specific quote.

I want a fresh design that matches the premium, calm, operations-focused direction of the redesigned Vendor Equipment and Quotes pages. Think of the quality bar as something designed by senior Apple or Airbnb web product designers: refined spacing, quiet hierarchy, excellent scanability, restrained color, and no generic SaaS clutter.

## Product Context

Lattice OS is a manufacturing RFQ and procurement platform for machine shops and industrial buyers. Buyers submit RFQs with CAD files, quantities, material, due dates, and notes. Lattice reviews the package, gets supplier pricing, and presents a buyer-ready quote.

This page is where a buyer reviews one specific quoted RFQ before deciding whether to purchase.

## Page Purpose

Help the buyer quickly understand:

- What part / RFQ this quote is for
- Whether the quote is ready, pending, needs info, or purchased
- The quoted price and lead time
- What manufacturing process, material, quantity, tolerance, and finish are included
- What files and assumptions were reviewed
- What the buyer should do next with a clear flow for it converting into an order.

## Design Requirements

- This is a detail template opened from a row in the Quotes page.
- Keep the existing Lattice OS sidebar style
- The main page should feel like a clean quote review workspace, not a marketing page.
- Prioritize a strong top summary area with the quote title, RFQ reference, status pill, total price, lead time, validity, and primary action.
- Include a designated part-render / uploaded CAD preview area for each line item requested in the quote. It can be a beautiful placeholder, but don't worry about the logic - this will be resolved later in the final app with an Autodesk API. This should accommodate multiple parts for a given quote.
- Include a buyer action panel. For quoted RFQs, the primary action should be something like "Accept quote" or "Proceed to purchase." For pending RFQs, show the current next step instead.
- Include a quote breakdown section with line items, quantity, process, material, unit price, and subtotal.
- Include manufacturing requirements: material, process, tolerance, finish, inspection / quality documentation requirements, and notes.
- Include reviewed files, such as CAD files and drawings.
- Include assumptions / clarifications in a calm, readable format.
- Include quote activity or timeline, but keep it subtle and not visually noisy.
- Include supplier basis or production confidence information only if it helps the buyer trust the quote. Do not expose messy internal vendor details.
- Make the design responsive, but focus first on a polished desktop app layout.

## Visual Direction

- Light neutral background.
- White surfaces with subtle borders and soft shadows.
- Rounded corners should be modest, around 6-8px.
- Use compact but readable typography.
- Use muted status colors only in pills or small accents.
- Avoid oversized hero sections, decorative gradients, bokeh/orbs, marketing cards, or playful illustrations.
- Avoid dense spreadsheet styling; this should feel premium but still operational.
- The page should feel connected to the redesigned Quotes list: same spacing rhythm, same neutral palette, same status pill language.

## Suggested Content

- RFQ reference: LQ-DEMO-QUO
- Title: Sensor enclosure production run
- Status: Ready to accept
- Buyer company: Amogy Manufacturing
- Part: Mounting bracket
- Material: 6061-T6 Aluminum
- Process: CNC milling
- Quantity: 24
- Quote total: $1,485
- Lead time: 18 days
- Valid until: June 14, 2026
- Due date requested: June 12, 2026

Files reviewed:

- mounting-bracket.step
- tolerance-drawing.pdf

Manufacturing requirements:

- General tolerance: +/- 0.005 in
- Finish: As machined
- Inspection: Standard inspection report

Assumptions:

- CAD file is latest revision
- Quote excludes expedited shipping and taxes
- Price assumes one production run of 24 units

Next step: Review quote and proceed to purchase.

## Deliverable

Create a polished, high-fidelity quote detail page template for Lattice OS. The result should be ready for engineering implementation and should clearly show the desktop layout, component hierarchy, and all important content states.
